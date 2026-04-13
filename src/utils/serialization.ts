function toJsonNumber(value: number | bigint) {
  return typeof value === "bigint" ? Number(value) : value;
}

function toIsoString(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const normalizedValue = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return parsedDate.toISOString();
}

export { toIsoString, toJsonNumber };
