import * as mariadb from "mariadb";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "root";
const DB_NAME = process.env.DB_NAME || "mydb";

const pool = mariadb.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 5,
});

async function query(sql: string, params: unknown[] = []) {
  let connection: mariadb.PoolConnection | undefined;

  try {
    connection = await pool.getConnection();
    return await connection.query(sql, params);
  } catch (error) {
    console.error("MariaDB connection error:", error);
    throw new Error("MariaDB is not configured correctly");
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export { pool, query };
