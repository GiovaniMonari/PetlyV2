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

  async create(
    tutorId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    // Validate caregiver exists
    const caregiver = await this.usersService.findById(createBookingDto.caregiverId);
    if (!caregiver || caregiver.role !== 'caregiver') {
      throw new NotFoundException('Cuidador não encontrado');
    }

    const startDate = new Date(createBookingDto.startDate);
    const endDate = new Date(createBookingDto.endDate);

    if (endDate <= startDate) {
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
      serviceType: normalizedServiceType,
      petsCount: createBookingDto.petsCount,
      totalDays,
      pricePerDay,
      totalPrice,
      notes: createBookingDto.notes,
    });

    return booking.save();
  }

  async findByTutor(tutorId: string): Promise<BookingDocument[]> {
    return this.bookingModel
      .find({ tutorId: new Types.ObjectId(tutorId) })
      .populate('caregiverId', 'name avatar location rating')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCaregiver(caregiverId: string): Promise<BookingDocument[]> {
    return this.bookingModel
      .find({ caregiverId: new Types.ObjectId(caregiverId) })
      .populate('tutorId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    const booking = await this.bookingModel
      .findById(id)
      .populate('tutorId', 'name email')
      .populate('caregiverId', 'name avatar location rating price')
      .exec();

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
  ): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    const booking = await this.bookingModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .exec();

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    return booking;
  }

  async cancel(id: string): Promise<BookingDocument> {
    return this.updateStatus(id, BookingStatus.CANCELLED);
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
