import "dotenv/config";
import type { Server } from "http";
import { closePool, pingDatabase } from "./db";
import { logProcessError } from "./logger";
import { app } from "./server";

const port = Number(process.env.PORT) || 3000;
const shutdownTimeoutMs = 10_000;

let server: Server | undefined;
let isShuttingDown = false;

function startServer() {
  return new Promise<Server>((resolve, reject) => {
    const httpServer = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(httpServer);
    });

    httpServer.on("error", reject);
  });
}

async function shutdown(signal: string, exitCode: number) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Shutting down after ${signal}`);

  const timeout = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(exitCode);
  }, shutdownTimeoutMs);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await closePool();
  } catch (error) {
    logProcessError("shutdown failed", error);
    exitCode = 1;
  } finally {
    clearTimeout(timeout);
    process.exit(exitCode);
  }
}

async function main() {
  await pingDatabase();
  server = await startServer();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT", 0);
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM", 0);
});

process.on("unhandledRejection", (error) => {
  logProcessError("unhandledRejection", error);
  void shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logProcessError("uncaughtException", error);
  void shutdown("uncaughtException", 1);
});

void main().catch((error) => {
  logProcessError("startup failed", error);
  void shutdown("startup failure", 1);
});
