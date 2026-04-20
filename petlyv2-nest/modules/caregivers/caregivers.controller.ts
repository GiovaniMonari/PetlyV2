import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { CreateCaregiverDto, CaregiverType } from './dto/create-caregiver.dto';
import { UpdateCaregiverDto } from './dto/update-caregiver.dto';
import { ServiceDto } from './dto/service-dto';
import { UpdateServiceDto } from './dto/update-services.dto';

@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @Post()
  create(@Body() createCaregiverDto: CreateCaregiverDto) {
    return this.caregiversService.create(createCaregiverDto);
  }

  @Get()
  findAll(
    @Query('type') type?: CaregiverType,
    @Query('specialty') specialty?: string,
  ) {
    if (type) return this.caregiversService.findByType(type);
    if (specialty) return this.caregiversService.findBySpecialty(specialty);
    return this.caregiversService.findAll();
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.caregiversService.remove(id);
  }
}