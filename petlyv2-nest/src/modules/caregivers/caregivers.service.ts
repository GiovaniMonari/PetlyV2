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
  private caregiverModel: Model<CaregiverProfileDocument>,

  @InjectModel(User.name)
  private userModel: Model<UserDocument>,

  @InjectModel(Booking.name)
  private reviewModel: Model<BookingDocument>,

  private readonly assembler: CaregiverAssembler,

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

    const profile = await this.caregiverModel.create({
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

  const profile = await this.caregiverModel
    .findById(profileId)
    .lean<CaregiverProfileLean>();

  if (!profile) throw new NotFoundException();

  const user = await this.userModel
    .findById(profile.userId)
    .select('name email avatar location isActive role')
    .lean<UserLean>();

  return this.assemble(profile, user);
}

  // --------------------------
  // FIND ALL
  // --------------------------
  async findAll() {
  const profiles = await this.caregiverModel
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

  return this.assembleMany(profiles, userMap);
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

    const profiles = await this.caregiverModel
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

    return this.assembleMany(profiles, userMap);
  }
  // --------------------------
  // UPDATE PROFILE (ONLY FIELDS)
  // --------------------------
  async updateProfile(id: string, dto: UpdateCaregiverDto) {
    this.validateId(id);

    const updated = await this.caregiverModel.findByIdAndUpdate(
      id,
      {
        $set: {
          bio: dto.bio,
          specialties: dto.specialties,
          petTypes: dto.petTypes,
          petsQuantity: dto.petQuantities,
          availability: dto.availability,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Caregiver não encontrado');
    }

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

    const updated = await this.caregiverModel.findByIdAndUpdate(
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

    return updated;
  }

  // --------------------------
  // UPDATE SINGLE SERVICE (UPSERT)
  // --------------------------
  async updateService(id: string, type: ServiceDto['type'], dto: UpdateServiceDto) {
    this.validateId(id);

    const base = SERVICE_DEFAULTS[type];

    const updated = await this.caregiverModel.findOneAndUpdate(
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
      return this.recalculatePrices(updated);
    }

    if (!(await this.caregiverModel.exists({ _id: id }))) {
      throw new NotFoundException();
    }

    const newService = {
      type,
      price: dto.price ?? 0,
      name: base.name,
      description: base.description,
    };

    const created = await this.caregiverModel.findByIdAndUpdate(
      id,
      { $push: { services: newService } },
      { new: true },
    );

    return this.recalculatePrices(created!);
  }

  // --------------------------
  // AVAILABILITY (PUSH)
  // --------------------------
  async addAvailability(id: string, dto: AvailabilityDto) {
    this.validateId(id);

    return this.caregiverModel.findByIdAndUpdate(
      id,
      { $push: { availability: dto } },
      { new: true },
    );
  }

  async updateAvailability(id: string, dto: AvailabilityDto[]) {
    this.validateId(id);

    return this.caregiverModel.findByIdAndUpdate(
      id,
      { $set: { availability: dto } },
      { new: true },
    );
  }

  // --------------------------
  // REMOVE
  // --------------------------
  async remove(id: string) {
    this.validateId(id);

    const profile = await this.caregiverModel.findById(id);
    if (!profile) throw new NotFoundException();

    await this.userModel.findByIdAndUpdate(profile.userId, {
      role: UserRole.TUTOR,
    });

    await this.caregiverModel.deleteOne({ _id: id });
  }

  // --------------------------
  // REVIEWS
  // --------------------------
  async findMyReviews(caregiverId: string) {
    this.validateId(caregiverId);

    const bookings = await this.reviewModel
      .find({
        caregiverId,
        review: { $exists: true },
      })
      .populate('tutorId', 'name')
      .lean();

    return bookings.map((b: any) => ({
      ...b.review,
      tutorName: b.tutorId?.name,
    }));
  }

  async updateCaregiverRating(caregiverId: string) {
    const reviews = await this.reviewModel
      .find({
        caregiverId,
        review: { $exists: true },
      })
      .lean();

    const ratings = reviews.map(r => r.review.rating).filter(Boolean);

    const rating = ratings.length
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    await this.caregiverModel.findByIdAndUpdate(caregiverId, {
      rating,
      reviewsCount: ratings.length,
    });
  }
  // --------------------------
  // HELPERS
  // --------------------------
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

  private assemble(profile, user?) {
  return {
    id: profile._id,
    user,
    profile,
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