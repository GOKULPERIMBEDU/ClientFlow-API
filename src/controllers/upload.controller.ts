import type { Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { storeUpload } from "../services/file-storage.js";
import { asyncHandler } from "../utils/async-handler.js";

export const uploadController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw AppError.badRequest("Choose a file to upload");
    }
    const stored = await storeUpload({
      buffer: file.buffer,
      originalname: file.originalname || "upload",
      mimetype: file.mimetype,
    });
    res.status(201).json({ success: true, data: stored, message: "File uploaded" });
  }),
};
