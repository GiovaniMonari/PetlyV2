import {
    Controller,
    Post,
    Body,
    Request,
    Patch,
    Delete,
    UseGuards,
    Param,
    Get,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserPetsService } from './user-pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user/pets')
@UseGuards(JwtAuthGuard)
export class UserPetsController {
    constructor(
        private readonly userPetsService: UserPetsService,
    ) { }

    @Post()
    async create(@Request() req, @Body() createPetDto: CreatePetDto) {
        const userId = req.user.userId;
        return this.userPetsService.createPet(userId, createPetDto);
    }

    @Patch(':id')
    async update(@Request() req, @Param('id') id: string, @Body() updatePetDto: UpdatePetDto) {
        const userId = req.user.userId;
        return this.userPetsService.updatePet(id, userId, updatePetDto);
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        const userId = req.user.userId;
        return this.userPetsService.deletePet(userId, id);
    }

    @Get('my-pets')
    async getMyPets(@Request() req) {
        return this.userPetsService.findAllMyPets(req.user.userId);
    }

    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.userPetsService.uploadPetAvatar(id, file);
    }
}