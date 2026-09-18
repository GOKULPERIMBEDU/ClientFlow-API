import { Schema, model, type HydratedDocument } from "mongoose";
import type { ProjectStatus } from "../types/project.types.js";

const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "completed", "cancelled"];

export interface ProjectDocument {
  _id: string;
  clientId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    _id: {
      type: String,
      default: () => `prj_${crypto.randomUUID()}`,
    },
    clientId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: PROJECT_STATUSES, default: "planning" },
    budget: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ProjectHydratedDocument = HydratedDocument<ProjectDocument>;
export const ProjectModel = model<ProjectDocument>("Project", projectSchema);
