import { User, UserDocument } from "@modules/users/schemas/user.schema";
import { CaregiverProfileDocument } from "../schemas/caregiver.schema";
import { Model } from "mongoose";
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from "@nestjs/common";
import { CaregiverProfileLean } from "../lean/caregiver.lean";
import { UserLean } from "@modules/users/lean/user.lean";

@Injectable()
export class CaregiverAssembler {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  build(profile: CaregiverProfileLean, user: UserLean) {
    return {
      id: profile._id,
      user,
      profile,
    };
  }

  buildMany(profiles, userMap: Map<string, UserLean>) {
    return profiles.map(profile => ({
        id: profile._id,
        user: userMap.get(profile.userId.toString()),
        profile,
    }));
  }
}