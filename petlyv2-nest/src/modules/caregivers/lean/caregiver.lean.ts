import { Types } from "mongoose";
import { CaregiverProfileDocument } from "../schemas/caregiver.schema";

export type CaregiverProfileLean =
  Omit<CaregiverProfileDocument, keyof Document> & {
    _id: Types.ObjectId;
  };