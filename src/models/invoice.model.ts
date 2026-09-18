import { Schema, model, type HydratedDocument } from "mongoose";
import type { InvoiceStatus } from "../types/invoice.types.js";

const INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid"];

export interface InvoiceItemDocument {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceDocument {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  notes: string;
  items: InvoiceItemDocument[];
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<InvoiceItemDocument>(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    _id: {
      type: String,
      default: () => `inv_${crypto.randomUUID()}`,
    },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    clientId: { type: String, required: true, index: true },
    issueDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    taxRate: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", trim: true },
    items: { type: [invoiceItemSchema], default: [] },
    status: { type: String, enum: INVOICE_STATUSES, default: "draft" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type InvoiceHydratedDocument = HydratedDocument<InvoiceDocument>;
export const InvoiceModel = model<InvoiceDocument>("Invoice", invoiceSchema);
