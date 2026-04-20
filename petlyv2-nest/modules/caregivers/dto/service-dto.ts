import { IsEnum, IsNumber } from 'class-validator';

export enum ServiceType {
  WALK = 'walk',
  BOARDING = 'boarding',
  DAYCARE = 'daycare',
  GROOMING = 'grooming',
  TRAINING = 'training',
}

export const SERVICE_DEFAULTS = {
  walk: {
    name: 'Passeio',
    description: 'Passeio diário com o pet, incluindo exercícios e hidratação',
  },
  boarding: {
    name: 'Hospedagem',
    description: 'Cuidados 24h com alimentação e descanso',
  },
  daycare: {
    name: 'Creche',
    description: 'Período diurno com atividades e socialização',
  },
  grooming: {
    name: 'Banho e tosa',
    description: 'Higiene completa com produtos adequados',
  },
  training: {
    name: 'Adestramento',
    description: 'Treinamento básico ou avançado para pets',
  },
};

export class ServiceDto {
  @IsEnum(ServiceType)
  type!: ServiceType;

  @IsNumber()
  price!: number;
}