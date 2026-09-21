import { AppError } from "../errors/app-error.js";
import { projectRepository } from "../repositories/project.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import { isAdminRole, type CreateUserDto, type IUser, type UpdateUserDto } from "../types/user.types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_ROLES = new Set(["admin", "lead", "member"]);

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async listUsers(): Promise<IUser[]> {
    return this.users.findAll();
  }

  async getUser(id: string): Promise<IUser> {
    const user = await this.users.findById(id);
    if (!user) {
      throw AppError.notFound("User", id);
    }
    return user;
  }

  async createUser(payload: CreateUserDto): Promise<IUser> {
    this.assertCreatePayload(payload);

    const existing = await this.users.findByEmail(payload.email);
    if (existing) {
      throw AppError.conflict("A user with this email already exists");
    }

    const assignedProjects = await this.normalizeProjectIds(payload.assignedProjects);
    const created = await this.users.create({
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      assignedProjects,
    });
    await this.syncProjectTeamMembership(created.id, assignedProjects);
    return created;
  }

  async updateUser(id: string, payload: UpdateUserDto): Promise<IUser> {
    await this.getUser(id);
    this.assertUpdatePayload(payload);

    if (payload.email) {
      const duplicate = await this.users.findByEmail(payload.email);
      if (duplicate && duplicate.id !== id) {
        throw AppError.conflict("A user with this email already exists");
      }
    }

    const assignedProjects =
      payload.assignedProjects !== undefined ? await this.normalizeProjectIds(payload.assignedProjects) : undefined;

    const updated = await this.users.update(id, {
      ...payload,
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
      ...(assignedProjects !== undefined ? { assignedProjects } : {}),
    });

    if (!updated) {
      throw AppError.notFound("User", id);
    }

    if (assignedProjects !== undefined) {
      await this.syncProjectTeamMembership(updated.id, assignedProjects);
    }

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUser(id);
    await this.users.delete(id);
  }

  async visibleProjectIds(user: IUser): Promise<string[] | null> {
    if (isAdminRole(user.role)) {
      return null;
    }
    const fromProjects = await projectRepository.findIdsForUser(user.id);
    return fromProjects.length > 0 ? fromProjects : (user.assignedProjects ?? []);
  }

  private async syncProjectTeamMembership(userId: string, projectIds: string[]): Promise<void> {
    const allowed = new Set(projectIds);
    const projects = await projectRepository.findAll();
    await Promise.all(
      projects.map((project) => {
        const has = project.assignedTeam.includes(userId);
        const should = allowed.has(project.id);
        if (has === should) {
          return undefined;
        }
        const assignedTeam = should
          ? [...project.assignedTeam, userId]
          : project.assignedTeam.filter((id) => id !== userId);
        return projectRepository.update(project.id, { assignedTeam });
      }),
    );
  }

  private async normalizeProjectIds(projectIds?: string[]): Promise<string[]> {
    if (!projectIds?.length) {
      return [];
    }
    const unique = [...new Set(projectIds.map((id) => id.trim()).filter(Boolean))];
    const projects = await projectRepository.findAll();
    const known = new Set(projects.map((project) => project.id));
    const unknown = unique.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      throw AppError.badRequest("Cannot assign a user to an unknown project", { unknown });
    }
    return unique;
  }

  private assertCreatePayload(payload: CreateUserDto): void {
    const missing: string[] = [];
    if (!payload.name?.trim()) missing.push("name");
    if (!payload.email?.trim()) missing.push("email");

    if (missing.length > 0) {
      throw AppError.badRequest("Missing required user fields", { missing });
    }

    if (!EMAIL_PATTERN.test(payload.email)) {
      throw AppError.badRequest("Invalid email address");
    }

    if (payload.role && !USER_ROLES.has(payload.role)) {
      throw AppError.badRequest("Invalid user role");
    }
  }

  private assertUpdatePayload(payload: UpdateUserDto): void {
    if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
      throw AppError.badRequest("Invalid email address");
    }

    if (payload.role && !USER_ROLES.has(payload.role)) {
      throw AppError.badRequest("Invalid user role");
    }
  }
}

export const userService = new UserService(userRepository);
