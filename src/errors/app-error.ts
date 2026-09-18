export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static notFound(resource: string, id?: string): AppError {
    const suffix = id ? ` (${id})` : "";
    return new AppError(`${resource} not found${suffix}`, 404, "NOT_FOUND");
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, "CONFLICT");
  }
}
