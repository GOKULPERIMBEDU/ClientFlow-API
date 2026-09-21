import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../errors/app-error.js";
import { toAppError } from "../errors/mongo.js";
import type { ApiErrorResponse } from "../types/common.types.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction,
): void {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Files must be 8 MB or smaller" : error.message;
    res.status(400).json({
      success: false,
      error: { message, code: "BAD_REQUEST" },
    });
    return;
  }

  const mapped = toAppError(error);

  if (mapped instanceof AppError) {
    res.status(mapped.statusCode).json({
      success: false,
      error: {
        message: mapped.message,
        code: mapped.code,
        details: mapped.details,
      },
    });
    return;
  }

  const message = mapped instanceof Error ? mapped.message : "Unexpected server error";
  console.error("[ClientFlow API]", mapped);

  res.status(500).json({
    success: false,
    error: {
      message,
      code: "INTERNAL_ERROR",
    },
  });
}
