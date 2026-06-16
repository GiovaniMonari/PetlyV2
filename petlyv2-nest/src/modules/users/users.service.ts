import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Pet, PetDocument } from 'src/modules/user-pets/schemas/pets.schema';
import { CacheService } from '@modules/cache/cache.service';
import { CaregiverProfileDocument } from '@modules/caregivers/schemas/caregiver.schema';
import { ImagesService, EnqueueUploadResult } from '@modules/images/images.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly imagesService: ImagesService,   // ← substitui CloudinaryService

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Pet.name)
    private petModel: Model<PetDocument>,

    @InjectModel('CaregiverProfile')
    private caregiverProfileModel: Model<CaregiverProfileDocument>,
  ) {}

  // ---------------------------------------------------------------------------
  // Demais métodos permanecem inalterados — apenas uploadAvatar foi modificado
  // ---------------------------------------------------------------------------

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: createUserDto.email }).exec();
    if (existing) throw new ConflictException('Email já está em uso');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = new this.userModel({ ...createUserDto, password: hashedPassword });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('ID inválido');

    const cacheKey = `user-profile:${id}`;
    const cached = await this.cacheService.get<UserDocument>(cacheKey);
    if (cached) return cached;

    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.cacheService.set(cacheKey, user, 300);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('ID inválido');

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true, runValidators: true })
      .select('-password')
      .exec();

    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.cacheService.del(`user-profile:${id}`);
    return user;
  }

  async updatePassword(id: string, password: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('ID inválido');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.userModel.findByIdAndUpdate(id, { password: hash });
    if (!user) throw new NotFoundException('Usuário não encontrado');
  }

  /**
   * ANTES: await cloudinaryService.uploadFile(file) — bloqueava a requisição HTTP
   * enquanto o arquivo era enviado ao Cloudinary.
   *
   * AGORA: enfileira o job e retorna 202 imediatamente.
   * O Processor atualiza `user.avatar` e invalida o cache de forma assíncrona.
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<EnqueueUploadResult> {
    // Garante que o usuário existe antes de enfileirar
    await this.findById(userId);

    return this.imagesService.enqueueUpload({
      entityType: 'user',
      entityId: userId,
      file,
    });
  }

  async addFavoriteCaregiver(tutorId: string, caregiverId: string): Promise<UserDocument> {
    const tutor = await this.findById(tutorId);
    const caregiver = await this.findById(caregiverId);

    if (!caregiver) throw new NotFoundException('Cuidador não encontrado');
    if (!tutor.favorites.includes(caregiver._id)) {
      tutor.favorites.push(caregiver._id);
      await tutor.save();
    }
    return tutor;
  }

  async removeFavoriteCaregiver(tutorId: string, caregiverId: string): Promise<UserDocument> {
    const tutor = await this.findById(tutorId);
    tutor.favorites = tutor.favorites.filter((id) => id.toString() !== caregiverId);
    await tutor.save();
    return tutor;
  }

  async getFavoriteCaregivers(tutorId: string) {
    const tutor = await this.findById(tutorId);

    const favorites = await Promise.all(
      tutor.favorites.map(async (favoriteId) => {
        const user = await this.userModel
          .findById(favoriteId)
          .select('-password -cpf')
          .lean();
        if (!user) return null;

        const profile = await this.caregiverProfileModel
          .findOne({ userId: new Types.ObjectId(favoriteId.toString()) })
          .lean();

        return { id: user._id, user, profile };
      }),
    );

    return favorites.filter(Boolean);
  }

  async getMyLocation(userId: string): Promise<string> {
    const user = await this.findById(userId);
    return user.location || '';
  }

  async updateMyLocation(userId: string, location: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.location = location;
    await this.cacheService.del(`user-profile:${userId}`);
    return user.save();
  }

  async getOwnerPets(userId: string): Promise<PetDocument[]> {
    const cacheKey = `user-pets:${userId}`;
    const cached = await this.cacheService.get<PetDocument[]>(cacheKey);
    if (cached) return cached;

    const user = await this.findById(userId);
    const pets = await this.petModel.find({ _id: { $in: user.myPets } }).exec();
    await this.cacheService.set(cacheKey, pets, 300);
    return pets;
  }

  async addPet(userId: string, petId: Types.ObjectId): Promise<UserDocument> {
    const user = await this.findById(userId);
    const pet = await this.petModel.findById(petId);
    if (!pet) throw new NotFoundException('Pet não encontrado');

    if (!user.myPets.includes(petId)) {
      user.myPets.push(petId);
      await user.save();
      await this.cacheService.del(`user-pets:${userId}`);
    }
    return user;
  }

  async findPetById(petId: string): Promise<PetDocument> {
    const pet = await this.petModel.findById(petId).exec();
    if (!pet) throw new NotFoundException('Pet não encontrado');
    return pet;
  }

  async removePet(userId: string, petId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.myPets = user.myPets.filter((id) => id.toString() !== petId);
    await user.save();
    await this.cacheService.del(`user-pets:${userId}`);
    return user;
  }

  async updatePet(petId: string, updateData: Partial<PetDocument>): Promise<PetDocument> {
    const pet = await this.petModel
      .findByIdAndUpdate(petId, { $set: updateData }, { new: true })
      .exec();
    if (!pet) throw new NotFoundException('Pet não encontrado');
    return pet;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('ID inválido');

    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.cacheService.del(`user-profile:${id}`);
    return { message: 'Usuário removido com sucesso' };
  }
}