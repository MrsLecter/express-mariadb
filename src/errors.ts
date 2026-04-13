type AppErrorOptions = {
  cause?: unknown;
  details?: unknown;
  isOperational?: boolean;
};

class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly cause?: unknown;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
    this.cause = options.cause;
    this.isOperational = options.isOperational ?? true;
  }
}

class ValidationError extends AppError {
  constructor(message: string, code = "VALIDATION_ERROR", details?: unknown) {
    super(message, 400, code, { details });
  }
}

class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND", details?: unknown) {
    super(message, 404, code, { details });
  }
}

class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT", details?: unknown) {
    super(message, 409, code, { details });
  }
}

class DatabaseError extends AppError {
  constructor(
    message = "database query failed",
    code = "DATABASE_ERROR",
    options: AppErrorOptions = {}
  ) {
    super(message, 500, code, options);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(
    message = "service unavailable",
    code = "SERVICE_UNAVAILABLE",
    options: AppErrorOptions = {}
  ) {
    super(message, 503, code, options);
  }
}

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export {
  AppError,
  ConflictError,
  DatabaseError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
  isAppError,
};
export type { AppErrorOptions };
