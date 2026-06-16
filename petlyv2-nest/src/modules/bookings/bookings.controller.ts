import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /api/bookings
   * Protected - Cria uma nova reserva (tutor autenticado)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.createDirect(req.user.userId, createBookingDto);
  }

  /**
   * GET /api/bookings/my
   * Protected - Lista reservas do tutor autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyBookings(@Request() req: any) {
    if (req.user.role === 'caregiver') {
      return this.bookingsService.findByCaregiver(req.user.userId);
    }
    return this.bookingsService.findByTutor(req.user.userId);
  }

  /**
   * GET /api/bookings/:id
   * Protected - Detalhes de uma reserva
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  /**
   * PATCH /api/bookings/:id/cancel
   * Protected - Cancela uma reserva
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancel(id, req.user.userId);
  }

  /**
   * PATCH /api/bookings/:id/confirm
   * Protected - Cuidador confirma reserva
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/confirm')
  confirm(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { location?: string },
  ) {
    return this.bookingsService.confirmBooking(
      id,
      req.user.userId,
      body?.location,
    );
  }

  /**
   * PATCH /api/bookings/:id/start
   * Protected - Cuidador inicia serviço no dia agendado
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/start')
  start(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.startBooking(id, req.user.userId);
  }

  /**
   * PATCH /api/bookings/:id/complete
   * Protected - Marca reserva como concluída
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  complete(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.completeBooking(id, req.user.userId);
  }

  /**
   * PATCH /api/bookings/:id/review
   * Protected - Tutor envia avaliação após serviço concluído
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/review')
  review(
    @Request() req: any,
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.bookingsService.submitReview(id, req.user.userId, createReviewDto);
  }
}