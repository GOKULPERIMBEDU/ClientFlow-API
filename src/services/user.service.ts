import { AppError } from "../errors/app-error.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import type { CreateUserDto, IUser, UpdateUserDto } from "../types/user.types.js";

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

    return this.users.create({
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
    });
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

    const updated = await this.users.update(id, {
      ...payload,
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
    });

    if (!updated) {
      throw AppError.notFound("User", id);
    }

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUser(id);
    await this.users.delete(id);
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
