import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, NotFoundError, ValidationError, isAppError } from "../errors";
import { logError } from "../logger";

function isJsonParseError(error: unknown) {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const bodyParserError = error as SyntaxError & {
    body?: unknown;
    status?: number;
    type?: string;
  };

  return bodyParserError.type === "entity.parse.failed" || bodyParserError.status === 400;
}

const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new NotFoundError("route not found", "ROUTE_NOT_FOUND", {
      method: req.method,
      path: req.originalUrl,
    })
  );
};

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let appError: AppError;

  if (isAppError(error)) {
    appError = error;
  } else if (isJsonParseError(error)) {
    appError = new ValidationError("request body contains invalid JSON", "INVALID_JSON");
  } else {
    appError = new AppError(
      "internal server error",
      500,
      "INTERNAL_SERVER_ERROR",
      {
        cause: error,
        isOperational: false,
      }
    );
  }

  logError(req, appError);

  const body: {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  } = {
    error: {
      code: appError.code,
      message: appError.message,
    },
  };

  if (appError.statusCode < 500 && appError.details !== undefined) {
    body.error.details = appError.details;
  }

  res.status(appError.statusCode).json(body);
};

export { errorHandler, notFoundHandler };
