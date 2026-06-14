import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UsersService } from '../users/users.service';
import { CaregiversService } from '@modules/caregivers/caregivers.service';
import { BookingPricing } from './domain/booking.pricing';
import { BookingValidation } from './domain/booking.validation';
import { BookingLocation } from './domain/booking.location';
import { RedisService } from 'src/redis/redis.service';
import { Job, Queue } from 'bullmq';
import { BOOKINGS_QUEUE } from './queues/bookings.queue.module';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    private readonly usersService: UsersService,
    private readonly caregiversService: CaregiversService,
    private readonly redisService: RedisService,
    @Inject(BOOKINGS_QUEUE)
    private readonly bookingsQueue: Queue,  
  ) {}

  private normalizeLocation(value?: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[,\.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isSameCityOrState(a?: string, b?: string): boolean {
    const normalizedA = this.normalizeLocation(a);
    const normalizedB = this.normalizeLocation(b);
    if (!normalizedA || !normalizedB) return false;
    if (normalizedA === normalizedB) return true;

    const aParts = normalizedA.split(' ');
    const bParts = normalizedB.split(' ');
    const aCity = aParts[0] || '';
    const bCity = bParts[0] || '';
    const aState = aParts[aParts.length - 1] || '';
    const bState = bParts[bParts.length - 1] || '';

    if (aCity && bCity && aCity === bCity) return true;
    if (aState && bState && aState === bState) return true;

    return aParts.some((part) => bParts.includes(part)) || bParts.some((part) => aParts.includes(part));
  }

  async create(tutorId: string, dto: CreateBookingDto): Promise<{ jobId: string }> {
    const start = new Date(dto.startDate).toISOString();
    const end = new Date(dto.endDate).toISOString();

    const jobId = `booking:${dto.caregiverId}:${start}:${end}`;

    const job: Job = await this.bookingsQueue.add(
      'create-booking',
      { tutorId, dto },
      {
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false, // importante pra debug
      },
    );

    return {
      jobId: job.id!,
    };
  }

  async createDirect(
    tutorId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    const caregiver = await this.usersService.findById(createBookingDto.caregiverId);

    if (!caregiver || caregiver.role !== 'caregiver') {
      throw new NotFoundException('Cuidador não encontrado');
    }

    const tutor = await this.usersService.findById(tutorId);

    if (!tutor.location || !caregiver.location) {
      throw new BadRequestException('Localização obrigatória');
    }

    if (!this.isSameCityOrState(tutor.location, caregiver.location)) {
      throw new BadRequestException('Cuidador fora da sua região');
    }

    const startDate = new Date(createBookingDto.startDate);
    const endDate = new Date(createBookingDto.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas inválidas');
    }

    if (endDate < startDate) {
      throw new BadRequestException('Data inválida');
    }

    const session = await this.bookingModel.db.startSession();

    try {
      let saved: BookingDocument;

      await session.withTransaction(async () => {
        // 🔥 ATOMIC OVERLAP CHECK (dentro da transaction)
        const conflict = await this.bookingModel
          .findOne({
            caregiverId: new Types.ObjectId(createBookingDto.caregiverId),
            status: {
              $in: [
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS,
              ],
            },
            $or: [
              {
                startDate: { $lte: endDate },
                endDate: { $gte: startDate },
              },
            ],
          })
          .session(session)
          .lean();

        if (conflict) {
          throw new BadRequestException('Já existe reserva nesse período');
        }

        const pet = await this.usersService.findPetById(createBookingDto.petId);

        if (pet.userId?.toString() !== tutorId) {
          throw new BadRequestException('Pet não pertence ao tutor');
        }

        const caregiverPets =
          caregiver.petsQuantity?.map((p: any) => p.type) || [];

        if (!caregiverPets.includes(pet.type)) {
          throw new BadRequestException('Tipo de pet não aceito');
        }

        if (pet.type === 'dog') {
          const dog = caregiver.petsQuantity?.find((p: any) => p.type === 'dog');
          if (!dog?.sizes?.includes(pet.size)) {
            throw new BadRequestException('Porte do cão não aceito');
          }
        }

        const serviceType = createBookingDto.serviceType?.trim();
        if (!serviceType) throw new BadRequestException('Serviço inválido');

        const service = caregiver.services?.find(
          (s: any) =>
            s.name.toLowerCase() === serviceType.toLowerCase(),
        );

        const totalDays = Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000),
        );

        const pricePerDay = service?.price ?? caregiver.price ?? 0;

        const [booking] = await this.bookingModel.create(
          [
            {
              tutorId: new Types.ObjectId(tutorId),
              caregiverId: new Types.ObjectId(createBookingDto.caregiverId),
              petId: new Types.ObjectId(createBookingDto.petId),
              startDate,
              endDate,
              serviceType,
              location: createBookingDto.location,
              startTime: createBookingDto.startTime,
              endTime: createBookingDto.endTime,
              totalDays,
              pricePerDay,
              totalPrice: totalDays * pricePerDay,
              notes: createBookingDto.notes,
              paymentMethod:
                createBookingDto.paymentMethod ?? 'pay_on_service',
            },
          ],
          { session },
        );

        saved = booking;
      });

      return saved!;
    } finally {
      await session.endSession();
    }
  }

  async findByTutor(tutorId: string): Promise<BookingDocument[]> {
    const bookings = await this.bookingModel
      .find({ tutorId: new Types.ObjectId(tutorId) })
      .populate('caregiverId', 'name avatar location rating')
      .populate('petId')
      .sort({ createdAt: -1 })
      .exec();

    // Ensure paymentMethod is exposed in the response object
    return bookings.map((b) => {
      const obj: any = b.toObject ? b.toObject() : b;
      obj.paymentMethod = obj.paymentMethod ?? b.paymentMethod;
      return obj as BookingDocument;
    });
  }

  async findByCaregiver(caregiverId: string): Promise<BookingDocument[]> {
    const bookings = await this.bookingModel
      .find({ caregiverId: new Types.ObjectId(caregiverId) })
      .populate('tutorId', 'name email')
      .populate('petId')
      .sort({ createdAt: -1 })
      .exec();

    return bookings.map((b) => {
      const obj: any = b.toObject ? b.toObject() : b;
      obj.paymentMethod = obj.paymentMethod ?? b.paymentMethod;
      return obj as BookingDocument;
    });
  }

  async findOne(id: string): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    const booking = await this.bookingModel
      .findById(id)
      .populate('tutorId', 'name email')
      .populate('caregiverId', 'name avatar location rating price')
      .populate('petId')
      .exec();

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    const obj: any = booking.toObject ? booking.toObject() : booking;
    obj.paymentMethod = obj.paymentMethod ?? booking.paymentMethod;
    return obj as BookingDocument;
  }

  async confirmBooking(
    id: string,
    caregiverId: string,
    location?: string,
  ): Promise<BookingDocument> {
    const booking = await this.getBookingByIdOrThrow(id);
    this.ensureCaregiverOwner(booking, caregiverId);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        'Apenas reservas pendentes podem ser confirmadas',
      );
    }

    booking.status = BookingStatus.CONFIRMED;

    if (location?.trim()) {
      booking.location = location.trim();
    }

    return booking.save();
  }

  async startBooking(id: string, caregiverId: string): Promise<BookingDocument> {
    const booking = await this.getBookingByIdOrThrow(id);
    this.ensureCaregiverOwner(booking, caregiverId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Somente reservas confirmadas podem ser iniciadas',
      );
    }

    if (!this.isTodayWithinServicePeriod(booking)) {
      throw new BadRequestException(
        'O serviço só pode ser iniciado no período agendado',
      );
    }

    booking.status = BookingStatus.IN_PROGRESS;
    return booking.save();
  }

  async completeBooking(id: string, caregiverId: string): Promise<BookingDocument> {
    const booking = await this.getBookingByIdOrThrow(id);
    this.ensureCaregiverOwner(booking, caregiverId);

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Somente reservas em andamento podem ser concluídas',
      );
    }

    booking.status = BookingStatus.COMPLETED;
    return booking.save();
  }

  async cancel(id: string, userId: string): Promise<BookingDocument> {
    const booking = await this.getBookingByIdOrThrow(id);
    const isTutor = booking.tutorId.toString() === userId;
    const isCaregiver = booking.caregiverId.toString() === userId;

    if (!isTutor && !isCaregiver) {
      throw new ForbiddenException('Você não pode cancelar esta reserva');
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException('Esta reserva não pode mais ser cancelada');
    }

    booking.status = BookingStatus.CANCELLED;
    return booking.save();
  }

  async submitReview(
    bookingId: string,
    tutorId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new NotFoundException('ID inválido');
    }

    const booking = await this.bookingModel.findById(bookingId).exec();

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (booking.tutorId.toString() !== tutorId) {
      throw new ForbiddenException('Você não pode avaliar esta reserva');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'A avaliação só pode ser enviada após a conclusão da reserva',
      );
    }

    if (booking.review?.rating) {
      throw new BadRequestException('Esta reserva já foi avaliada');
    }

    booking.review = {
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      createdAt: new Date(),
    };

    const updatedBooking = await booking.save();

    await this.recalculateCaregiverRating(booking.caregiverId.toString());

    return updatedBooking;
  }

  private async getBookingByIdOrThrow(id: string): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    const booking = await this.bookingModel.findById(id).exec();

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    return booking;
  }

  private ensureCaregiverOwner(
    booking: BookingDocument,
    caregiverId: string,
  ): void {
    if (booking.caregiverId.toString() !== caregiverId) {
      throw new ForbiddenException(
        'Apenas o cuidador responsável pode alterar esta reserva',
      );
    }
  }

  private isTodayWithinServicePeriod(booking: BookingDocument): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = this.toLocalDay(new Date(booking.startDate));
    const end = this.toLocalDay(new Date(booking.endDate));

    return today >= start && today <= end;
  }

  private toLocalDay(date: Date): Date {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    );
  }

  private async recalculateCaregiverRating(caregiverId: string): Promise<void> {
    const caregiverObjectId = new Types.ObjectId(caregiverId);

    const [stats] = await this.bookingModel.aggregate<{
      _id: null;
      avgRating: number;
      reviewsCount: number;
    }>([
      {
        $match: {
          caregiverId: caregiverObjectId,
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

    await this.caregiversService.updateCaregiverRating(
      caregiverId,
    );
  }

  private async checkAvailability(
    caregiverId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const conflict = await this.bookingModel.findOne({
      caregiverId: new Types.ObjectId(caregiverId),
      status: {
        $in: [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.IN_PROGRESS,
        ],
      },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    });

    return !conflict;
  }

  private async blockCalendarSlot(
    caregiverId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const key = `calendar:${caregiverId}`;

    const existing = await this.redisService.get(key);
    const calendar = existing ? JSON.parse(existing) : [];

    calendar.push({
      startDate,
      endDate,
    });

    await this.redisService.set(key, JSON.stringify(calendar), 60 * 60 * 24);
  }
}

