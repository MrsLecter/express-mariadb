import { pool, query } from "./db";

const USER_COUNT = 100000;
const SCORE_COUNT = 700000;
const USER_BATCH_SIZE = 5000;
const SCORE_BATCH_SIZE = 10000;
const MAX_SCORE_VALUE = 1000;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS scores (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      value INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_scores_user
        FOREIGN KEY (user_id) REFERENCES users(id),
      INDEX idx_scores_user_id (user_id)
    )
  `);
}

async function seedUsers() {
  for (let start = 1; start <= USER_COUNT; start += USER_BATCH_SIZE) {
    const end = Math.min(start + USER_BATCH_SIZE - 1, USER_COUNT);
    const placeholders: string[] = [];
    const params: string[] = [];

    for (let id = start; id <= end; id += 1) {
      placeholders.push("(?)");
      params.push(`user_${id}`);
    }

    await query(
      `INSERT INTO users (username) VALUES ${placeholders.join(", ")}`,
      params
    );

    console.log(`Inserted users: ${end}/${USER_COUNT}`);
  }
}

async function seedScores() {
  for (let start = 0; start < SCORE_COUNT; start += SCORE_BATCH_SIZE) {
    const batchSize = Math.min(SCORE_BATCH_SIZE, SCORE_COUNT - start);
    const placeholders: string[] = [];
    const params: number[] = [];

    for (let index = 0; index < batchSize; index += 1) {
      placeholders.push("(?, ?)");
      params.push(randomInt(1, USER_COUNT), randomInt(1, MAX_SCORE_VALUE));
    }

    await query(
      `INSERT INTO scores (user_id, value) VALUES ${placeholders.join(", ")}`,
      params
    );

    console.log(
      `Inserted scores: ${Math.min(start + batchSize, SCORE_COUNT)}/${SCORE_COUNT}`
    );
  }
}

async function main() {
  try {
    console.log("Starting seed...");

    await ensureTables();
    console.log("Tables ready");

    await query("DELETE FROM scores");
    await query("DELETE FROM users");
    await query("ALTER TABLE users AUTO_INCREMENT = 1");
    await query("ALTER TABLE scores AUTO_INCREMENT = 1");

    console.log("Tables cleared");

    await seedUsers();
    await seedScores();

    console.log("Seed completed");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
