import type { Request, Response } from "express";
import { createScore } from "../services/scoreService";
import { toIsoString, toJsonNumber } from "../utils/serialization";
import { parseCreateScoreRequest } from "../validators/score";

async function createScoreController(req: Request, res: Response) {
  const { userId, value } = parseCreateScoreRequest(req);

  const score = await createScore(userId, value);

  res.status(201).json({
    id: toJsonNumber(score.id),
    user_id: score.user_id,
    value: score.value,
    created_at: toIsoString(score.created_at),
  });
}

export { createScoreController };
