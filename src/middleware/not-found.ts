import type { Request, Response } from "express";
import type { ApiErrorResponse } from "../types/common.types.js";

export function notFoundHandler(_req: Request, res: Response<ApiErrorResponse>): void {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
      code: "ROUTE_NOT_FOUND",
    },
  });
}
