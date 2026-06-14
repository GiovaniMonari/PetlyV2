import { Types } from "mongoose";
import { UserRole } from "../schemas/user.schema";

export type UserLean = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  location?: string;
  isActive?: boolean;
  role: UserRole;
};