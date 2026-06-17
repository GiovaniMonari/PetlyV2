import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    private readonly usersService: UsersService,
    private readonly caregiversService: CaregiversService,
    private readonly redisService: RedisService,
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

  async createDirect(
    tutorId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    const caregiverUser = await this.usersService.findById(
      createBookingDto.caregiverId,
    );

    const caregiverProfile =
      await this.caregiversService.findProfileByUserId(
        createBookingDto.caregiverId,
      );

    if (!caregiverUser || caregiverUser.role !== 'caregiver') {
      throw new NotFoundException('Cuidador não encontrado');
    }

    const tutor = await this.usersService.findById(tutorId);

    if (!tutor.location || !caregiverUser.location) {
      throw new BadRequestException('Localização obrigatória');
    }

    if (!this.isSameCityOrState(tutor.location, caregiverUser.location)) {
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

    // 🔥 overlap check — time-aware for short services (walk, grooming, etc.)
    //
    // A booking is considered a "short service" when startTime is present (e.g. walk, grooming).
    // We intentionally use only startTime — endTime may be absent or null depending on the client.
    // Full-day services (boarding, daycare) have no startTime.
    const isShortService = !!(createBookingDto.startTime);

    // Helper: convert "HH:mm" to total minutes for numeric overlap check
    const toMinutes = (t: string): number => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    let hasConflict = false;

    if (isShortService) {
      // Two short-service bookings on the same day can coexist as long as their
      // time windows don't overlap. We also prevent a short service from being
      // booked on a day already taken by a full-day service.

      type LeanBooking = { startTime?: string | null; endTime?: string | null };

      const activeStatuses = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
      ];

      // 1. Check for an existing full-day service on the same date range
      const fullDayConflict = await this.bookingModel.findOne({
        caregiverId: new Types.ObjectId(createBookingDto.caregiverId),
        status: { $in: activeStatuses },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
        startTime: { $in: [null, undefined] },
      });

      if (fullDayConflict) {
        hasConflict = true;
      } else {
        // 2. Check for time-slot overlap with other short-service bookings on the same day
        const shortServiceBookings = await this.bookingModel
          .find({
            caregiverId: new Types.ObjectId(createBookingDto.caregiverId),
            status: { $in: activeStatuses },
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
            startTime: { $exists: true, $ne: null },
          })
          .select('startTime endTime')
          .lean<LeanBooking[]>();

        const newStart = toMinutes(createBookingDto.startTime);
        // If endTime is absent, assume a 1-hour slot as a safe default
        const newEnd = createBookingDto.endTime
          ? toMinutes(createBookingDto.endTime)
          : newStart + 60;

        hasConflict = shortServiceBookings.some((b) => {
          if (!b.startTime) return false;
          const existingStart = toMinutes(b.startTime);
          // If the existing booking has no endTime, treat it as a 1-hour slot
          const existingEnd = b.endTime ? toMinutes(b.endTime) : existingStart + 60;
          return existingStart < newEnd && existingEnd > newStart;
        });
      }
    } else {
      // Full-day service: block if there is ANY active booking in the date range
      // (both full-day and short-service bookings block a new full-day booking).
      const fullDayConflict = await this.bookingModel.findOne({
        caregiverId: new Types.ObjectId(createBookingDto.caregiverId),
        status: {
          $in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
          ],
        },
        $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
      });

      hasConflict = fullDayConflict !== null;
    }

    if (hasConflict) {
      throw new BadRequestException('Já existe reserva nesse período');
    }

    const pet = await this.usersService.findPetById(createBookingDto.petId);

    if (pet.userId?.toString() !== tutorId) {
      throw new BadRequestException('Pet não pertence ao tutor');
    }

    const caregiverPets =
      caregiverProfile.petsQuantity?.map((p: any) => p.type) || [];

    if (!caregiverPets.includes(pet.type)) {
      throw new BadRequestException('Tipo de pet não aceito');
    }

    if (pet.type === 'dog') {
      const dog = caregiverProfile.petsQuantity?.find(
        (p: any) => p.type === 'dog',
      );

      if (!dog?.sizes?.includes(pet.size)) {
        throw new BadRequestException('Porte do cão não aceito');
      }
    }

    const serviceType = createBookingDto.serviceType?.trim();
    if (!serviceType) throw new BadRequestException('Serviço inválido');

    console.log(
      caregiverProfile.services.map(s => ({
        name: s.name,
        lower: s.name?.toLowerCase(),
      })),
    );

    console.log('buscando:', serviceType.toLowerCase());

    const service = caregiverProfile.services.find(
      s => s.name?.toLowerCase() === serviceType.toLowerCase(),
    );

    if (!service) {
      throw new BadRequestException(
        `Serviço '${serviceType}' não encontrado para este cuidador`,
      );
    }

    const isShortServiceByDuration = this.isShortServiceDuration(service.duration);

    if (isShortServiceByDuration && !createBookingDto.startTime) {
      throw new BadRequestException('Selecione um horário para este serviço');
    }

    this.ensureNotManuallyBlocked(
      caregiverProfile,
      startDate,
      endDate,
      createBookingDto.startTime,
    );

    this.ensureCaregiverAvailability(
      caregiverProfile,
      service.type,
      service.name,
      startDate,
      endDate,
      createBookingDto.startTime,
    );

    const totalDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000),
    );

    const pricePerDay = service?.price ?? caregiverProfile.minPrice ?? 0;

    const [booking] = await this.bookingModel.create([
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
        paymentMethod: createBookingDto.paymentMethod ?? 'pay_on_service',
      },
    ]);

    await this.caregiversService.invalidateCaregiverCache(createBookingDto.caregiverId);

    return booking;
  }

  async findByTutor(tutorId: string) {
    return this.bookingModel
      .find({ tutorId: new Types.ObjectId(tutorId) })
      .populate('caregiverId', 'name avatar location')
      .populate('petId', 'name type age avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findByCaregiver(caregiverId: string): Promise<BookingDocument[]> {
    const bookings = await this.bookingModel
      .find({ caregiverId: new Types.ObjectId(caregiverId) })
      .populate('tutorId', 'name email avatar')
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
      .populate('tutorId', 'name email avatar')
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

    const result = await booking.save();
    await this.caregiversService.invalidateCaregiverCache(booking.caregiverId.toString());
    return result;
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
    const result = await booking.save();
    await this.caregiversService.invalidateCaregiverCache(booking.caregiverId.toString());
    return result;
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
    const result = await booking.save();
    await this.caregiversService.invalidateCaregiverCache(booking.caregiverId.toString());
    return result;
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
    const result = await booking.save();
    await this.caregiversService.invalidateCaregiverCache(booking.caregiverId.toString());
    return result;
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

  private isShortServiceDuration(duration?: string): boolean {
    const normalized = (duration || '').toLowerCase();

    return (
      normalized.includes('min') ||
      (
        normalized.includes('h') &&
        !normalized.includes('24h') &&
        !normalized.includes('12h') &&
        !normalized.includes('diária') &&
        !normalized.includes('pernoite')
      )
    );
  }

  private getDateRangeStrings(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const start = this.toLocalDay(startDate);
    const end = this.toLocalDay(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(this.formatDateKey(d));
    }

    return dates;
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private ensureNotManuallyBlocked(
    caregiverProfile: any,
    startDate: Date,
    endDate: Date,
    startTime?: string,
  ): void {
    const blockedDates = new Set(caregiverProfile.blockedDates || []);
    const blockedTimeSlots = new Set(caregiverProfile.blockedTimeSlots || []);
    const dateRange = this.getDateRangeStrings(startDate, endDate);
    const blockedDate = dateRange.find((date) => blockedDates.has(date));

    if (blockedDate) {
      throw new BadRequestException('Cuidador indisponível nesta data');
    }

    if (startTime) {
      const slotKey = `${dateRange[0]}@${startTime}`;

      if (blockedTimeSlots.has(slotKey)) {
        throw new BadRequestException('Cuidador indisponível neste horário');
      }
    }
  }

  private ensureCaregiverAvailability(
    caregiverProfile: any,
    serviceType: string,
    serviceName: string,
    startDate: Date,
    endDate: Date,
    startTime?: string,
  ): void {
    const availability = caregiverProfile.availability || [];

    if (!availability.length) return;

    const serviceAvailability = availability.find((item: any) =>
      item.service === serviceType || item.service === serviceName,
    );

    if (!serviceAvailability) {
      throw new BadRequestException('Cuidador não possui disponibilidade para este serviço');
    }

    const availableDays = new Set(serviceAvailability.availableDays || []);
    const unavailableDate = this
      .getDateRangeStrings(startDate, endDate)
      .find((date) => !availableDays.has(date));

    if (unavailableDate) {
      throw new BadRequestException('Cuidador indisponível nesta data');
    }

    if (startTime) {
      const availableHours = new Set(serviceAvailability.serviceHours || []);

      if (!availableHours.has(startTime)) {
        throw new BadRequestException('Cuidador indisponível neste horário');
      }
    }
  }

  private async recalculateCaregiverRating(caregiverId: string): Promise<void> {
    // Delegates to caregiversService which performs the correct aggregation
    // against the bookings collection using the caregiver's userId field.
    await this.caregiversService.updateCaregiverRating(caregiverId);
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
