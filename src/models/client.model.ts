import { Schema, model, type HydratedDocument } from "mongoose";
import type { ClientStatus } from "../types/client.types.js";

const CLIENT_STATUSES: ClientStatus[] = ["active", "onboarding", "paused", "archived"];

export interface ClientDocument {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: ClientStatus;
  timezone: string;
  industry: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<ClientDocument>(
  {
    _id: {
      type: String,
      default: () => `cli_${crypto.randomUUID()}`,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: CLIENT_STATUSES, default: "onboarding" },
    timezone: { type: String, default: "UTC", trim: true },
    industry: { type: String, default: "General", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ClientHydratedDocument = HydratedDocument<ClientDocument>;
export const ClientModel = model<ClientDocument>("Client", clientSchema);
