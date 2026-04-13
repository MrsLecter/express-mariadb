import type { Request } from "express";
import { ValidationError } from "../errors";
import { parsePositiveInteger } from "../utils/http";

function parseUserRankRequest(req: Request) {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (typeof rawId !== "string") {
    throw new ValidationError("id must be a positive integer", "INVALID_USER_ID");
  }

  const userId = parsePositiveInteger(rawId);

  if (userId === null) {
    throw new ValidationError("id must be a positive integer", "INVALID_USER_ID");
  }

  return { userId };
}

export { parseUserRankRequest };
