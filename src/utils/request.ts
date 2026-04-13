import { randomUUID } from "crypto";
import type { RequestHandler } from "express";

const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestIdHeader = req.headers["x-request-id"];
  const requestId =
    typeof requestIdHeader === "string" && requestIdHeader.length > 0
      ? requestIdHeader
      : randomUUID();

  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

export { requestIdMiddleware };
