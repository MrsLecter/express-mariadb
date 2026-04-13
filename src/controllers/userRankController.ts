import type { Request, Response } from "express";
import { ValidationError } from "../errors";
import { getUserRank } from "../services/leaderboardService";
import { parsePositiveInteger } from "../utils/http";
import { toIsoString, toJsonNumber } from "../utils/serialization";

async function getUserRankController(req: Request, res: Response) {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (typeof rawId !== "string") {
    throw new ValidationError("id must be a positive integer", "INVALID_USER_ID");
  }

  const id = parsePositiveInteger(rawId);

  if (id === null) {
    throw new ValidationError("id must be a positive integer", "INVALID_USER_ID");
  }

  const userRank = await getUserRank(id);

  res.json({
    rank: toJsonNumber(userRank.rank),
    user_id: toJsonNumber(userRank.user_id),
    username: userRank.username,
    total_score: toJsonNumber(userRank.total_score),
    average_score: userRank.average_score,
    last_activity: toIsoString(userRank.last_activity),
  });
}

export { getUserRankController };
