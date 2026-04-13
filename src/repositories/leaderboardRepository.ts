import type { DbConnection } from "../db";
import { query } from "../db";

type LeaderboardEntryRow = {
  rank: bigint | number;
  username: string;
  total_score: bigint | number;
  average_score: number;
  last_activity: Date | string;
};

type UserRankRow = {
  user_id: bigint | number;
  username: string;
  total_score: bigint | number;
  scores_count: number;
  average_score: number;
  last_activity: Date | string;
};

type RankRow = {
  rank: bigint | number;
};

type QueryExecutor = {
  query: <T>(sql: string, params?: unknown[]) => Promise<T>;
};

function resolveExecutor(executor?: QueryExecutor) {
  return executor ?? { query };
}

async function getLeaderboard() {
  return query<LeaderboardEntryRow[]>(
    `
      SELECT
        DENSE_RANK() OVER (ORDER BY uss.total_score DESC) AS rank,
        u.username,
        uss.total_score,
        ROUND(uss.total_score / NULLIF(uss.scores_count, 0), 2) AS average_score,
        uss.last_activity
      FROM user_score_stats uss
      JOIN users u ON u.id = uss.user_id
      ORDER BY uss.total_score DESC, uss.user_id ASC
      LIMIT 100
    `
  );
}

async function getUserScoreStatsByUserId(
  userId: number,
  executor?: QueryExecutor | DbConnection
) {
  const db = resolveExecutor(executor);
  const rows = await db.query<UserRankRow[]>(
    `
      SELECT
        uss.user_id,
        u.username,
        uss.total_score,
        uss.scores_count,
        ROUND(uss.total_score / NULLIF(uss.scores_count, 0), 2) AS average_score,
        uss.last_activity
      FROM user_score_stats uss
      JOIN users u ON u.id = uss.user_id
      WHERE uss.user_id = ?
    `,
    [userId]
  );

  return rows[0] ?? null;
}

async function getRankByTotalScore(
  totalScore: bigint | number,
  executor?: QueryExecutor | DbConnection
) {
  const db = resolveExecutor(executor);
  const rows = await db.query<RankRow[]>(
    `
      SELECT COUNT(DISTINCT total_score) + 1 AS rank
      FROM user_score_stats
      WHERE total_score > ?
    `,
    [totalScore]
  );

  return rows[0]?.rank ?? 1;
}

export { getLeaderboard, getRankByTotalScore, getUserScoreStatsByUserId };
export type { LeaderboardEntryRow, UserRankRow };
