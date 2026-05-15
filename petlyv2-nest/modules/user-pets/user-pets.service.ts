import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pet } from './schemas/pets.schema';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UserPetsService {
    constructor(
        @InjectModel(Pet.name) private readonly petModel: Model<Pet>,
        private readonly usersService: UsersService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async createPet(
        userId: string,
        createPetDto: CreatePetDto,
    ): Promise<Pet> {
        const pet = await this.petModel.create({
            ...createPetDto,
            userId,
        });
        await this.usersService.addPet(userId, new Types.ObjectId(pet._id));
        return pet;
    }

    async updatePet(id: string, userId: string, updatePetDto: UpdatePetDto): Promise<Pet> {
        return this.petModel.findOneAndUpdate(
            { _id: id, userId },
            updatePetDto,
            { new: true }
        ).exec();
    }

    async deletePet(userId: string, id: string): Promise<Pet> {
        const pet = await this.petModel.findOneAndDelete({ _id: id, userId }).exec();
        if (pet) {
            await this.usersService.removePet(userId, id);
        }
        return pet;
    }

    async findAllMyPets(userId: string): Promise<Pet[]> {
        return this.petModel.find({ userId: new Types.ObjectId(userId) }).exec();
    }

    async uploadPetAvatar(petId: string, file: Express.Multer.File): Promise<Pet> {
        const pet = await this.petModel.findById(petId).exec();
        if (!pet) {
            throw new NotFoundException(`Pet with ID ${petId} not found`);
        }

        const result = await this.cloudinaryService.uploadFile(file);
        pet.avatar = result.secure_url;
        return await pet.save();
    }
}