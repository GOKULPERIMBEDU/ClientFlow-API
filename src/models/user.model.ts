import { Schema, model, type HydratedDocument } from "mongoose";
import type { UserRole } from "../types/user.types.js";

const USER_ROLES: UserRole[] = ["admin", "lead", "member"];

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedProjects: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    _id: {
      type: String,
      default: () => `usr_${crypto.randomUUID()}`,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: USER_ROLES, default: "member" },
    assignedProjects: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type UserHydratedDocument = HydratedDocument<UserDocument>;
export const UserModel = model<UserDocument>("User", userSchema);
