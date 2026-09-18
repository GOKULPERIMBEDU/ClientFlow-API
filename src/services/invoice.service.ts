import { AppError } from "../errors/app-error.js";
import { clientRepository, type ClientRepository } from "../repositories/client.repository.js";
import { invoiceRepository, type InvoiceRepository } from "../repositories/invoice.repository.js";
import type { CreateInvoiceDto, IInvoice, UpdateInvoiceDto } from "../types/invoice.types.js";

const INVOICE_STATUSES = new Set(["draft", "sent", "paid"]);

export class InvoiceService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly clients: ClientRepository,
  ) {}

  async listInvoices(clientId?: string): Promise<IInvoice[]> {
    if (clientId) {
      await this.ensureClientExists(clientId);
      return this.invoices.findByClientId(clientId);
    }
    return this.invoices.findAll();
  }

  async getInvoice(id: string): Promise<IInvoice> {
    const invoice = await this.invoices.findById(id);
    if (!invoice) {
      throw AppError.notFound("Invoice", id);
    }
    return invoice;
  }

  async createInvoice(payload: CreateInvoiceDto): Promise<IInvoice> {
    this.assertCreatePayload(payload);
    await this.ensureClientExists(payload.clientId);

    const existing = await this.invoices.findByNumber(payload.invoiceNumber.trim());
    if (existing) {
      throw AppError.conflict("An invoice with this number already exists");
    }

    return this.invoices.create({
      ...payload,
      invoiceNumber: payload.invoiceNumber.trim(),
      notes: payload.notes?.trim() ?? "",
      items: payload.items.map((item) => ({
        ...item,
        description: item.description.trim(),
      })),
    });
  }

  async updateInvoice(id: string, payload: UpdateInvoiceDto): Promise<IInvoice> {
    await this.getInvoice(id);

    if (payload.clientId) {
      await this.ensureClientExists(payload.clientId);
    }

    if (payload.status && !INVOICE_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid invoice status");
    }

    if (payload.invoiceNumber) {
      const duplicate = await this.invoices.findByNumber(payload.invoiceNumber.trim());
      if (duplicate && duplicate.id !== id) {
        throw AppError.conflict("An invoice with this number already exists");
      }
    }

    if (payload.items) {
      this.assertItems(payload.items);
    }

    const updated = await this.invoices.update(id, {
      ...payload,
      ...(payload.invoiceNumber ? { invoiceNumber: payload.invoiceNumber.trim() } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes.trim() } : {}),
    });

    if (!updated) {
      throw AppError.notFound("Invoice", id);
    }

    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.getInvoice(id);
    await this.invoices.delete(id);
  }

  private async ensureClientExists(clientId: string): Promise<void> {
    const client = await this.clients.findById(clientId);
    if (!client) {
      throw AppError.badRequest("Cannot bill an unknown client", { clientId });
    }
  }

  private assertCreatePayload(payload: CreateInvoiceDto): void {
    const missing: string[] = [];
    if (!payload.invoiceNumber?.trim()) missing.push("invoiceNumber");
    if (!payload.clientId?.trim()) missing.push("clientId");
    if (!payload.issueDate) missing.push("issueDate");
    if (!payload.dueDate) missing.push("dueDate");

    if (missing.length > 0) {
      throw AppError.badRequest("Missing required invoice fields", { missing });
    }

    if (payload.taxRate !== undefined && payload.taxRate < 0) {
      throw AppError.badRequest("Tax rate cannot be negative");
    }

    if (payload.status && !INVOICE_STATUSES.has(payload.status)) {
      throw AppError.badRequest("Invalid invoice status");
    }

    this.assertItems(payload.items);
  }

  private assertItems(items: CreateInvoiceDto["items"]): void {
    if (!items || items.length === 0) {
      throw AppError.badRequest("Invoice must include at least one line item");
    }

    for (const item of items) {
      if (!item.description?.trim()) {
        throw AppError.badRequest("Each line item needs a description");
      }
      if (item.quantity < 1) {
        throw AppError.badRequest("Line item quantity must be at least 1");
      }
      if (item.rate < 0) {
        throw AppError.badRequest("Line item rate cannot be negative");
      }
    }
  }
}

export const invoiceService = new InvoiceService(invoiceRepository, clientRepository);
