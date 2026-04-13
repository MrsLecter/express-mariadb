import { Router } from "express";
import { query } from "./db";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get("/leaderboard", async (_req, res) => {
  try {
    const leaderboard = (await query(
      `
        SELECT
          RANK() OVER (ORDER BY total_score DESC) AS rank,
          username,
          total_score,
          average_score,
          last_activity
        FROM (
          SELECT
            users.username,
            SUM(scores.value) AS total_score,
            AVG(scores.value) AS average_score,
            MAX(scores.created_at) AS last_activity
          FROM scores
          INNER JOIN users ON users.id = scores.user_id
          GROUP BY scores.user_id, users.username
        ) AS ranked_scores
        ORDER BY total_score DESC
        LIMIT 100
      `
    )) as Array<{
      rank: bigint | number;
      username: string;
      total_score: number;
      average_score: number;
      last_activity: Date | string;
    }>;

    res.json(
      leaderboard.map((entry) => ({
        rank: Number(entry.rank),
        username: entry.username,
        total_score: entry.total_score,
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
    const ranks = (await query(
      `
        SELECT *
        FROM (
          SELECT
            RANK() OVER (ORDER BY SUM(s.value) DESC) AS rank,
            u.id AS user_id,
            u.username,
            SUM(s.value) AS total_score,
            AVG(s.value) AS average_score,
            MAX(s.created_at) AS last_activity
          FROM scores s
          JOIN users u ON u.id = s.user_id
          GROUP BY u.id, u.username
        ) t
        WHERE t.user_id = ?
      `,
      [id]
    )) as Array<{
      rank: bigint | number;
      user_id: bigint | number;
      username: string;
      total_score: number;
      average_score: number;
      last_activity: Date | string;
    }>;

    if (ranks.length === 0) {
      res.status(404).json({ error: "user rank not found" });
      return;
    }

    const rank = ranks[0];

    res.json({
      rank: Number(rank.rank),
      user_id: Number(rank.user_id),
      username: rank.username,
      total_score: rank.total_score,
      average_score: rank.average_score,
      last_activity:
        rank.last_activity instanceof Date
          ? rank.last_activity.toISOString()
          : rank.last_activity,
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

    const insertResult = (await query(
      "INSERT INTO scores (user_id, value) VALUES (?, ?)",
      [user_id, value]
    )) as { insertId: number };

    const scores = (await query(
      "SELECT id, user_id, value, created_at FROM scores WHERE id = ?",
      [insertResult.insertId]
    )) as Array<{
      id: bigint | number;
      user_id: bigint | number;
      value: number;
      created_at: Date | string;
    }>;

    const createdScore = scores[0];

    res.status(201).json({
      id: Number(createdScore.id),
      user_id: Number(createdScore.user_id),
      value: createdScore.value,
      created_at:
        createdScore.created_at instanceof Date
          ? createdScore.created_at.toISOString()
          : createdScore.created_at,
    });
  } catch (error) {
    console.error("Failed to create score:", error);
    res.status(500).json({ error: "internal server error" });
  }
});

export { router };
