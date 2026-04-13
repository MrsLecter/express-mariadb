import type { Request } from "express";
import { AppError } from "./errors";

function serializeErrorCause(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function logError(request: Request, appError: AppError) {
  const requestId = request.headers["x-request-id"];

  console.error("Request failed", {
    requestId: typeof requestId === "string" ? requestId : undefined,
    method: request.method,
    path: request.originalUrl,
    statusCode: appError.statusCode,
    error: {
      code: appError.code,
      message: appError.message,
      cause: serializeErrorCause(appError.cause),
      details: appError.details,
    },
  });
}

function logProcessError(event: string, error: unknown) {
  console.error(`Process ${event}`, {
    error: serializeErrorCause(error),
  });
}

function logInternalError(event: string, error: unknown, details?: unknown) {
  console.error(event, {
    error: serializeErrorCause(error),
    details,
  });
}

export { logError, logInternalError, logProcessError };
