import { AppError } from "../errors/app-error.js";
import { projectRepository, type ProjectRepository } from "../repositories/project.repository.js";
import { taskRepository, type TaskRepository } from "../repositories/task.repository.js";
import type { CreateTaskDto, ITask, UpdateTaskDto } from "../types/task.types.js";

const TASK_STATUSES = new Set(["todo", "in_progress", "review", "done"]);

export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async listTasks(projectId?: string): Promise<ITask[]> {
    if (projectId) {
      await this.ensureProjectExists(projectId);
    }

    const [rawTasks, projects] = await Promise.all([
      projectId ? this.tasks.findByProjectId(projectId) : this.tasks.findAll(),
      this.projects.findAll(),
    ]);

    const names = new Map(projects.map((project) => [project.id, project.name]));
    return rawTasks.map((task) => ({
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

  async updateTask(id: string, payload: UpdateTaskDto): Promise<ITask> {
    await this.getTask(id);

    if (payload.status && !TASK_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid task status");
    }

    if (payload.projectId) {
      await this.ensureProjectExists(payload.projectId);
    }

    const updated = await this.tasks.update(id, {
      ...payload,
      ...(payload.title ? { title: payload.title.trim() } : {}),
      ...(payload.assignee ? { assignee: payload.assignee.trim() } : {}),
    });

    if (!updated) {
      throw AppError.notFound("Task", id);
    }

    const project = await this.projects.findById(updated.projectId);
    return { ...updated, projectName: project?.name ?? "Unknown project" };
  }

  async deleteTask(id: string): Promise<void> {
    await this.getTask(id);
    await this.tasks.delete(id);
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
}

export const taskService = new TaskService(taskRepository, projectRepository);
