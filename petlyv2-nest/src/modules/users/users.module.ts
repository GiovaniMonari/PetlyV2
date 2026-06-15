import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserPetsModule } from '../user-pets/user-pets.module';
import { CaregiversModule } from '@modules/caregivers/caregivers.module';
import { CaregiverProfile, CaregiverProfileSchema } from '@modules/caregivers/schemas/caregiver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CaregiverProfile.name, schema: CaregiverProfileSchema }
    ]),
    forwardRef(() => CloudinaryModule),
    forwardRef(() => UserPetsModule),
    forwardRef(() => CaregiversModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
