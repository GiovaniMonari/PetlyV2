import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
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
      query.petTypes = filters.type;
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

    return this.userModel
      .find(query)
      .select('-password -cpf')
      .sort(sortOption)
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID inválido');
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
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
}
