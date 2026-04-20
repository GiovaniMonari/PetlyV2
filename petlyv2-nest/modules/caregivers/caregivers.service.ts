import { Model, Types } from "mongoose";
import { Caregiver, CaregiverDocument } from "./schemas/caregiver.schema";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateCaregiverDto,
  CaregiverType,
} from "./dto/create-caregiver.dto";
import { UpdateCaregiverDto } from "./dto/update-caregiver.dto";
import { ServiceDto } from "./dto/service-dto";
import { UpdateServiceDto } from "./dto/update-services.dto";

const SERVICE_DEFAULTS: Record<
  ServiceDto["type"],
  { name: string; description: string }
> = {
  walk: {
    name: "Passeio",
    description: "Passeio diário com o pet",
  },
  boarding: {
    name: "Hospedagem",
    description: "Cuidados 24h",
  },
  daycare: {
    name: "Creche",
    description: "Atividades e socialização durante o dia",
  },
  grooming: {
    name: "Banho e tosa",
    description: "Higiene completa do pet",
  },
  training: {
    name: "Adestramento",
    description: "Treinamento básico ou avançado",
  },
};

@Injectable()
export class CaregiversService {
  constructor(
    @InjectModel(Caregiver.name)
    private caregiverModel: Model<CaregiverDocument>,
  ) {}

  // ✅ aplica defaults de serviço
  private mapServices(services?: ServiceDto[]) {
    if (!services) return [];

    return services.map((service) => {
      const base = SERVICE_DEFAULTS[service.type];

      return {
        ...service,
        name: base.name,
        description: base.description,
      };
    });
  }

  async create(
    createCaregiverDto: CreateCaregiverDto,
  ): Promise<CaregiverDocument> {
    const createdCaregiver = new this.caregiverModel(createCaregiverDto);
    return createdCaregiver.save();
  }

  async findOne(id: string): Promise<CaregiverDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("ID inválido");
    }

    const caregiver = await this.caregiverModel.findById(id).exec();

    if (!caregiver) {
      throw new NotFoundException("Caregiver não encontrado");
    }

    return caregiver;
  }

  async findAll(): Promise<CaregiverDocument[]> {
    return this.caregiverModel.find().exec();
  }

  async findByType(type: CaregiverType): Promise<CaregiverDocument[]> {
    return this.caregiverModel.find({ types: type }).exec();
  }

  async findBySpecialty(
    specialty: string,
  ): Promise<CaregiverDocument[]> {
    return this.caregiverModel.find({ specialties: specialty }).exec();
  }

  async update(
    id: string,
    updateCaregiverDto: UpdateCaregiverDto,
  ): Promise<CaregiverDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("ID inválido");
    }

    const { services, ...rest } = updateCaregiverDto;

    if (Object.keys(rest).length > 0) {
      const result = await this.caregiverModel.updateOne(
        { _id: id },
        { $set: rest },
      );

      if (result.matchedCount === 0) {
        throw new NotFoundException("Caregiver não encontrado");
      }
    }

    if (!services) {
      const caregiver = await this.caregiverModel.findById(id).exec();
      if (!caregiver) {
        throw new NotFoundException("Caregiver não encontrado");
      }
      return caregiver;
    }

    const types = services.map((s) => s.type);
    const unique = new Set(types);

    if (unique.size !== types.length) {
      throw new BadRequestException(
        "Serviços duplicados não são permitidos",
      );
    }

    const mappedServices = this.mapServices(services);

    const pullResult = await this.caregiverModel.updateOne(
      { _id: id },
      {
        $pull: {
          services: { type: { $in: types } },
        },
      },
    );

    if (pullResult.matchedCount === 0) {
      throw new NotFoundException("Caregiver não encontrado");
    }

    await this.caregiverModel.updateOne(
      { _id: id },
      {
        $push: {
          services: {
            $each: mappedServices,
          },
        },
      },
    );

    const updatedCaregiver = await this.caregiverModel
      .findById(id)
      .exec();

    if (!updatedCaregiver) {
      throw new NotFoundException("Caregiver não encontrado");
    }

    return updatedCaregiver;
  }

  async updateService(
    id: string,
    type: ServiceDto["type"],
    dto: UpdateServiceDto,
  ): Promise<CaregiverDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("ID inválido");
    }

    const base = SERVICE_DEFAULTS[type];

    if (!base) {
      throw new BadRequestException("Tipo de serviço inválido");
    }

    const updateData: Record<string, unknown> = {
      "services.$.name": base.name,
      "services.$.description": base.description,
    };

    if (dto.price !== undefined) {
      updateData["services.$.price"] = dto.price;
    }

    const updated = await this.caregiverModel.findOneAndUpdate(
      {
        _id: id,
        "services.type": type,
      },
      { $set: updateData },
      { new: true },
    );

    if (updated) return updated;

    const caregiverExists = await this.caregiverModel.exists({
      _id: id,
    });

    if (!caregiverExists) {
      throw new NotFoundException("Caregiver não encontrado");
    }

    const newService = {
      type,
      price: dto.price ?? 0,
      name: base.name,
      description: base.description,
    };

    const created = await this.caregiverModel.findByIdAndUpdate(
      id,
      {
        $push: { services: newService },
      },
      { new: true },
    );

    if (!created) {
      throw new NotFoundException("Caregiver não encontrado");
    }

    return created;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("ID inválido");
    }

    const result = await this.caregiverModel
      .findByIdAndDelete(id)
      .exec();

    if (!result) {
      throw new NotFoundException("Caregiver não encontrado");
    }
  }
}