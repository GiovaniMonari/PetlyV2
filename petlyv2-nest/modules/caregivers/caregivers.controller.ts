import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { CreateCaregiverDto, CaregiverType } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';
import { ServiceDto, SERVICE_DEFAULTS, ServiceType } from './dto/service-dto';
import { UpdateServiceDto } from './dto/update-services.dto';
import { PetsQuantityDto } from './dto/pets-quantity.dto';
import { AvailabilityDto } from './dto/availability.dto';

@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Post()
  create(@Body() createCaregiverDto: CreateCaregiverDto) {
    return this.caregiversService.create(createCaregiverDto);
  }

  /**
   * GET /api/caregivers
   * Supports filtering by type, location, maxPrice, and sorting
   * Used by the /cuidadores page on the frontend
   */
  @Get()
  findAll(
    @Query('type') type?: CaregiverType,
    @Query('location') location?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('specialty') specialty?: string,
    @Query('name') name?: string,
  ) {
    return this.caregiversService.findFiltered({
      type,
      location,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      specialty,
      name,
    });
  }

  @Get('service-types')
  getServiceTypes() {
    return (Object.values(ServiceType) as ServiceType[]).map((type) => {
      const defaultValue = SERVICE_DEFAULTS[type];
      return {
        type,
        name: defaultValue.name,
        description: defaultValue.description,
        durations: Array.isArray(defaultValue.duration)
          ? defaultValue.duration
          : [defaultValue.duration],
      };
    });
  }

  @Get('pet-types')
  getPetTypes() {
    return Object.values(CaregiverType);
  }

  @Get('pets-quantities')
  getPetsQuantities() {
    return Object.values(PetsQuantityDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.caregiversService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCaregiverDto: UpdateCaregiverDto,
  ) {
    return this.caregiversService.update(id, updateCaregiverDto);
  }

  @Patch(':id/services/:type')
  updateService(
    @Param('id') id: string,
    @Param('type') type: ServiceDto['type'],
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.caregiversService.updateService(id, type, updateServiceDto);
  }

  @Post(':id/availability')
  addAvailability(
    @Param('id') id: string,
    @Body() availability: AvailabilityDto,
  ) {
    return this.caregiversService.addAvailability(id, availability);
  }

  @Patch(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @Body() availability: AvailabilityDto,
  ) {
    return this.caregiversService.updateAvailability(id, availability);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.caregiversService.remove(id);
  }
}
