import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';

import { CaregiversService } from './caregivers.service';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';
import { ServiceDto } from './dto/service-dto';
import { UpdateServiceDto } from './dto/update-services.dto';
import { AvailabilityDto } from './dto/availability.dto';

@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  // --------------------------
  // CREATE
  // --------------------------
  @Post()
  create(@Body() dto: CreateCaregiverDto) {
    return this.caregiversService.create(dto);
  }

  @Get()
  findAll() {
    return this.caregiversService.findAll();
  }

  // --------------------------
  // FIND ALL (FILTERED)
  // --------------------------
  @Get('filtered')
  findAllFiltered(
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('name') name?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.caregiversService.findFiltered({
      type,
      location,
      name,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
    });
  }

  // --------------------------
  // FIND ONE
  // --------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.caregiversService.findOne(id);
  }

  // --------------------------
  // UPDATE PROFILE
  // --------------------------
  @Patch(':id')
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateCaregiverDto,
  ) {
    return this.caregiversService.updateProfile(id, dto);
  }

  // --------------------------
  // SERVICES
  // --------------------------
  @Patch(':id/services')
  updateServices(
    @Param('id') id: string,
    @Body() services: ServiceDto[],
  ) {
    return this.caregiversService.updateServices(id, services);
  }

  @Patch(':id/services/:type')
  updateService(
    @Param('id') id: string,
    @Param('type') type: ServiceDto['type'],
    @Body() dto: UpdateServiceDto,
  ) {
    return this.caregiversService.updateService(id, type, dto);
  }

  // --------------------------
  // AVAILABILITY
  // --------------------------
  @Patch(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @Body() dto: AvailabilityDto[],
  ) {
    return this.caregiversService.updateAvailability(id, dto);
  }

  @Post(':id/availability')
  addAvailability(
    @Param('id') id: string,
    @Body() dto: AvailabilityDto,
  ) {
    return this.caregiversService.addAvailability(id, dto);
  }

  // --------------------------
  // REVIEWS
  // --------------------------
  @Get(':id/reviews')
  findMyReviews(@Param('id') id: string) {
    return this.caregiversService.findMyReviews(id);
  }

  // --------------------------
  // DELETE
  // --------------------------
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.caregiversService.remove(id);
  }
}