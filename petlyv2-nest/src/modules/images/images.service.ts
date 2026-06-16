import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ImageUploadJobDto } from './dto/image-upload-job.dto';
import { IMAGES_QUEUE } from './queues/images.queue.module';

export interface EnqueueUploadParams {
  entityType: 'user' | 'pet';
  entityId: string;
  ownerId?: string;
  file: Express.Multer.File;
}

export interface EnqueueUploadResult {
  jobId: string;
  message: string;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @Inject(IMAGES_QUEUE)
    private readonly imagesQueue: Queue,
  ) {}

  /**
   * Serializa o buffer do arquivo em Base64 e enfileira o job de upload.
   * Retorna imediatamente com o jobId — o upload acontece de forma assíncrona.
   */
  async enqueueUpload(params: EnqueueUploadParams): Promise<EnqueueUploadResult> {
    const { entityType, entityId, ownerId, file } = params;

    const payload: ImageUploadJobDto = {
      entityType,
      entityId,
      ownerId,
      // Serializa o Buffer para Base64 para que o BullMQ consiga persistir via JSON
      fileBuffer: file.buffer.toString('base64'),
      mimetype: file.mimetype,
      originalname: file.originalname,
    };

    // jobId determinístico evita duplicatas se o cliente reenviar a mesma requisição
    const jobId = `img-${entityType}-${entityId}-${Date.now()}`;

    const job = await this.imagesQueue.add('upload-image', payload, {
      jobId,
      attempts: 4,
      backoff: {
        // Intervalo crescente: 5s → 10s → 20s → 40s
        type: 'exponential',
        delay: 5_000,
      },
      removeOnComplete: { count: 100 }, // Mantém os últimos 100 jobs completos para auditoria
      removeOnFail: { count: 50 },      // Mantém os últimos 50 falhos para debug
    });

    this.logger.log(
      `Job enfileirado [${job.id}] — ${entityType}:${entityId}`,
    );

    return {
      jobId: job.id!,
      message:
        'Imagem recebida e será processada em breve. ' +
        'O avatar será atualizado automaticamente após o upload.',
    };
  }
}