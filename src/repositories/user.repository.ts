import { AppError } from "../errors/app-error.js";
import { isDuplicateKeyError } from "../errors/mongo.js";
import { UserModel, type UserHydratedDocument } from "../models/user.model.js";
import type { CreateUserDto, IUser, UpdateUserDto } from "../types/user.types.js";
import type { IRepository } from "./interfaces/base.repository.js";

function toUser(doc: UserHydratedDocument): IUser {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    assignedProjects: doc.assignedProjects ?? [],
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * MongoDB data access for the Users module.
 */
export class UserRepository implements IRepository<IUser, CreateUserDto, UpdateUserDto> {
  async findAll(): Promise<IUser[]> {
    const docs = await UserModel.find().sort({ name: 1 }).exec();
    return docs.map(toUser);
  }

  async findById(id: string): Promise<IUser | null> {
    const doc = await UserModel.findById(id).exec();
    return doc ? toUser(doc) : null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const doc = await UserModel.findOne({ email: email.trim().toLowerCase() }).exec();
    return doc ? toUser(doc) : null;
  }

  async create(payload: CreateUserDto): Promise<IUser> {
    try {
      const doc = await UserModel.create({
        name: payload.name,
        email: payload.email,
        role: payload.role ?? "member",
        assignedProjects: payload.assignedProjects ?? [],
      });
      return toUser(doc);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw AppError.conflict("A user with this email already exists");
      }
      throw error;
    }
  }

  async update(id: string, payload: UpdateUserDto): Promise<IUser | null> {
    try {
      const doc = await UserModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      }).exec();
      return doc ? toUser(doc) : null;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw AppError.conflict("A user with this email already exists");
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const userRepository = new UserRepository();
