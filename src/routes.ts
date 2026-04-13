import { Router } from "express";
import { query } from "./db";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
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
