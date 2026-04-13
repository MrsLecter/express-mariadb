import type { Request, Response } from "express";
import { getLeaderboard } from "../services/leaderboardService";
import { toIsoString, toJsonNumber } from "../utils/serialization";

async function getLeaderboardController(_req: Request, res: Response) {
  const leaderboard = await getLeaderboard();

  res.json(
    leaderboard.map((entry) => ({
      rank: toJsonNumber(entry.rank),
      username: entry.username,
      total_score: toJsonNumber(entry.total_score),
      average_score: entry.average_score,
      last_activity: toIsoString(entry.last_activity),
    }))
  );
}

export { getLeaderboardController };
