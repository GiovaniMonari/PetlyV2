import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';

import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';
import { CacheModule } from '@modules/cache/cache.module';
import { User, UserSchema } from '@modules/users/schemas/user.schema';
import { Pet, PetSchema } from '@modules/user-pets/schemas/pets.schema';

import { ImagesQueueModule, IMAGES_QUEUE, IMAGES_QUEUE_NAME } from './queues/images.queue.module';
import { ImagesService } from './images.service';
import { ImageUploadProcessor } from './processors/image-upload.processor';

@Module({
  imports: [
    // Fila registrada pelo ImagesQueueModule (inclui BullBoard)
    ImagesQueueModule,

    // Injeta a Queue diretamente no ImagesService via token IMAGES_QUEUE
    BullModule.registerQueue({ name: IMAGES_QUEUE_NAME }),

    // Modelos necessários no Processor
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Pet.name, schema: PetSchema },
    ]),

    // Dependências de infraestrutura
    CloudinaryModule,
    CacheModule,
  ],
  providers: [
    ImagesService,
    ImageUploadProcessor,

    // Provê a Queue pelo token simbólico IMAGES_QUEUE para injeção no ImagesService
    {
      provide: IMAGES_QUEUE,
      useFactory: (queue: any) => queue,
      inject: [`BullQueue_${IMAGES_QUEUE_NAME}`],
    },
  ],
  exports: [ImagesService],
})
export class ImagesModule {}