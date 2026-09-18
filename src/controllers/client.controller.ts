import type { Request, Response } from "express";
import { clientService } from "../services/client.service.js";
import type { CreateClientDto, UpdateClientDto } from "../types/client.types.js";
import { asyncHandler } from "../utils/async-handler.js";

export class ClientController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const clients = await clientService.listClients();
    res.status(200).json({ success: true, data: clients });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.getClient(req.params.id as string);
    res.status(200).json({ success: true, data: client });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.createClient(req.body as CreateClientDto);
    res.status(201).json({ success: true, data: client, message: "Client created" });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.updateClient(
      req.params.id as string,
      req.body as UpdateClientDto,
    );
    res.status(200).json({ success: true, data: client, message: "Client updated" });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await clientService.deleteClient(req.params.id as string);
    res.status(200).json({ success: true, data: { id: req.params.id }, message: "Client deleted" });
  });
}

export const clientController = new ClientController();
