import { Router } from "express";
import { pool, query } from "./db";

const router = Router();

function toJsonNumber(value: number | bigint) {
  return typeof value === "bigint" ? Number(value) : value;
}

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get("/leaderboard", async (_req, res) => {
  try {
    const leaderboard = (await query(
      `
        SELECT
          RANK() OVER (ORDER BY uss.total_score DESC, uss.user_id ASC) AS rank,
          u.username,
          uss.total_score,
          ROUND(uss.total_score / NULLIF(uss.scores_count, 0), 2) AS average_score,
          uss.last_activity
        FROM user_score_stats uss
        JOIN users u ON u.id = uss.user_id
        ORDER BY uss.total_score DESC, uss.user_id ASC
        LIMIT 100
      `
    )) as Array<{
      rank: bigint | number;
      username: string;
      total_score: bigint | number;
      average_score: number;
      last_activity: Date | string;
    }>;

    res.json(
      leaderboard.map((entry) => ({
        rank: toJsonNumber(entry.rank),
        username: entry.username,
        total_score: toJsonNumber(entry.total_score),
        average_score: entry.average_score,
        last_activity:
          entry.last_activity instanceof Date
            ? entry.last_activity.toISOString()
            : entry.last_activity,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

router.get("/users/:id/rank", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "id must be a positive integer" });
    return;
  }

  try {
    const users = (await query(
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
      [id]
    )) as Array<{
      user_id: bigint | number;
      username: string;
      total_score: bigint | number;
      scores_count: number;
      average_score: number;
      last_activity: Date | string;
    }>;

    if (users.length === 0) {
      res.status(404).json({ error: "user rank not found" });
      return;
    }

    const user = users[0];

    const ranks = (await query(
      `
        SELECT COUNT(*) + 1 AS rank
        FROM user_score_stats
        WHERE
          total_score > ?
          OR (total_score = ? AND user_id < ?)
      `,
      [user.total_score, user.total_score, Number(user.user_id)]
    )) as Array<{
      rank: bigint | number;
    }>;

    res.json({
      rank: toJsonNumber(ranks[0].rank),
      user_id: toJsonNumber(user.user_id),
      username: user.username,
      total_score: toJsonNumber(user.total_score),
      average_score: user.average_score,
      last_activity:
        user.last_activity instanceof Date
          ? user.last_activity.toISOString()
          : user.last_activity,
    });
  } catch (error) {
    console.error("Failed to fetch user rank:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

router.post("/scores", async (req, res) => {
  const { user_id, value } = req.body as {
    user_id?: unknown;
    value?: unknown;
  };

  if (
    typeof user_id !== "number" ||
    !Number.isInteger(user_id) ||
    user_id <= 0
  ) {
    res.status(400).json({ error: "user_id must be a positive integer" });
    return;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    res.status(400).json({ error: "value must be a number" });
    return;
  }

  try {
    const users = (await query(
      "SELECT id, username FROM users WHERE id = ?",
      [user_id]
    )) as Array<{ id: number; username: string }>;

    if (users.length === 0) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const connection = await pool.getConnection();

    try {
      const createdAt = new Date();

      await connection.beginTransaction();

      const insertResult = (await connection.query(
        "INSERT INTO scores (user_id, value, created_at) VALUES (?, ?, ?)",
        [user_id, value, createdAt]
      )) as { insertId: bigint | number };

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
        [user_id, value, createdAt]
      );

      await connection.commit();

      res.status(201).json({
        id: toJsonNumber(insertResult.insertId),
        user_id,
        value,
        created_at: createdAt.toISOString(),
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Failed to create score:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

export { router };
