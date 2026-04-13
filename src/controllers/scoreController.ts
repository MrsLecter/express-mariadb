import type { Request, Response } from "express";
import { ValidationError } from "../errors";
import { createScore } from "../services/scoreService";
import { toIsoString, toJsonNumber } from "../utils/serialization";

const MIN_DB_SCORE_VALUE = -2147483648;
const MAX_DB_SCORE_VALUE = 2147483647;

async function createScoreController(req: Request, res: Response) {
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

  const score = await createScore(user_id, value);

  res.status(201).json({
    id: toJsonNumber(score.id),
    user_id: score.user_id,
    value: score.value,
    created_at: toIsoString(score.created_at),
  });
}

export { createScoreController };
