import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: createUserDto.email }).exec();
    if (existing) {
      throw new ConflictException('Email já está em uso');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findCaregivers(filters: {
    type?: string;
    location?: string;
    maxPrice?: number;
    sortBy?: string;
  }): Promise<UserDocument[]> {
    const query: any = { 
      role: 'caregiver', 
      isActive: true,
      services: { $exists: true, $not: { $size: 0 } }
    };

    if (filters.type && filters.type !== 'all') {
      query['petsQuantity.type'] = filters.type;
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    if (filters.maxPrice) {
      query.price = { $lte: filters.maxPrice };
    }

    let sortOption: any = {};
    switch (filters.sortBy) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const caregivers = await this.userModel
      .find(query)
      .select('-password -cpf')
      .sort(sortOption)
      .exec();

    return caregivers.map((c) => {
      const obj = c.toObject() as any;
      
      // Get all prices from services, filtering out invalid ones
      const prices = (obj.services || [])
        .map((s: any) => Number(s.price))
        .filter((p: number) => !isNaN(p));

      if (prices.length > 0) {
        obj.minPrice = Math.min(...prices);
        obj.maxPrice = Math.max(...prices);
        // Update the main price field to reflect the minimum price for sorting/display
        obj.price = obj.minPrice;
      } else {
        // Fallback for cases where services have no valid prices or no services exist
        const basePrice = Number(obj.price) || 0;
        obj.minPrice = basePrice;
        obj.maxPrice = basePrice;
        obj.price = basePrice;
      }

      return obj;
    }) as any;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    // If services are updated, calculate the min and max prices
    if (updateUserDto.services && updateUserDto.services.length > 0) {
      // Remove _id from services if present
      updateUserDto.services = updateUserDto.services.map((s: any) => {
        const { _id, ...rest } = s;
        return rest;
      });

      const prices = updateUserDto.services.map(s => s.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      (updateUserDto as any).price = minPrice;
      (updateUserDto as any).minPrice = minPrice;
      (updateUserDto as any).maxPrice = maxPrice;
    } else if (updateUserDto.services && updateUserDto.services.length === 0) {
      (updateUserDto as any).price = 0;
      (updateUserDto as any).minPrice = 0;
      (updateUserDto as any).maxPrice = 0;
    }

    const { petQuantities, ...restUpdate } = updateUserDto;
    const finalUpdate: any = { ...restUpdate };

    if (petQuantities) {
      finalUpdate.petsQuantity = petQuantities.map((p: any) => {
        const { _id, ...rest } = p;
        return rest;
      });
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: finalUpdate }, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateCaregiverRating(
    caregiverId: string,
    rating: number,
    reviewsCount: number,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(caregiverId)) {
      throw new NotFoundException('ID inválido');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        caregiverId,
        {
          $set: {
            rating: Number(rating.toFixed(1)),
            reviewsCount,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Cuidador não encontrado');
    }
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<UserDocument> {
    const user = await this.findById(userId);
    
    const result = await this.cloudinaryService.uploadFile(file);
    
    user.avatar = result.secure_url;
    return user.save();
  }

  async addFavoriteCaregiver(
    tutorId: string,
    caregiverId: string,
  ): Promise<UserDocument> {
    const tutor = await this.findById(tutorId);
    const caregiver = await this.findById(caregiverId);

    if (!caregiver) {
      throw new NotFoundException('Cuidador não encontrado');
    }

    if (!tutor.favorites.includes(caregiver._id)) {
      tutor.favorites.push(caregiver._id);
      await tutor.save();
    }

    return tutor;
  }

  async removeFavoriteCaregiver(
    tutorId: string,
    caregiverId: string,
  ): Promise<UserDocument> {
    const tutor = await this.findById(tutorId);

    tutor.favorites = tutor.favorites.filter(
      (id) => id.toString() !== caregiverId,
    );

    await tutor.save();
    return tutor;
  }

  async getFavoriteCaregivers(tutorId: string): Promise<UserDocument[]> {
    const tutor = await this.findById(tutorId);

    const caregivers = await this.userModel
      .find({ _id: { $in: tutor.favorites } })
      .select('-password -cpf')
      .exec();

    return caregivers;
  }
}
