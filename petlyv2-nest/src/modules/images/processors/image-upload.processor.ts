import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { CacheService } from '@modules/cache/cache.service';
import { User, UserDocument } from '@modules/users/schemas/user.schema';
import { Pet, PetDocument } from '@modules/user-pets/schemas/pets.schema';
import { ImageUploadJobDto } from '../dto/image-upload-job.dto';
import { IMAGES_QUEUE_NAME } from '../queues/images.queue.module';

@Processor(IMAGES_QUEUE_NAME)
export class ImageUploadProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageUploadProcessor.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly cacheService: CacheService,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Pet.name)
    private readonly petModel: Model<PetDocument>,
  ) {
    super();
  }

  // ---------------------------------------------------------------------------
  // Entry point — o BullMQ chama este método para cada job da fila
  // ---------------------------------------------------------------------------
  async process(job: Job<ImageUploadJobDto>): Promise<void> {
    const { entityType, entityId, ownerId, fileBuffer, mimetype, originalname } =
      job.data;

    this.logger.log(
      `[Job ${job.id}] Iniciando upload de imagem — tipo: ${entityType}, id: ${entityId}`,
    );

    // Reconstrói o objeto de arquivo compatível com o CloudinaryService existente.
    // O buffer foi serializado como Base64 para atravessar a serialização JSON do BullMQ.
    const file: Express.Multer.File = {
      buffer: Buffer.from(fileBuffer, 'base64'),
      mimetype,
      originalname,
      // Campos exigidos pelo tipo mas não usados pelo CloudinaryService
      fieldname: 'file',
      encoding: '7bit',
      size: 0,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    try {
      const result = await this.cloudinaryService.uploadFile(file);
      const secureUrl = result.secure_url;

      if (entityType === 'user') {
        await this.handleUserUpload(entityId, secureUrl);
      } else {
        await this.handlePetUpload(entityId, ownerId, secureUrl);
      }

      this.logger.log(
        `[Job ${job.id}] Upload concluído com sucesso → ${secureUrl}`,
      );
    } catch (err) {
      // O BullMQ vai retentar automaticamente de acordo com a política de backoff
      // definida em ImagesService.enqueueUpload — não precisa fazer nada aqui além
      // de propagar o erro para que ele seja registrado e a tentativa seja marcada.
      this.logger.error(
        `[Job ${job.id}] Falha no upload (tentativa ${job.attemptsMade + 1})`,
        err,
      );
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers específicos por tipo de entidade
  // ---------------------------------------------------------------------------

  private async handleUserUpload(userId: string, avatarUrl: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { avatar: avatarUrl });
    await this.cacheService.del(`user-profile:${userId}`);

    this.logger.debug(`Avatar do usuário ${userId} atualizado no banco.`);
  }

  private async handlePetUpload(
    petId: string,
    ownerId: string | undefined,
    avatarUrl: string,
  ): Promise<void> {
    const pet = await this.petModel.findByIdAndUpdate(
      petId,
      { avatar: avatarUrl },
      { new: true },
    );

    if (!pet) {
      throw new Error(`Pet ${petId} não encontrado ao tentar atualizar avatar.`);
    }

    // Invalida o cache do dono (passado no job) ou tenta recuperar pelo documento
    const userIdToInvalidate = ownerId ?? pet.userId?.toString();
    if (userIdToInvalidate) {
      await this.cacheService.del(`user-pets:${userIdToInvalidate}`);
    }

    this.logger.debug(`Avatar do pet ${petId} atualizado no banco.`);
  }
}