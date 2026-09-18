import type { Request, Response } from "express";
import { invoiceService } from "../services/invoice.service.js";
import type { CreateInvoiceDto, UpdateInvoiceDto } from "../types/invoice.types.js";
import { asyncHandler } from "../utils/async-handler.js";

export class InvoiceController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const invoices = await invoiceService.listInvoices(clientId);
    res.status(200).json({ success: true, data: invoices });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.getInvoice(req.params.id as string);
    res.status(200).json({ success: true, data: invoice });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.createInvoice(req.body as CreateInvoiceDto);
    res.status(201).json({ success: true, data: invoice, message: "Invoice created" });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.updateInvoice(
      req.params.id as string,
      req.body as UpdateInvoiceDto,
    );
    res.status(200).json({ success: true, data: invoice, message: "Invoice updated" });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await invoiceService.deleteInvoice(req.params.id as string);
    res.status(200).json({ success: true, data: { id: req.params.id }, message: "Invoice deleted" });
  });
}

export const invoiceController = new InvoiceController();
