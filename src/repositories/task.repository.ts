import { TaskModel, type TaskHydratedDocument } from "../models/task.model.js";
import type { CreateTaskDto, ITask, UpdateTaskDto } from "../types/task.types.js";
import type { IRepository } from "./interfaces/base.repository.js";

function toTask(doc: TaskHydratedDocument, projectName = "Unknown project"): ITask {
  return {
    id: doc._id,
    title: doc.title,
    projectId: doc.projectId,
    projectName,
    assignee: doc.assignee,
    status: doc.status,
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
    const doc = await TaskModel.create({
      title: payload.title,
      projectId: payload.projectId,
      assignee: payload.assignee ?? "Unassigned",
      status: payload.status ?? "todo",
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

  async delete(id: string): Promise<boolean> {
    const result = await TaskModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const taskRepository = new TaskRepository();
export { toTask };
