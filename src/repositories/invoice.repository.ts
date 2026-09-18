import { AppError } from "../errors/app-error.js";
import { isDuplicateKeyError } from "../errors/mongo.js";
import { InvoiceModel, type InvoiceHydratedDocument } from "../models/invoice.model.js";
import type { CreateInvoiceDto, IInvoice, IInvoiceItem, UpdateInvoiceDto } from "../types/invoice.types.js";
import type { IRepository } from "./interfaces/base.repository.js";

function withTotals(invoice: Omit<IInvoice, "subtotal" | "tax" | "total">): IInvoice {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  return { ...invoice, subtotal, tax, total: subtotal + tax };
}

function toInvoice(doc: InvoiceHydratedDocument): IInvoice {
  const items: IInvoiceItem[] = doc.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
  }));

  return withTotals({
    id: doc._id,
    invoiceNumber: doc.invoiceNumber,
    clientId: doc.clientId,
    issueDate: doc.issueDate,
    dueDate: doc.dueDate,
    taxRate: doc.taxRate,
    notes: doc.notes,
    items,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  });
}

function normalizeItems(items: CreateInvoiceDto["items"]): IInvoiceItem[] {
  return items.map((item) => ({
    id: item.id || crypto.randomUUID(),
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
  }));
}

export class InvoiceRepository implements IRepository<IInvoice, CreateInvoiceDto, UpdateInvoiceDto> {
  async findAll(): Promise<IInvoice[]> {
    const docs = await InvoiceModel.find().sort({ createdAt: -1 }).exec();
    return docs.map(toInvoice);
  }

  async findByClientId(clientId: string): Promise<IInvoice[]> {
    const docs = await InvoiceModel.find({ clientId }).sort({ createdAt: -1 }).exec();
    return docs.map(toInvoice);
  }

  async findById(id: string): Promise<IInvoice | null> {
    const doc = await InvoiceModel.findById(id).exec();
    return doc ? toInvoice(doc) : null;
  }

  async findByNumber(invoiceNumber: string): Promise<IInvoice | null> {
    const doc = await InvoiceModel.findOne({ invoiceNumber }).exec();
    return doc ? toInvoice(doc) : null;
  }

  async create(payload: CreateInvoiceDto): Promise<IInvoice> {
    try {
      const doc = await InvoiceModel.create({
        invoiceNumber: payload.invoiceNumber,
        clientId: payload.clientId,
        issueDate: payload.issueDate,
        dueDate: payload.dueDate,
        taxRate: payload.taxRate ?? 0,
        notes: payload.notes ?? "",
        items: normalizeItems(payload.items),
        status: payload.status ?? "draft",
      });
      return toInvoice(doc);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw AppError.conflict("An invoice with this number already exists");
      }
      throw error;
    }
  }

  async update(id: string, payload: UpdateInvoiceDto): Promise<IInvoice | null> {
    try {
      const update = {
        ...payload,
        ...(payload.items ? { items: normalizeItems(payload.items) } : {}),
      };
      const doc = await InvoiceModel.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      }).exec();
      return doc ? toInvoice(doc) : null;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw AppError.conflict("An invoice with this number already exists");
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await InvoiceModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const invoiceRepository = new InvoiceRepository();
