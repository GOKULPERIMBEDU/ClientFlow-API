import { Schema, model, type HydratedDocument } from "mongoose";
import { TASK_STATUS_VALUES, type TaskActivityType, type TaskStatus } from "../types/task.types.js";

const ACTIVITY_TYPES: TaskActivityType[] = [
  "created",
  "status",
  "assignee",
  "comment",
  "update",
  "attachment",
  "worklog",
];

export interface TaskAttachmentDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
}

export interface TaskCommentAttachmentDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  data?: Buffer;
  createdAt: Date;
}

export interface TaskCommentDocument {
  id: string;
  author: string;
  authorId: string;
  body: string;
  content: string;
  attachments: TaskCommentAttachmentDocument[];
  mentions: string[];
  createdAt: Date;
}

export interface TaskActivityDocument {
  id: string;
  type: TaskActivityType;
  actionType: TaskActivityType;
  userId: string;
  userName: string;
  author: string;
  oldValue: string;
  newValue: string;
  message: string;
  timestamp: Date;
  createdAt: Date;
}

export interface TaskDocument {
  _id: string;
  title: string;
  projectId: string;
  assignee: string;
  status: TaskStatus;
  description: string;
  dueDate: string;
  estimatedHours: number;
  spentHours: number;
  attachments: TaskAttachmentDocument[];
  comments: TaskCommentDocument[];
  activity: TaskActivityDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<TaskAttachmentDocument>(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    name: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    data: { type: Buffer, required: true, select: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const commentAttachmentSchema = new Schema<TaskCommentAttachmentDocument>(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    name: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, default: "", trim: true },
    data: { type: Buffer, select: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const commentSchema = new Schema<TaskCommentDocument>(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    author: { type: String, required: true, trim: true },
    authorId: { type: String, default: "", trim: true },
    body: { type: String, default: "", trim: true },
    content: { type: String, default: "", trim: true },
    attachments: { type: [commentAttachmentSchema], default: [] },
    mentions: { type: [String], default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const activitySchema = new Schema<TaskActivityDocument>(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    actionType: { type: String, enum: ACTIVITY_TYPES, required: true },
    userId: { type: String, default: "", trim: true },
    userName: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    oldValue: { type: String, default: "", trim: true },
    newValue: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: () => new Date() },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const taskSchema = new Schema<TaskDocument>(
  {
    _id: {
      type: String,
      default: () => `tsk_${crypto.randomUUID()}`,
    },
    title: { type: String, required: true, trim: true },
    projectId: { type: String, required: true, index: true },
    assignee: { type: String, default: "Unassigned", trim: true },
    status: { type: String, enum: TASK_STATUS_VALUES, default: "backlog" },
    description: { type: String, default: "", trim: true },
    dueDate: { type: String, default: "", trim: true },
    estimatedHours: { type: Number, default: 0, min: 0 },
    spentHours: { type: Number, default: 0, min: 0 },
    attachments: { type: [attachmentSchema], default: [] },
    comments: { type: [commentSchema], default: [] },
    activity: { type: [activitySchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type TaskHydratedDocument = HydratedDocument<TaskDocument>;
export const TaskModel = model<TaskDocument>("Task", taskSchema);
