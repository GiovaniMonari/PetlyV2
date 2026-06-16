import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

export const IMAGES_QUEUE = 'IMAGES_QUEUE';
export const IMAGES_QUEUE_NAME = 'images-upload';

@Module({
  imports: [
    BullModule.registerQueue({
      name: IMAGES_QUEUE_NAME,
    }),
    BullBoardModule.forFeature({
      name: IMAGES_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
  ],
  exports: [BullModule],
})
export class ImagesQueueModule {}