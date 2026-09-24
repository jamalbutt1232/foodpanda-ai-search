type Level = "info" | "warn" | "error";

/** Minimal structured logger: one line per event, easy to scan in the dev terminal. */
function log(level: Level, event: string, data: Record<string, unknown> = {}): void {
  const line = `[${event}] ${Object.entries(data)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" ")}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => log("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => log("error", event, data),
};
