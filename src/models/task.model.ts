import { Schema, model, type HydratedDocument } from "mongoose";
import type { TaskStatus } from "../types/task.types.js";

const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];

export interface TaskDocument {
  _id: string;
  title: string;
  projectId: string;
  assignee: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>(
  {
    _id: {
      type: String,
      default: () => `tsk_${crypto.randomUUID()}`,
    },
    title: { type: String, required: true, trim: true },
    projectId: { type: String, required: true, index: true },
    assignee: { type: String, default: "Unassigned", trim: true },
    status: { type: String, enum: TASK_STATUSES, default: "todo" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type TaskHydratedDocument = HydratedDocument<TaskDocument>;
export const TaskModel = model<TaskDocument>("Task", taskSchema);
