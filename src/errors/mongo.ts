import { Error as MongooseError } from "mongoose";
import { AppError } from "./app-error.js";

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export function toAppError(error: unknown): unknown {
  if (error instanceof AppError) {
    return error;
  }

  if (isDuplicateKeyError(error)) {
    return AppError.conflict("A record with this unique field already exists");
  }

  if (error instanceof MongooseError.ValidationError) {
    return AppError.badRequest("Validation failed", error.errors);
  }

  if (error instanceof MongooseError.CastError) {
    return AppError.badRequest(`Invalid ${error.path}`);
  }

  return error;
}
