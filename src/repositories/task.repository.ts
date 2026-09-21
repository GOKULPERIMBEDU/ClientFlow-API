import { TaskModel, type TaskHydratedDocument } from "../models/task.model.js";
import {
  DEFAULT_TASK_STATUS,
  type AddTaskAttachmentDto,
  type AppendActivityDto,
  type CreateTaskDto,
  type ITask,
  type TaskActivity,
  type TaskActivityType,
  type TaskAttachment,
  type TaskComment,
  type UpdateTaskDto,
} from "../types/task.types.js";
import type { IRepository } from "./interfaces/base.repository.js";

function toIso(value?: Date): string {
  return value ? value.toISOString() : new Date().toISOString();
}

function toAttachment(taskId: string, attachment: { id: string; name: string; mimeType: string; size: number; createdAt?: Date }): TaskAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    url: `/api/tasks/${taskId}/attachments/${attachment.id}`,
    createdAt: toIso(attachment.createdAt),
  };
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toComment(
  taskId: string,
  comment: {
    id: string;
    author: string;
    authorId?: string;
    body?: string;
    content?: string;
    attachments?: Array<{ id: string; name: string; mimeType: string; size: number; url?: string; createdAt?: Date }>;
    mentions?: string[];
    createdAt?: Date;
  },
): TaskComment {
  const body = comment.body || "";
  const content = comment.content || (body ? `<p>${escapeText(body)}</p>` : "");
  return {
    id: comment.id,
    author: comment.author,
    authorId: comment.authorId ?? "",
    body,
    content,
    attachments: (comment.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: attachment.url || `/api/tasks/${taskId}/comments/${comment.id}/attachments/${attachment.id}`,
      createdAt: toIso(attachment.createdAt),
    })),
    mentions: comment.mentions ?? [],
    createdAt: toIso(comment.createdAt),
  };
}

function toActivity(entry: {
  id: string;
  type?: TaskActivityType;
  actionType?: TaskActivityType;
  userId?: string;
  userName?: string;
  author?: string;
  oldValue?: string;
  newValue?: string;
  message?: string;
  timestamp?: Date;
  createdAt?: Date;
}): TaskActivity {
  const actionType = entry.actionType ?? entry.type ?? "update";
  const userName = entry.userName || entry.author || "System";
  const timestamp = toIso(entry.timestamp ?? entry.createdAt);
  return {
    id: entry.id,
    type: actionType,
    actionType,
    userId: entry.userId ?? "",
    userName,
    author: userName,
    oldValue: entry.oldValue ?? "",
    newValue: entry.newValue ?? "",
    message: entry.message ?? "",
    timestamp,
    createdAt: timestamp,
  };
}

function activityDocument(entry: AppendActivityDto, now = new Date()) {
  const userName = entry.userName.trim() || "System";
  return {
    id: crypto.randomUUID(),
    type: entry.actionType,
    actionType: entry.actionType,
    userId: entry.userId ?? "",
    userName,
    author: userName,
    oldValue: entry.oldValue ?? "",
    newValue: entry.newValue ?? "",
    message: entry.message ?? "",
    timestamp: now,
    createdAt: now,
  };
}

function toTask(doc: TaskHydratedDocument, projectName = "Unknown project"): ITask {
  const activity = (doc.activity ?? []).map(toActivity);
  return {
    id: doc._id,
    title: doc.title,
    projectId: doc.projectId,
    projectName,
    assignee: doc.assignee,
    status: doc.status,
    description: doc.description ?? "",
    dueDate: doc.dueDate ?? "",
    estimatedHours: doc.estimatedHours ?? 0,
    spentHours: doc.spentHours ?? 0,
    attachments: (doc.attachments ?? []).map((attachment) => toAttachment(doc._id, attachment)),
    comments: (doc.comments ?? []).map((comment) => toComment(doc._id, comment)),
    activity,
    activityLog: activity,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class TaskRepository implements IRepository<ITask, CreateTaskDto, UpdateTaskDto> {
  async findAll(): Promise<ITask[]> {
    const docs = await TaskModel.find().sort({ createdAt: -1 }).exec();
    return docs.map((doc) => toTask(doc));
  }

  async findByProjectId(projectId: string): Promise<ITask[]> {
    const docs = await TaskModel.find({ projectId }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => toTask(doc));
  }

  async findById(id: string): Promise<ITask | null> {
    const doc = await TaskModel.findById(id).exec();
    return doc ? toTask(doc) : null;
  }

  async create(payload: CreateTaskDto): Promise<ITask> {
    const now = new Date();
    const actorName = payload.actorName?.trim() || payload.assignee?.trim() || "System";
    const status = payload.status ?? DEFAULT_TASK_STATUS;
    const doc = await TaskModel.create({
      title: payload.title,
      projectId: payload.projectId,
      assignee: payload.assignee ?? "Unassigned",
      status,
      description: payload.description ?? "",
      dueDate: payload.dueDate ?? "",
      estimatedHours: payload.estimatedHours ?? 0,
      spentHours: payload.spentHours ?? 0,
      activity: [
        activityDocument(
          {
            userId: payload.actorId,
            userName: actorName,
            actionType: "created",
            newValue: status,
            message: "created this task",
          },
          now,
        ),
      ],
    });
    return toTask(doc);
  }

  async update(id: string, payload: UpdateTaskDto): Promise<ITask | null> {
    const doc = await TaskModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).exec();
    return doc ? toTask(doc) : null;
  }

  async appendActivity(id: string, entry: AppendActivityDto): Promise<ITask | null> {
    const doc = await TaskModel.findByIdAndUpdate(
      id,
      { $push: { activity: activityDocument(entry) } },
      { new: true },
    ).exec();
    return doc ? toTask(doc) : null;
  }

  async addComment(
    id: string,
    payload: {
      id: string;
      author: string;
      authorId: string;
      body: string;
      content: string;
      mentions: string[];
      attachments: Array<{ id: string; name: string; mimeType: string; size: number; data?: Buffer; url?: string }>;
      actorId?: string;
    },
  ): Promise<ITask | null> {
    const now = new Date();
    const comment = {
      id: payload.id,
      author: payload.author,
      authorId: payload.authorId,
      body: payload.body,
      content: payload.content,
      mentions: payload.mentions,
      attachments: payload.attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: attachment.url || "",
        ...(attachment.data ? { data: attachment.data } : {}),
        createdAt: now,
      })),
      createdAt: now,
    };
    const doc = await TaskModel.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: comment,
          activity: activityDocument(
            {
              userId: payload.actorId || payload.authorId,
              userName: payload.author,
              actionType: "comment",
              newValue: payload.body || payload.content,
              message: payload.body || "added a comment",
            },
            now,
          ),
        },
      },
      { new: true },
    ).exec();
    return doc ? toTask(doc) : null;
  }

  async addAttachment(
    id: string,
    payload: AddTaskAttachmentDto & { data: Buffer; size: number; author?: string; actorId?: string },
  ): Promise<ITask | null> {
    const now = new Date();
    const author = payload.author?.trim() || "System";
    const attachment = {
      id: crypto.randomUUID(),
      name: payload.name,
      mimeType: payload.mimeType,
      size: payload.size,
      data: payload.data,
      createdAt: now,
    };
    const doc = await TaskModel.findByIdAndUpdate(
      id,
      {
        $push: {
          attachments: attachment,
          activity: activityDocument(
            {
              userId: payload.actorId,
              userName: author,
              actionType: "attachment",
              newValue: payload.name,
              message: `attached ${payload.name}`,
            },
            now,
          ),
        },
      },
      { new: true },
    ).exec();
    return doc ? toTask(doc) : null;
  }

  async removeAttachment(id: string, attachmentId: string): Promise<ITask | null> {
    const doc = await TaskModel.findByIdAndUpdate(
      id,
      { $pull: { attachments: { id: attachmentId } } },
      { new: true },
    ).exec();
    return doc ? toTask(doc) : null;
  }

  async getAttachment(
    id: string,
    attachmentId: string,
  ): Promise<{ name: string; mimeType: string; data: Buffer } | null> {
    const doc = await TaskModel.findById(id).select("+attachments.data").exec();
    const attachment = doc?.attachments.find((item) => item.id === attachmentId);
    if (!attachment?.data) {
      return null;
    }
    return { name: attachment.name, mimeType: attachment.mimeType, data: attachment.data };
  }

  async getCommentAttachment(
    id: string,
    commentId: string,
    attachmentId: string,
  ): Promise<{ name: string; mimeType: string; data: Buffer } | null> {
    const doc = await TaskModel.findById(id).select("+comments.attachments.data").exec();
    const comment = doc?.comments.find((item) => item.id === commentId);
    const attachment = comment?.attachments.find((item) => item.id === attachmentId);
    if (!attachment?.data) {
      return null;
    }
    return { name: attachment.name, mimeType: attachment.mimeType, data: attachment.data };
  }

  async delete(id: string): Promise<boolean> {
    const result = await TaskModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const taskRepository = new TaskRepository();
export { toTask };
