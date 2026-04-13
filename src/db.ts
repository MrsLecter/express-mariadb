import * as mariadb from "mariadb";
import { DatabaseError, ServiceUnavailableError } from "./errors";
import { isMariaDbConnectionError } from "./utils/dbErrors";

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function loadDatabaseConfig(): DatabaseConfig {
  const portValue = readRequiredEnv("DB_PORT");
  const port = Number(portValue);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Environment variable DB_PORT must be a positive integer");
  }

  return {
    host: readRequiredEnv("DB_HOST"),
    port,
    user: readRequiredEnv("DB_USER"),
    password: readRequiredEnv("DB_PASSWORD"),
    database: readRequiredEnv("DB_NAME"),
  };
}

const databaseConfig = loadDatabaseConfig();

const pool = mariadb.createPool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
  connectionLimit: 5,
});

type DbConnection = mariadb.PoolConnection;

async function configureConnection(connection: DbConnection) {
  await connection.query("SET time_zone = '+00:00'");
}

async function getConnection() {
  try {
    const connection = await pool.getConnection();
    await configureConnection(connection);
    return connection;
  } catch (error) {
    if (isMariaDbConnectionError(error)) {
      throw new ServiceUnavailableError("database unavailable", "DATABASE_UNAVAILABLE", {
        cause: error,
      });
    }

    throw new DatabaseError("failed to get database connection", "DATABASE_CONNECTION_ERROR", {
      cause: error,
      isOperational: false,
    });
  }
}

async function query<T>(sql: string, params: unknown[] = []) {
  let connection: DbConnection | undefined;

  try {
    connection = await getConnection();
    return (await connection.query(sql, params)) as T;
  } catch (error) {
    if (error instanceof ServiceUnavailableError || error instanceof DatabaseError) {
      throw error;
    }

    if (isMariaDbConnectionError(error)) {
      throw new ServiceUnavailableError("database unavailable", "DATABASE_UNAVAILABLE", {
        cause: error,
      });
    }

    throw new DatabaseError("database query failed", "DATABASE_QUERY_ERROR", {
      cause: error,
      isOperational: false,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function pingDatabase() {
  const connection = await getConnection();

  try {
    await connection.query("SELECT 1");
  } finally {
    connection.release();
  }
}

async function closePool() {
  await pool.end();
}

export { closePool, getConnection, pingDatabase, pool, query };
export type { DbConnection };
