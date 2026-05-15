import { forwardRef, Module } from "@nestjs/common";
import { UserPetsService } from "./user-pets.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Pet, PetSchema } from "./schemas/pets.schema";
import { UsersModule } from "../users/users.module";
import { UserPetsController } from "./user-pets.controller";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Pet.name, schema: PetSchema }]),
        forwardRef(() => CloudinaryModule),
        forwardRef(() => UsersModule)
    ],
    controllers: [UserPetsController],
    providers: [UserPetsService],
    exports: [UserPetsService, MongooseModule.forFeature([{ name: Pet.name, schema: PetSchema }])]
})
export class UserPetsModule { }