import { Model, Types } from "mongoose";
import { CaregiverProfile, CaregiverProfileDocument } from "./schemas/caregiver.schema";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateCaregiverDto,
  CaregiverType,
} from "./dto/create-caregiver.dto";
import { UpdateCaregiverDto } from "./dto/update-caregiver.dto";
import { ServiceDto } from "./dto/service-dto";
import { UpdateServiceDto } from "./dto/update-services.dto";
import * as bcrypt from "bcrypt";
import { AvailabilityDto } from "./dto/availability.dto";
import { Booking, BookingDocument } from "@modules/bookings/schemas/booking.schema";
import { User, UserDocument, UserRole } from "@modules/users/schemas/user.schema";
import { CaregiverAssembler } from "./asssembler/caregiver.assembler";
import { CaregiverProfileLean } from "./lean/caregiver.lean";
import { UserLean } from "@modules/users/lean/user.lean";
import { SortOrder } from 'mongoose';
import { RedisService } from 'src/redis/redis.service';

const SERVICE_DEFAULTS: Record<
  ServiceDto["type"],
  { name: string; description: string }
> = {
  walk: {
    name: "Passeio",
    description: "Passeio diário com o pet",
  },
  boarding: {
    name: "Hospedagem",
    description: "Cuidados 24h",
  },
  daycare: {
    name: "Creche",
    description: "Atividades e socialização durante o dia",
  },
  grooming: {
    name: "Banho e tosa",
    description: "Higiene completa do pet",
  },
  training: {
    name: "Adestramento",
    description: "Treinamento básico ou avançado",
  },
};

@Injectable()
export class CaregiversService {
  constructor(
  @InjectModel(CaregiverProfile.name)
  private caregiverProfileModel: Model<CaregiverProfileDocument>,

  @InjectModel(User.name)
  private userModel: Model<UserDocument>,

  @InjectModel(Booking.name)
  private reviewModel: Model<BookingDocument>,

  private readonly assembler: CaregiverAssembler,
  private readonly redisService: RedisService,

) {}

  // --------------------------
  // CREATE
  // --------------------------
  async create(dto: CreateCaregiverDto) {
    const existing = await this.userModel.findOne({ email: dto.email });

    if (existing) {
      throw new BadRequestException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.CAREGIVER,
    });

    const profile = await this.caregiverProfileModel.create({
      userId: user._id,
      cpf: dto.cpf,
      bio: dto.bio,
      specialties: dto.specialties ?? [],
      petTypes: dto.petTypes ?? [],
      petsQuantity: dto.petsQuantity ?? [],
      services: this.mapServices(dto.services),
      availability: dto.availability ?? [],
      rating: 0,
      reviewsCount: 0,
      price: 0,
      minPrice: 0,
      maxPrice: 0,
    });

    return this.assemble(profile);
  }

  // --------------------------
  // FIND ONE
  // --------------------------
async findOne(profileId: string) {
  this.validateId(profileId);

  const cacheKey = `caregiver:profile:${profileId}`;
  const cached = await this.redisService.get(cacheKey);
  if (cached) return cached;

  const profile = await this.caregiverProfileModel
    .findById(profileId)
    .lean<CaregiverProfileLean>();

  if (!profile) throw new NotFoundException();

  const user = await this.userModel
    .findById(profile.userId)
    .select('name email avatar location isActive role')
    .lean<UserLean>();

  const bookings = await this.reviewModel.find({
    caregiverId: profile.userId,
    status: { $in: ['pending', 'confirmed', 'in_progress'] },
  }).select('startDate endDate startTime endTime').lean();

  const blockedDates: string[] = [];
  const blockedTimeSlots: string[] = [];

  for (const b of bookings) {
    if (!b.startDate || !b.endDate) continue;

    const isShortService = !!(b.startTime && b.endTime);

    if (isShortService) {
      // Short service (e.g. walk, grooming): only block the specific time slot,
      // not the entire day. Format: "YYYY-MM-DD@HH:mm"
      const dateStr = new Date(b.startDate).toISOString().split('T')[0];
      blockedTimeSlots.push(`${dateStr}@${b.startTime}`);
    } else {
      // Full-day service (e.g. boarding, daycare): block every day in the range
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        blockedDates.push(d.toISOString().split('T')[0]);
      }
    }
  }

  const manualBlockedDates = Array.isArray(profile.blockedDates)
    ? profile.blockedDates
    : [];
  const manualBlockedTimeSlots = Array.isArray(profile.blockedTimeSlots)
    ? profile.blockedTimeSlots
    : [];

  const uniqueBlockedDates = Array.from(new Set([
    ...manualBlockedDates,
    ...blockedDates,
  ]));
  const uniqueBlockedTimeSlots = Array.from(new Set([
    ...manualBlockedTimeSlots,
    ...blockedTimeSlots,
  ]));

  const result = this.assemble(profile, user, uniqueBlockedDates, uniqueBlockedTimeSlots);
  await this.redisService.set(cacheKey, JSON.stringify(result), 3600000);
  return result;
}

  // --------------------------
  // FIND ALL
  // --------------------------
  async findAll() {
  const cacheKey = 'caregivers:all';
  const cached = await this.redisService.get(cacheKey);
  if (cached) return cached;

  const profiles = await this.caregiverProfileModel
    .find()
    .lean<CaregiverProfileLean[]>();

  const userIds = profiles.map(p => p.userId);

  const users = await this.userModel
    .find({ _id: { $in: userIds } })
    .select('name email avatar location isActive role')
    .lean<UserLean[]>();

  const userMap = new Map(
    users.map(u => [u._id.toString(), u]),
  );

  const result = this.assembleMany(profiles, userMap);
  await this.redisService.set(cacheKey, JSON.stringify(result), 3600000);
  return result;
}

  // --------------------------
  // FILTERED SEARCH
  // --------------------------
  async findFiltered(filters: {
    type?: string;
    location?: string;
    name?: string;
    maxPrice?: number;
    sortBy?: string;
  }) {
    const cacheKey = `caregivers:search:${JSON.stringify(filters)}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const query: any = {};

    if (filters.type) {
      query.petTypes = {
        $in: [filters.type],
      };
    }

    if (filters.maxPrice) {
      query.minPrice = { $lte: filters.maxPrice };
    }

    const userQuery: any = {};

    if (filters.name) {
      userQuery.name = {
        $regex: filters.name,
        $options: 'i',
      };
    }

    if (filters.location) {
      userQuery.location = {
        $regex: filters.location,
        $options: 'i',
      };
    }

    if (Object.keys(userQuery).length) {
      const users = await this.userModel
        .find(userQuery)
        .select('_id')
        .lean();

      query.userId = {
        $in: users.map(u => u._id),
      };
    }

    const sort: Record<string, SortOrder> =
      filters.sortBy === 'rating'
        ? { rating: -1 }
        : filters.sortBy === 'price_asc'
        ? { minPrice: 1 }
        : filters.sortBy === 'price_desc'
        ? { minPrice: -1 }
        : { createdAt: -1 };

    const profiles = await this.caregiverProfileModel
      .find(query)
      .sort(sort)
      .lean<CaregiverProfileLean[]>();

    const userIds = profiles.map(p => p.userId);

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('name email avatar location isActive role')
      .lean<UserLean[]>();

    const userMap = new Map(
      users.map(u => [u._id.toString(), u]),
    );

    const result = this.assembleMany(profiles, userMap);
    await this.redisService.set(cacheKey, JSON.stringify(result), 3600000);
    return result;
  }

  async findProfileByUserId(userId: string) {
    const profile = await this.caregiverProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) {
      throw new NotFoundException(
        'Perfil do cuidador não encontrado',
      );
    }

    return profile;
  }

  async findDashboardProfile(userId: string): Promise<any> {
    this.validateId(userId);

    const [user, profile] = await Promise.all([
      this.userModel
        .findById(userId)
        .select('name email avatar location isActive role')
        .lean<UserLean>(),
      this.caregiverProfileModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean<CaregiverProfileLean>(),
    ]);

    if (!profile) {
      throw new NotFoundException('Perfil do cuidador não encontrado');
    }

    return {
      ...profile,
      user,
      role: user?.role,
    };
  }

  getServiceTypes() {
    return Object.entries(SERVICE_DEFAULTS).map(([type, info]) => ({
      type,
      ...info,
      durations: type === 'walk' ? ['30min', '60min'] : ['60min'],
    }));
  }

  async updateProfileByUserId(userId: string, dto: UpdateCaregiverDto) {
    this.validateId(userId);

    const profile = await this.findProfileByUserId(userId);
    return this.updateProfile(profile._id.toString(), dto);
  }
  // --------------------------
  // UPDATE PROFILE (ONLY FIELDS)
  // --------------------------
  async updateProfile(id: string, dto: UpdateCaregiverDto) {
    this.validateId(id);

    const updated = await this.caregiverProfileModel.findByIdAndUpdate(
      id,
      {
        $set: {
          bio: dto.bio,
          specialties: dto.specialties,
          petTypes: dto.petTypes,
          petsQuantity: dto.petQuantities,
          availability: dto.availability,
          blockedDates: dto.blockedDates,
          blockedTimeSlots: dto.blockedTimeSlots,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Caregiver não encontrado');
    }

    await this.invalidateCaregiverCache(id);

    return updated;
  }

  // --------------------------
  // UPDATE SERVICES (FULL REPLACE)
  // --------------------------
  async updateServices(id: string, services: ServiceDto[]) {
    this.validateId(id);

    const mapped = this.mapServices(services);

    const prices = mapped.map(s => Number(s.price)).filter(Boolean);

    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    const updated = await this.caregiverProfileModel.findByIdAndUpdate(
      id,
      {
        $set: {
          services: mapped,
          minPrice,
          maxPrice,
          price: minPrice,
        },
      },
      { new: true },
    );

    if (!updated) throw new NotFoundException();

    await this.invalidateCaregiverCache(id);

    return updated;
  }

  // --------------------------
  // UPDATE SINGLE SERVICE (UPSERT)
  // --------------------------
  async updateService(id: string, type: ServiceDto['type'], dto: UpdateServiceDto) {
    this.validateId(id);

    const base = SERVICE_DEFAULTS[type];

    const updated = await this.caregiverProfileModel.findOneAndUpdate(
      { _id: id, 'services.type': type },
      {
        $set: {
          'services.$.name': base.name,
          'services.$.description': base.description,
          ...(dto.price !== undefined && {
            'services.$.price': dto.price,
          }),
        },
      },
      { new: true },
    );

    if (updated) {
      const result = await this.recalculatePrices(updated);
      await this.invalidateCaregiverCache(id);
      return result;
    }

    if (!(await this.caregiverProfileModel.exists({ _id: id }))) {
      throw new NotFoundException();
    }

    const newService = {
      type,
      price: dto.price ?? 0,
      name: base.name,
      description: base.description,
    };

    const created = await this.caregiverProfileModel.findByIdAndUpdate(
      id,
      { $push: { services: newService } },
      { new: true },
    );

    const result = await this.recalculatePrices(created!);
    await this.invalidateCaregiverCache(id);
    return result;
  }

  // --------------------------
  // AVAILABILITY (PUSH)
  // --------------------------
  async addAvailability(id: string, dto: AvailabilityDto) {
    this.validateId(id);

    const result = await this.caregiverProfileModel.findByIdAndUpdate(
      id,
      { $push: { availability: dto } },
      { new: true },
    );
    await this.invalidateCaregiverCache(id);
    return result;
  }

  async updateAvailability(id: string, dto: AvailabilityDto[]) {
    this.validateId(id);

    const result = await this.caregiverProfileModel.findByIdAndUpdate(
      id,
      { $set: { availability: dto } },
      { new: true },
    );
    await this.invalidateCaregiverCache(id);
    return result;
  }

  // --------------------------
  // REMOVE
  // --------------------------
  async remove(id: string) {
    this.validateId(id);

    const profile = await this.caregiverProfileModel.findById(id);
    if (!profile) throw new NotFoundException();

    await this.userModel.findByIdAndUpdate(profile.userId, {
      role: UserRole.TUTOR,
    });

    await this.caregiverProfileModel.deleteOne({ _id: id });
    await this.invalidateCaregiverCache(id);
  }

  // --------------------------
  // REVIEWS
  // --------------------------
  async findMyReviews(id: string) {
    this.validateId(id);
    const objectId = new Types.ObjectId(id);

    // `caregiverId` in bookings stores the caregiver's **userId**, not the profile _id.
    // We try both to be resilient to different callers.
    let bookings = await this.reviewModel
      .find({
        caregiverId: objectId,
        'review.rating': { $exists: true },
      })
      .populate('tutorId', 'name avatar')
      .lean();

    if (bookings.length === 0) {
      // Caller might have passed the caregiver profile _id — resolve the userId
      const caregiverProfile = await this.caregiverProfileModel
        .findById(objectId)
        .lean();
      if (caregiverProfile) {
        bookings = await this.reviewModel
          .find({
            caregiverId: caregiverProfile.userId,
            'review.rating': { $exists: true },
          })
          .populate('tutorId', 'name avatar')
          .lean();
      }
    }

    return bookings.map((b: any) => ({
      ...b.review,
      tutorName: b.tutorId?.name ?? 'Tutor',
      tutorAvatar: b.tutorId?.avatar ?? null,
      serviceType: b.serviceType ?? null,
      endDate: b.endDate ?? null,
    }));
  }

  async updateCaregiverRating(caregiverUserId: string) {
    // `caregiverId` on bookings stores the caregiver's **userId**.
    const userObjectId = new Types.ObjectId(caregiverUserId);

    const [stats] = await this.reviewModel.aggregate<{
      _id: null;
      avgRating: number;
      reviewsCount: number;
    }>([
      {
        $match: {
          caregiverId: userObjectId,
          'review.rating': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$review.rating' },
          reviewsCount: { $sum: 1 },
        },
      },
    ]);

    const rating = stats?.avgRating ?? 0;
    const reviewsCount = stats?.reviewsCount ?? 0;

    // Update the caregiver profile that belongs to this user
    const profile = await this.caregiverProfileModel.findOneAndUpdate(
      { userId: userObjectId },
      { rating: Math.round(rating * 10) / 10, reviewsCount },
      { new: true },
    );

    if (profile) {
      await this.invalidateCaregiverCache(profile._id.toString());
    }
    await this.invalidateCaregiverCache(caregiverUserId);
  }
  // --------------------------
  // HELPERS
  // --------------------------
  async invalidateCaregiverCache(id: string) {
    await this.redisService.del(`caregiver:profile:${id}`);
    await this.redisService.del('caregivers:all');
    await this.redisService.delPattern('caregivers:search:*');
  }
  private mapServices(services?: ServiceDto[]) {
    if (!services) return [];

    return services.map(s => ({
      ...s,
      name: SERVICE_DEFAULTS[s.type].name,
      description: SERVICE_DEFAULTS[s.type].description,
    }));
  }

  private recalculatePrices(profile: CaregiverProfileDocument) {
    const prices = profile.services
      .map(s => Number(s.price))
      .filter(p => !isNaN(p));

    profile.minPrice = prices.length ? Math.min(...prices) : 0;
    profile.maxPrice = prices.length ? Math.max(...prices) : 0;
    profile.price = profile.minPrice;

    return profile.save();
  }

  private assemble(profile, user?, blockedDates?: string[], blockedTimeSlots?: string[]) {
  return {
    id: profile._id,
    user,
    profile: {
      ...profile,
      blockedDates: blockedDates || [],
      blockedTimeSlots: blockedTimeSlots || [],
    },
  };
}

  private assembleMany(profiles, userMap: Map<string, any>) {
  return profiles
    .map(p => ({
      id: p._id,
      user: userMap.get(p.userId.toString()),
      profile: p,
    }))
    .filter(item => item.user);
}

  private validateId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }
  }
}
