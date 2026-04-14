import type { DbConnection } from "../db";

type InsertScoreResult = {
  insertId: bigint | number;
};

async function insertScore(
  connection: DbConnection,
  userId: number,
  value: number,
  createdAt: Date
) {
  return (await connection.query(
    "INSERT INTO scores (user_id, value, created_at) VALUES (?, ?, ?)",
    [userId, value, createdAt]
  )) as InsertScoreResult;
}

async function upsertUserScoreStats(
  connection: DbConnection,
  userId: number,
  value: number,
  createdAt: Date
) {
  // NOTE: the order in which the accounts are updated is not guaranteed, so we use GREATEST
  await connection.query(
    `
      INSERT INTO user_score_stats (
        user_id,
        total_score,
        scores_count,
        last_activity
      )
      VALUES (?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE
        total_score = total_score + VALUES(total_score),
        scores_count = scores_count + 1,
        last_activity = GREATEST(last_activity, VALUES(last_activity))
    `,
    [userId, value, createdAt]
  );
}

export { insertScore, upsertUserScoreStats };
