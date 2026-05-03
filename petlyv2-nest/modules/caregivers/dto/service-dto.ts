import { IsEnum, IsNumber, IsString } from 'class-validator';

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
    duration: ['30min', '1h']
  },
  boarding: {
    name: 'Hospedagem',
    description: 'Cuidados 24h com alimentação e descanso',
    duration: '24h',
  },
  daycare: {
    name: 'Creche',
    description: 'Período diurno com atividades e socialização',
    duration: '12h',
  },
  grooming: {
    name: 'Banho e tosa',
    description: 'Higiene completa com produtos adequados',
    duration: '2h',
  },
  training: {
    name: 'Adestramento',
    description: 'Treinamento básico ou avançado para pets',
    duration: ['1h', '2h']
  },
};

export class ServiceDto {
  @IsEnum(ServiceType)
  type!: ServiceType;

  @IsNumber()
  price!: number;

  @IsString()
  duration!: string;
}