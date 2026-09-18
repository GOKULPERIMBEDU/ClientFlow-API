import { AppError } from "../errors/app-error.js";
import { isDuplicateKeyError } from "../errors/mongo.js";
import { ClientModel, type ClientHydratedDocument } from "../models/client.model.js";
import type { CreateClientDto, IClient, UpdateClientDto } from "../types/client.types.js";
import type { IRepository } from "./interfaces/base.repository.js";

function toClient(doc: ClientHydratedDocument): IClient {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    company: doc.company,
    phone: doc.phone,
    status: doc.status,
    timezone: doc.timezone,
    industry: doc.industry,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * MongoDB data access for the Clients module.
 * Persistence details stay isolated from business rules in the service layer.
 */
export class ClientRepository implements IRepository<IClient, CreateClientDto, UpdateClientDto> {
  async findAll(): Promise<IClient[]> {
    const docs = await ClientModel.find().sort({ name: 1 }).exec();
    return docs.map(toClient);
  }

  async findById(id: string): Promise<IClient | null> {
    const doc = await ClientModel.findById(id).exec();
    return doc ? toClient(doc) : null;
  }

  async findByEmail(email: string): Promise<IClient | null> {
    const doc = await ClientModel.findOne({ email: email.trim().toLowerCase() }).exec();
    return doc ? toClient(doc) : null;
  }

  async create(payload: CreateClientDto): Promise<IClient> {
    try {
      const doc = await ClientModel.create({
        name: payload.name,
        email: payload.email,
        company: payload.company,
        phone: payload.phone,
        status: payload.status ?? "onboarding",
        timezone: payload.timezone ?? "UTC",
        industry: payload.industry ?? "General",
      });
      return toClient(doc);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw AppError.conflict("A client with this email already exists");
      }
      throw error;
    }
  }

  async update(id: string, payload: UpdateClientDto): Promise<IClient | null> {
    try {
      const doc = await ClientModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      }).exec();
      return doc ? toClient(doc) : null;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw AppError.conflict("A client with this email already exists");
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await ClientModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const clientRepository = new ClientRepository();
