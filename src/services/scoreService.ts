import { getConnection } from "../db";
import { NotFoundError } from "../errors";
import { logInternalError } from "../logger";
import { insertScore, upsertUserScoreStats } from "../repositories/scoreRepository";
import { isMariaDbForeignKeyViolation } from "../utils/dbErrors";

async function createScore(userId: number, value: number) {
  const connection = await getConnection();

  try {
    const createdAt = new Date();

    await connection.beginTransaction();

    const insertResult = await insertScore(connection, userId, value, createdAt);
    await upsertUserScoreStats(connection, userId, value, createdAt);

    await connection.commit();

    return {
      id: insertResult.insertId,
      user_id: userId,
      value,
      created_at: createdAt,
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      logInternalError("Failed to rollback score transaction", rollbackError, {
        userId,
        originalError: error,
      });
    }

    if (isMariaDbForeignKeyViolation(error)) {
      throw new NotFoundError("user not found", "USER_NOT_FOUND", {
        userId,
      });
    }

    throw error;
  } finally {
    connection.release();
  }
}

export { createScore };
