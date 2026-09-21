import { AppError } from "../errors/app-error.js";
import { projectRepository, type ProjectRepository } from "../repositories/project.repository.js";
import { taskRepository, type TaskRepository } from "../repositories/task.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import {
  TASK_STATUS_VALUES,
  type AddTaskAttachmentDto,
  type AddTaskCommentDto,
  type AppendActivityDto,
  type CreateTaskDto,
  type ITask,
  type UpdateTaskDto,
} from "../types/task.types.js";
import { isAdminRole } from "../types/user.types.js";
import { statusLabel } from "../utils/status-labels.js";
import {
  applyImageUrls,
  extractAttachmentCards,
  extractDataImages,
  extractMentionIds,
  isEmptyHtml,
  sanitizeCommentHtml,
  stripHtml,
} from "../utils/comment-html.js";

const TASK_STATUSES = new Set<string>(TASK_STATUS_VALUES);
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const MAX_ATTACHMENTS = 8;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function decodeBase64(content: string): Buffer {
  const cleaned = content.includes(",") ? content.slice(content.indexOf(",") + 1) : content;
  return Buffer.from(cleaned, "base64");
}

function actorFrom(payload: { actorId?: string; actorName?: string }, fallbackName = "System") {
  const userName = payload.actorName?.trim() || fallbackName;
  return { userId: payload.actorId?.trim() || "", userName };
}

export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
    private readonly users: UserRepository,
  ) {}

  async listTasks(projectId?: string, userId?: string): Promise<ITask[]> {
    if (projectId) {
      await this.ensureProjectExists(projectId);
    }

    const [rawTasks, projects] = await Promise.all([
      projectId ? this.tasks.findByProjectId(projectId) : this.tasks.findAll(),
      this.projects.findAll(),
    ]);

    const allowedProjectIds = await this.visibleProjectIds(userId);
    const names = new Map(projects.map((project) => [project.id, project.name]));
    return rawTasks
      .filter((task) => !allowedProjectIds || allowedProjectIds.has(task.projectId))
      .map((task) => ({
        ...task,
        projectName: names.get(task.projectId) ?? "Unknown project",
      }));
  }

  async getTask(id: string): Promise<ITask> {
    const task = await this.tasks.findById(id);
    if (!task) {
      throw AppError.notFound("Task", id);
    }
    const project = await this.projects.findById(task.projectId);
    return { ...task, projectName: project?.name ?? "Unknown project" };
  }

  async createTask(payload: CreateTaskDto): Promise<ITask> {
    this.assertCreatePayload(payload);
    const project = await this.ensureProjectExists(payload.projectId);

    const created = await this.tasks.create({
      ...payload,
      title: payload.title.trim(),
      assignee: payload.assignee?.trim() || "Unassigned",
    });

    return { ...created, projectName: project.name };
  }

  async updateTask(id: string, payload: UpdateTaskDto, actor = "System"): Promise<ITask> {
    const existing = await this.getTask(id);

    if (payload.status && !TASK_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid task status");
    }

    if (payload.projectId) {
      await this.ensureProjectExists(payload.projectId);
    }

    const safePayload: UpdateTaskDto = {
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
      ...(payload.projectId !== undefined ? { projectId: payload.projectId } : {}),
      ...(payload.assignee !== undefined ? { assignee: payload.assignee.trim() || "Unassigned" } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
      ...(payload.estimatedHours !== undefined ? { estimatedHours: Number(payload.estimatedHours) || 0 } : {}),
      ...(payload.spentHours !== undefined ? { spentHours: Number(payload.spentHours) || 0 } : {}),
    };

    const updated = await this.tasks.update(id, safePayload);
    if (!updated) {
      throw AppError.notFound("Task", id);
    }

    const { userId, userName } = actorFrom(payload, actor.trim() || existing.assignee || "System");
    const notes = this.changeNotes(existing, { ...existing, ...safePayload });
    for (const note of notes) {
      await this.tasks.appendActivity(id, { ...note, userId, userName });
    }

    return this.getTask(id);
  }

  async addComment(id: string, payload: AddTaskCommentDto): Promise<ITask> {
    await this.getTask(id);
    const htmlSource = payload.content?.trim() || (payload.body?.trim() ? `<p>${payload.body.trim()}</p>` : "");
    if (isEmptyHtml(htmlSource) && !payload.attachments?.length) {
      throw AppError.badRequest("Comment cannot be empty");
    }

    const commentId = crypto.randomUUID();
    const sanitized = sanitizeCommentHtml(htmlSource);
    const cards = extractAttachmentCards(sanitized);
    const fromHtml = extractDataImages(sanitized);
    const extraImages = (payload.attachments ?? []).map((item, index) => {
      const data = decodeBase64(item.contentBase64);
      if (!IMAGE_TYPES.has(item.mimeType) || data.length > MAX_ATTACHMENT_BYTES) {
        throw AppError.badRequest("Comment images must be JPEG, PNG, GIF, or WebP and 2 MB or smaller");
      }
      return {
        id: crypto.randomUUID(),
        name: item.name?.trim() || `comment-image-${index + 1}.png`,
        mimeType: item.mimeType,
        data,
      };
    });
    const images = [...fromHtml.images, ...extraImages];
    if (images.length + cards.length > MAX_ATTACHMENTS) {
      throw AppError.badRequest(`A comment can have at most ${MAX_ATTACHMENTS} files`);
    }

    const content = applyImageUrls(fromHtml.html, id, commentId, images.map((image) => image.id));
    const body = stripHtml(content) || payload.body?.trim() || (cards.length || images.length ? "File comment" : "");
    const mentions = [...new Set([...(payload.mentions ?? []), ...extractMentionIds(content)])];

    const updated = await this.tasks.addComment(id, {
      id: commentId,
      author: payload.author?.trim() || "Unassigned",
      authorId: payload.actorId?.trim() || "",
      body,
      content,
      mentions,
      attachments: [
        ...images.map((image) => ({ ...image, size: image.data.length })),
        ...cards.map((card) => ({ ...card })),
      ],
      actorId: payload.actorId,
    });
    if (!updated) {
      throw AppError.notFound("Task", id);
    }
    return this.getTask(id);
  }

  async addAttachment(id: string, payload: AddTaskAttachmentDto, actor = "System"): Promise<ITask> {
    const existing = await this.getTask(id);
    if (existing.attachments.length >= MAX_ATTACHMENTS) {
      throw AppError.badRequest(`A task can have at most ${MAX_ATTACHMENTS} attachments`);
    }
    if (!payload.name?.trim()) {
      throw AppError.badRequest("Attachment name is required");
    }
    if (!IMAGE_TYPES.has(payload.mimeType)) {
      throw AppError.badRequest("Only JPEG, PNG, GIF, and WebP images can be attached");
    }
    if (!payload.contentBase64) {
      throw AppError.badRequest("Attachment data is required");
    }

    const data = decodeBase64(payload.contentBase64);
    if (!data.length) {
      throw AppError.badRequest("Attachment data is empty");
    }
    if (data.length > MAX_ATTACHMENT_BYTES) {
      throw AppError.badRequest("Attachments must be 2 MB or smaller");
    }

    const updated = await this.tasks.addAttachment(id, {
      ...payload,
      name: payload.name.trim(),
      data,
      size: data.length,
      author: actor,
      actorId: payload.actorId,
    });
    if (!updated) {
      throw AppError.notFound("Task", id);
    }

    return this.getTask(id);
  }

  async removeAttachment(id: string, attachmentId: string): Promise<ITask> {
    await this.getTask(id);
    const updated = await this.tasks.removeAttachment(id, attachmentId);
    if (!updated) {
      throw AppError.notFound("Task", id);
    }
    return this.getTask(id);
  }

  async getAttachmentFile(id: string, attachmentId: string) {
    await this.getTask(id);
    const attachment = await this.tasks.getAttachment(id, attachmentId);
    if (!attachment) {
      throw AppError.notFound("Attachment", attachmentId);
    }
    return attachment;
  }

  async getCommentAttachmentFile(id: string, commentId: string, attachmentId: string) {
    await this.getTask(id);
    const attachment = await this.tasks.getCommentAttachment(id, commentId, attachmentId);
    if (!attachment) {
      throw AppError.notFound("Attachment", attachmentId);
    }
    return attachment;
  }

  async deleteTask(id: string): Promise<void> {
    await this.getTask(id);
    await this.tasks.delete(id);
  }

  private async visibleProjectIds(userId?: string): Promise<Set<string> | null> {
    if (!userId) {
      return null;
    }
    const user = await this.users.findById(userId);
    if (!user || isAdminRole(user.role)) {
      return null;
    }
    const fromProjects = await this.projects.findIdsForUser(user.id);
    return new Set(fromProjects.length > 0 ? fromProjects : (user.assignedProjects ?? []));
  }

  private async ensureProjectExists(projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project) {
      throw AppError.badRequest("Cannot assign a task to an unknown project", { projectId });
    }
    return project;
  }

  private assertCreatePayload(payload: CreateTaskDto): void {
    const missing: string[] = [];
    if (!payload.title?.trim()) missing.push("title");
    if (!payload.projectId?.trim()) missing.push("projectId");

    if (missing.length > 0) {
      throw AppError.badRequest("Missing required task fields", { missing });
    }

    if (payload.status && !TASK_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid task status");
    }
  }

  private changeNotes(before: ITask, after: ITask): AppendActivityDto[] {
    const notes: AppendActivityDto[] = [];
    if (before.status !== after.status) {
      notes.push({
        userName: "",
        actionType: "status",
        oldValue: statusLabel(before.status),
        newValue: statusLabel(after.status),
        message: "changed the Status",
      });
    }
    if (before.assignee !== after.assignee) {
      notes.push({
        userName: "",
        actionType: "assignee",
        oldValue: before.assignee,
        newValue: after.assignee,
        message: "changed the Assignee",
      });
    }
    if (before.title !== after.title) {
      notes.push({
        userName: "",
        actionType: "update",
        oldValue: before.title,
        newValue: after.title,
        message: "changed the Title",
      });
    }
    if (before.dueDate !== after.dueDate) {
      notes.push({
        userName: "",
        actionType: "update",
        oldValue: before.dueDate || "None",
        newValue: after.dueDate || "None",
        message: after.dueDate ? "changed the Due date" : "cleared the Due date",
      });
    }
    if (before.description !== after.description) {
      notes.push({
        userName: "",
        actionType: "update",
        oldValue: "",
        newValue: "",
        message: "updated the Description",
      });
    }
    if (before.estimatedHours !== after.estimatedHours || before.spentHours !== after.spentHours) {
      notes.push({
        userName: "",
        actionType: "worklog",
        oldValue: `${before.spentHours}h / ${before.estimatedHours}h`,
        newValue: `${after.spentHours}h / ${after.estimatedHours}h`,
        message: `logged ${Math.max(0, after.spentHours - before.spentHours)}h`,
      });
    }
    return notes;
  }
}

export const taskService = new TaskService(taskRepository, projectRepository, userRepository);
