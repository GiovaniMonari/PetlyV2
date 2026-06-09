import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    private readonly usersService: UsersService,
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

  async create(
    tutorId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    // Validate caregiver exists
    const caregiver = await this.usersService.findById(createBookingDto.caregiverId);
    if (!caregiver || caregiver.role !== 'caregiver') {
      throw new NotFoundException('Cuidador não encontrado');
    }

    const tutor = await this.usersService.findById(tutorId);
    if (!tutor.location?.trim()) {
      throw new BadRequestException('Atualize sua localização no perfil para contratar cuidadores próximos.');
    }

    if (!caregiver.location?.trim()) {
      throw new BadRequestException('Localização do cuidador não está disponível.');
    }

    if (!this.isSameCityOrState(tutor.location, caregiver.location)) {
      throw new BadRequestException(
        'Só é permitido contratar cuidadores na mesma cidade ou no mesmo estado que você.',
      );
    }

    const startDate = new Date(createBookingDto.startDate);
    const endDate = new Date(createBookingDto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('A data final deve ser posterior à data inicial');
    }

    const totalDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const normalizedServiceType = (createBookingDto.serviceType || '').trim();
    if (!normalizedServiceType) {
      throw new BadRequestException('Tipo de serviço inválido');
    }

    const pet = await this.usersService.findPetById(createBookingDto.petId);
    if (pet.userId?.toString() !== tutorId) {
      throw new BadRequestException('O pet selecionado não pertence ao tutor logado.');
    }

    const caregiverPetTypes = Array.isArray(caregiver.petsQuantity)
      ? caregiver.petsQuantity.map((entry: any) => entry.type)
      : [];

    if (!caregiverPetTypes.includes(pet.type)) {
      throw new BadRequestException('Este cuidador não atende o tipo de pet selecionado.');
    }

    if (pet.type === 'dog') {
      const dogEntry = (caregiver.petsQuantity || []).find(
        (entry: any) => entry.type === 'dog',
      );
      const acceptedSizes = Array.isArray(dogEntry?.sizes) ? dogEntry.sizes : [];

      if (acceptedSizes.length === 0) {
        throw new BadRequestException(
          'Não foi possível prosseguir porque este cuidador não informou quais portes de cão atende. Por favor, escolha outro cuidador ou confirme se ele atende o porte do seu pet.',
        );
      }

      if (!acceptedSizes.includes(pet.size)) {
        throw new BadRequestException(
          `Este cuidador não atende cães de porte ${
            pet.size === 'small' ? 'pequeno' : pet.size === 'medium' ? 'médio' : 'grande'
          }. Se o seu cão for de porte diferente, procure um cuidador que aceite esse porte.`,
        );
      }
    }

    const matchedService = (caregiver.services || []).find(
      (service: { name: string; price: number; duration: string }) =>
        service?.name?.toLowerCase() === normalizedServiceType.toLowerCase(),
    );

    const pricePerDay = matchedService?.price ?? caregiver.price ?? 0;
    const totalPrice = totalDays * pricePerDay;

    const booking = new this.bookingModel({
      tutorId: new Types.ObjectId(tutorId),
      caregiverId: new Types.ObjectId(createBookingDto.caregiverId),
      startDate,
      endDate,
      location: createBookingDto.location,
      serviceType: normalizedServiceType,
      petId: new Types.ObjectId(createBookingDto.petId),
      startTime: createBookingDto.startTime,
      endTime: createBookingDto.endTime,
      totalDays,
      pricePerDay,
      totalPrice,
      notes: createBookingDto.notes,
      paymentMethod: createBookingDto.paymentMethod ?? 'pay_on_service',
    });

    return booking.save();
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

    await this.usersService.updateCaregiverRating(
      caregiverId,
      stats?.avgRating ?? 0,
      stats?.reviewsCount ?? 0,
    );
  }
}
