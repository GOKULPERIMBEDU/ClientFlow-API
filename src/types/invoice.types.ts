export type InvoiceStatus = "draft" | "sent" | "paid";

export interface IInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface IInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  notes: string;
  items: IInvoiceItem[];
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate?: number;
  notes?: string;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    rate: number;
  }>;
  status?: InvoiceStatus;
}

export interface UpdateInvoiceDto {
  invoiceNumber?: string;
  clientId?: string;
  issueDate?: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  items?: CreateInvoiceDto["items"];
  status?: InvoiceStatus;
}
