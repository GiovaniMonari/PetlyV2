import { BadRequestException } from '@nestjs/common';

export class BookingValidation {
  static validateDates(start: Date, end: Date) {
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Datas inválidas');
    }

    if (end < start) {
      throw new BadRequestException('Data final deve ser após a inicial');
    }
  }

  static validateService(serviceType: string) {
    const normalized = (serviceType || '').trim();

    if (!normalized) {
      throw new BadRequestException('Tipo de serviço inválido');
    }

    return normalized;
  }

  static validateDogSize(acceptedSizes: string[], petSize: string) {
    if (!acceptedSizes.length) {
      throw new BadRequestException(
        'Cuidador não informou portes aceitos para cães',
      );
    }

    if (!acceptedSizes.includes(petSize)) {
      throw new BadRequestException(
        `Este cuidador não atende cães de porte ${petSize}`,
      );
    }
  }
}