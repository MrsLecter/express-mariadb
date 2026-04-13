import type { Request } from "express";
import { ValidationError } from "../errors";

const MIN_DB_SCORE_VALUE = -2147483648;
const MAX_DB_SCORE_VALUE = 2147483647;

type CreateScoreInput = {
  userId: number;
  value: number;
};

function parseCreateScoreRequest(req: Request): CreateScoreInput {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new ValidationError(
      "request body must be a JSON object with user_id and value",
      "INVALID_REQUEST_BODY"
    );
  }

  const { user_id, value } = req.body as {
    user_id?: unknown;
    value?: unknown;
  };

  if (
    typeof user_id !== "number" ||
    !Number.isInteger(user_id) ||
    user_id <= 0
  ) {
    throw new ValidationError("user_id must be a positive integer", "INVALID_USER_ID");
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < MIN_DB_SCORE_VALUE ||
    value > MAX_DB_SCORE_VALUE
  ) {
    throw new ValidationError(
      `value must be an integer between ${MIN_DB_SCORE_VALUE} and ${MAX_DB_SCORE_VALUE}`,
      "INVALID_SCORE_VALUE"
    );
  }

  return {
    userId: user_id,
    value,
  };
}

export { parseCreateScoreRequest };
export type { CreateScoreInput };
