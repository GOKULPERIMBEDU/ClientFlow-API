import { Schema, model, type HydratedDocument } from "mongoose";

export interface ProfileDocument {
  _id: string;
  name: string;
  email: string;
  role: string;
  companyName: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<ProfileDocument>(
  {
    _id: { type: String, default: "profile_current" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true, trim: true, default: "MERN Stack Developer" },
    companyName: { type: String, required: true, trim: true, default: "Atelier North" },
    avatarUrl: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ProfileHydratedDocument = HydratedDocument<ProfileDocument>;
export const ProfileModel = model<ProfileDocument>("Profile", profileSchema);
