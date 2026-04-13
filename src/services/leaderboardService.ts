import { getConnection } from "../db";
import { NotFoundError } from "../errors";
import {
  getLeaderboard as getLeaderboardEntries,
  getRankByTotalScore,
  getUserScoreStatsByUserId,
} from "../repositories/leaderboardRepository";

async function getLeaderboard() {
  return getLeaderboardEntries();
}

async function getUserRank(userId: number) {
  const connection = await getConnection();

  try {
    await connection.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await connection.beginTransaction();

    const user = await getUserScoreStatsByUserId(userId, connection);

    if (!user) {
      throw new NotFoundError("user rank not found", "USER_RANK_NOT_FOUND", {
        userId,
      });
    }

    const rank = await getRankByTotalScore(user.total_score, connection);

    await connection.commit();

    return {
      rank,
      ...user,
    };
  } catch (error) {
    try {
      if (connection.isValid()) {
        await connection.rollback();
      }
    } catch {
      // Ignore rollback failures in read-only flow; the original error is more useful.
    }

    throw error;
  } finally {
    connection.release();
  }
}

export { getLeaderboard, getUserRank };
