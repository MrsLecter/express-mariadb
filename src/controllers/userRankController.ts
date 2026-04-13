import type { Request, Response } from "express";
import { getUserRank } from "../services/leaderboardService";
import { toIsoString, toJsonNumber } from "../utils/serialization";
import { parseUserRankRequest } from "../validators/userRank";

async function getUserRankController(req: Request, res: Response) {
  const { userId } = parseUserRankRequest(req);

  const userRank = await getUserRank(userId);

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
