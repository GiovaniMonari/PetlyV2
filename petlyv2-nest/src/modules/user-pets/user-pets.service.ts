import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pet } from './schemas/pets.schema';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CacheService } from '@modules/cache/cache.service';

@Injectable()
export class UserPetsService {
    constructor(
    @InjectModel(Pet.name)
    private readonly petModel: Model<Pet>,

    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly cacheService: CacheService,
    ) {}

    async createPet(
        userId: string,
        createPetDto: CreatePetDto,
    ): Promise<Pet> {
        const pet = await this.petModel.create({
            ...createPetDto,
            userId,
        });
        await this.usersService.addPet(
            userId,
            new Types.ObjectId(pet._id),
        );

        await this.cacheService.del(
            `user-pets:${userId}`,
        );
        return pet;
    }

    async updatePet(
        id: string,
        userId: string,
        updatePetDto: UpdatePetDto,
        ): Promise<Pet> {
        const pet = await this.petModel.findOneAndUpdate(
            { _id: id, userId },
            updatePetDto,
            { new: true },
        ).exec();

        if (!pet) {
            throw new NotFoundException('Pet não encontrado');
        }

        await this.cacheService.del(
            `user-pets:${userId}`,
        );

        return pet;
    }

    async deletePet(userId: string, id: string): Promise<Pet> {
        const pet = await this.petModel.findOneAndDelete({
            _id: id,
            userId,
        }).exec();

        if (pet) {
            await this.usersService.removePet(userId, id);

            await this.cacheService.del(
                `user-pets:${userId}`,
            );
        }

        return pet;
    }

    async findAllMyPets(userId: string): Promise<Pet[]> {
        const cacheKey = `user-pets:${userId}`;

        const cached =
            await this.cacheService.get<Pet[]>(cacheKey);

        if (cached) {
            return cached;
        }

        const pets = await this.petModel
            .find({ userId: new Types.ObjectId(userId) })
            .exec();

        await this.cacheService.set(
            cacheKey,
            pets,
            300,
        );

        return pets;
    }

    async uploadPetAvatar(
        petId: string,
        file: Express.Multer.File,
    ): Promise<Pet> {
        const pet = await this.petModel.findById(petId).exec();

        if (!pet) {
            throw new NotFoundException(
                `Pet with ID ${petId} not found`,
            );
        }

        const result =
            await this.cloudinaryService.uploadFile(file);

        pet.avatar = result.secure_url;

        await this.cacheService.del(
            `user-pets:${pet.userId}`,
        );

        return await pet.save();
    }
}