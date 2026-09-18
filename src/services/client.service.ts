import { AppError } from "../errors/app-error.js";
import { clientRepository, type ClientRepository } from "../repositories/client.repository.js";
import type { CreateClientDto, IClient, UpdateClientDto } from "../types/client.types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLIENT_STATUSES = new Set(["active", "onboarding", "paused", "archived"]);

export class ClientService {
  constructor(private readonly clients: ClientRepository) {}

  async listClients(): Promise<IClient[]> {
    return this.clients.findAll();
  }

  async getClient(id: string): Promise<IClient> {
    const client = await this.clients.findById(id);
    if (!client) {
      throw AppError.notFound("Client", id);
    }
    return client;
  }

  async createClient(payload: CreateClientDto): Promise<IClient> {
    this.assertCreatePayload(payload);

    const existing = await this.clients.findByEmail(payload.email);
    if (existing) {
      throw AppError.conflict("A client with this email already exists");
    }

    return this.clients.create({
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      company: payload.company.trim(),
    });
  }

  async updateClient(id: string, payload: UpdateClientDto): Promise<IClient> {
    await this.getClient(id);
    this.assertUpdatePayload(payload);

    if (payload.email) {
      const duplicate = await this.clients.findByEmail(payload.email);
      if (duplicate && duplicate.id !== id) {
        throw AppError.conflict("A client with this email already exists");
      }
    }

    const updated = await this.clients.update(id, {
      ...payload,
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
      ...(payload.company ? { company: payload.company.trim() } : {}),
    });

    if (!updated) {
      throw AppError.notFound("Client", id);
    }

    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    await this.getClient(id);
    await this.clients.delete(id);
  }

  private assertCreatePayload(payload: CreateClientDto): void {
    const missing: string[] = [];
    if (!payload.name?.trim()) missing.push("name");
    if (!payload.email?.trim()) missing.push("email");
    if (!payload.company?.trim()) missing.push("company");
    if (!payload.phone?.trim()) missing.push("phone");

    if (missing.length > 0) {
      throw AppError.badRequest("Missing required client fields", { missing });
    }

    if (!EMAIL_PATTERN.test(payload.email)) {
      throw AppError.badRequest("Invalid email address");
    }

    if (payload.status && !CLIENT_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid client status");
    }
  }

  private assertUpdatePayload(payload: UpdateClientDto): void {
    if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
      throw AppError.badRequest("Invalid email address");
    }

    if (payload.status && !CLIENT_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid client status");
    }
  }
}

export const clientService = new ClientService(clientRepository);
