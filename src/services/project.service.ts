import { AppError } from "../errors/app-error.js";
import { clientRepository, type ClientRepository } from "../repositories/client.repository.js";
import { projectRepository, type ProjectRepository } from "../repositories/project.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import type { CreateProjectDto, IProject, UpdateProjectDto } from "../types/project.types.js";

const PROJECT_STATUSES = new Set(["planning", "active", "on_hold", "completed", "cancelled"]);

export class ProjectService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly clients: ClientRepository,
    private readonly users: UserRepository,
  ) {}

  async listProjects(): Promise<IProject[]> {
    return this.projects.findAll();
  }

  async listProjectsByClient(clientId: string): Promise<IProject[]> {
    await this.ensureClientExists(clientId);
    return this.projects.findByClientId(clientId);
  }

  async getProject(id: string): Promise<IProject> {
    const project = await this.projects.findById(id);
    if (!project) {
      throw AppError.notFound("Project", id);
    }
    return project;
  }

  async createProject(payload: CreateProjectDto): Promise<IProject> {
    this.assertCreatePayload(payload);
    await this.ensureClientExists(payload.clientId);
    this.assertDateRange(payload.startDate, payload.endDate);

    const assignedTeam = await this.normalizeTeamIds(payload.assignedTeam);
    const created = await this.projects.create({
      ...payload,
      name: payload.name.trim(),
      description: payload.description.trim(),
      assignedTeam,
    });
    await this.syncUserProjectMembership(created.id, assignedTeam);
    return created;
  }

  async updateProject(id: string, payload: UpdateProjectDto): Promise<IProject> {
    const existing = await this.getProject(id);

    if (payload.clientId) {
      await this.ensureClientExists(payload.clientId);
    }

    if (payload.status && !PROJECT_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid project status");
    }

    if (payload.budget !== undefined && payload.budget < 0) {
      throw AppError.badRequest("Budget cannot be negative");
    }

    const startDate = payload.startDate ?? existing.startDate;
    const endDate = payload.endDate ?? existing.endDate;
    this.assertDateRange(startDate, endDate);

    const assignedTeam =
      payload.assignedTeam !== undefined ? await this.normalizeTeamIds(payload.assignedTeam) : undefined;

    const updated = await this.projects.update(id, {
      ...payload,
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.description ? { description: payload.description.trim() } : {}),
      ...(assignedTeam !== undefined ? { assignedTeam } : {}),
    });

    if (!updated) {
      throw AppError.notFound("Project", id);
    }

    if (assignedTeam !== undefined) {
      await this.syncUserProjectMembership(updated.id, assignedTeam);
    }

    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await this.getProject(id);
    await this.projects.delete(id);
  }

  private async ensureClientExists(clientId: string): Promise<void> {
    const client = await this.clients.findById(clientId);
    if (!client) {
      throw AppError.badRequest("Cannot assign a project to an unknown client", { clientId });
    }
  }

  private assertCreatePayload(payload: CreateProjectDto): void {
    const missing: string[] = [];
    if (!payload.clientId?.trim()) missing.push("clientId");
    if (!payload.name?.trim()) missing.push("name");
    if (!payload.description?.trim()) missing.push("description");
    if (!payload.startDate) missing.push("startDate");
    if (!payload.endDate) missing.push("endDate");
    if (payload.budget === undefined || payload.budget === null) missing.push("budget");

    if (missing.length > 0) {
      throw AppError.badRequest("Missing required project fields", { missing });
    }

    if (payload.budget < 0) {
      throw AppError.badRequest("Budget cannot be negative");
    }

    if (payload.status && !PROJECT_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid project status");
    }
  }

  private async normalizeTeamIds(userIds?: string[]): Promise<string[]> {
    if (!userIds?.length) {
      return [];
    }
    const unique = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
    const users = await this.users.findAll();
    const known = new Set(users.map((user) => user.id));
    const unknown = unique.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      throw AppError.badRequest("Cannot assign an unknown team member", { unknown });
    }
    return unique;
  }

  private async syncUserProjectMembership(projectId: string, teamIds: string[]): Promise<void> {
    const team = new Set(teamIds);
    const users = await this.users.findAll();
    await Promise.all(
      users.map((user) => {
        const has = user.assignedProjects.includes(projectId);
        const should = team.has(user.id);
        if (has === should) {
          return undefined;
        }
        const assignedProjects = should
          ? [...user.assignedProjects, projectId]
          : user.assignedProjects.filter((id) => id !== projectId);
        return this.users.update(user.id, { assignedProjects });
      }),
    );
  }

  private assertDateRange(startDate: string, endDate: string): void {
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      throw AppError.badRequest("Project end date cannot be before the start date");
    }
  }
}

export const projectService = new ProjectService(projectRepository, clientRepository, userRepository);
