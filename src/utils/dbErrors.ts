function isMariaDbForeignKeyViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const dbError = error as {
    code?: string;
    errno?: number;
    sqlState?: string;
  };

  return dbError.code === "ER_NO_REFERENCED_ROW_2" && dbError.errno === 1452;
}

function isMariaDbConnectionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const dbError = error as {
    code?: string;
    fatal?: boolean;
    errno?: number;
  };

  return (
    dbError.fatal === true ||
    dbError.code === "ECONNREFUSED" ||
    dbError.code === "PROTOCOL_CONNECTION_LOST" ||
    dbError.code === "ER_GET_CONNECTION_TIMEOUT" ||
    dbError.errno === 45028
  );
}

export { isMariaDbConnectionError, isMariaDbForeignKeyViolation };
