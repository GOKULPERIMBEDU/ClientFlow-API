import { ProjectModel, type ProjectHydratedDocument } from "../models/project.model.js";
import type { CreateProjectDto, IProject, UpdateProjectDto } from "../types/project.types.js";
import type { IRepository } from "./interfaces/base.repository.js";

function toProject(doc: ProjectHydratedDocument): IProject {
  return {
    id: doc._id,
    clientId: doc.clientId,
    name: doc.name,
    description: doc.description,
    status: doc.status,
    budget: doc.budget,
    currency: doc.currency,
    startDate: doc.startDate,
    endDate: doc.endDate,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class ProjectRepository implements IRepository<IProject, CreateProjectDto, UpdateProjectDto> {
  async findAll(): Promise<IProject[]> {
    const docs = await ProjectModel.find().sort({ name: 1 }).exec();
    return docs.map(toProject);
  }

  async findById(id: string): Promise<IProject | null> {
    const doc = await ProjectModel.findById(id).exec();
    return doc ? toProject(doc) : null;
  }

  async findByClientId(clientId: string): Promise<IProject[]> {
    const docs = await ProjectModel.find({ clientId }).sort({ name: 1 }).exec();
    return docs.map(toProject);
  }

  async create(payload: CreateProjectDto): Promise<IProject> {
    const doc = await ProjectModel.create({
      clientId: payload.clientId,
      name: payload.name,
      description: payload.description,
      status: payload.status ?? "planning",
      budget: payload.budget,
      currency: payload.currency ?? "USD",
      startDate: payload.startDate,
      endDate: payload.endDate,
    });
    return toProject(doc);
  }

  async update(id: string, payload: UpdateProjectDto): Promise<IProject | null> {
    const doc = await ProjectModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).exec();
    return doc ? toProject(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProjectModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const projectRepository = new ProjectRepository();
