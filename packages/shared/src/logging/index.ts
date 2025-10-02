// Lightweight logger compatibility layer used by other packages during typechecking

/* eslint-disable no-console -- this module intentionally uses console for a small,
   synchronous logger used during startup and tests. Keep rule disabled only here. */

// Improvements in this file:
// - Stronger types (use `unknown` instead of `any`)
// - Safe serialization of meta objects (handles Error and circular refs)
// - Do not return console.* results (void) — callers shouldn't rely on return value
// - Keep a default export for backward compatibility

/** Minimal logger interface used across packages */
export interface Logger {
  info: (msg: string, ...meta: unknown[]) => void;
  warn: (msg: string, ...meta: unknown[]) => void;
  error: (msg: string, ...meta: unknown[]) => void;
  debug: (msg: string, ...meta: unknown[]) => void;
}

export type LogLevel = keyof typeof levels;

export interface Transport {
  log: (level: LogLevel, msg: string, meta: unknown[]) => void;
}

function safeStringify(value: unknown): string {
  const seen = new Set<unknown>();
  return JSON.stringify(value, function (_key, val) {
    // Preserve Error shape
    if (val instanceof Error) {
      const err: Record<string, unknown> = { name: val.name, message: val.message };
      if (val.stack) err.stack = val.stack;
      return err;
    }
    // Functions are not serializable
    if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
    // Protect against circular refs
    if (val && typeof val === 'object') {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  });
}

function formatMeta(meta: unknown[]): unknown[] {
  if (!meta || meta.length === 0) return [];
  return meta.map(m => {
    if (m === null || m === undefined) return m;
    const t = typeof m;
    if (t === 'string' || t === 'number' || t === 'boolean') return m;
    try {
      // Prefer JSON for structured data, fall back to String()
      return JSON.parse(safeStringify(m));
    } catch {
      // If parsing fails, return a stringified fallback
      try {
        return safeStringify(m);
      } catch {
        return String(m);
      }
    }
  });
}

/**
 * Simple console-backed logger. Keep implementation intentionally small and
 * synchronous so it can be used during early startup and in tests.
 */
// Log levels (lower is higher priority)
const levels: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };

let currentLevel = (() => {
  const env = (process && process.env && process.env.LOG_LEVEL) || 'debug';
  return levels[env] ?? levels.debug;
})();

export function setLogLevel(level: keyof typeof levels | string) {
  if (typeof level === 'string' && level in levels) {
    currentLevel = levels[level as keyof typeof levels];
  } else if (typeof level === 'string') {
    const parsed = level.toLowerCase();
    if (parsed in levels) currentLevel = levels[parsed];
  }
}

export function getLogLevel(): string {
  const entry = Object.entries(levels).find(([, v]) => v === currentLevel);
  return (entry && entry[0]) || 'info';
}

export const logger: Logger = {
  info: (msg: string, ...meta: unknown[]) => {
    if (currentLevel < levels.info) return;
    const formatted = formatMeta(meta);

    console.info(msg, ...(formatted as any));
  },
  warn: (msg: string, ...meta: unknown[]) => {
    if (currentLevel < levels.warn) return;
    const formatted = formatMeta(meta);
    console.warn(msg, ...(formatted as any));
  },
  error: (msg: string, ...meta: unknown[]) => {
    if (currentLevel < levels.error) return;
    const formatted = formatMeta(meta);
    console.error(msg, ...(formatted as any));
  },
  debug: (msg: string, ...meta: unknown[]) => {
    if (currentLevel < levels.debug) return;
    const formatted = formatMeta(meta);
    // Some environments don't implement console.debug; fallback to log

    if (typeof console.debug === 'function') {
      console.debug(msg, ...(formatted as any));
    } else {
      console.log(msg, ...(formatted as any));
    }
  },
};

// Transport support: optional adapter that receives structured logs.
let currentTransport: Transport | null = null;

export function setTransport(t: Transport | null) {
  currentTransport = t;
}

export function clearTransport() {
  currentTransport = null;
}

// Wrap console-backed logger to route to transport when configured
const origLogger = logger;
export const routedLogger: Logger = {
  info: (msg, ...meta) => {
    if (currentTransport) return currentTransport.log('info', msg, formatMeta(meta));
    return origLogger.info(msg, ...meta);
  },
  warn: (msg, ...meta) => {
    if (currentTransport) return currentTransport.log('warn', msg, formatMeta(meta));
    return origLogger.warn(msg, ...meta);
  },
  error: (msg, ...meta) => {
    if (currentTransport) return currentTransport.log('error', msg, formatMeta(meta));
    return origLogger.error(msg, ...meta);
  },
  debug: (msg, ...meta) => {
    if (currentTransport) return currentTransport.log('debug', msg, formatMeta(meta));
    return origLogger.debug(msg, ...meta);
  },
};

// Keep default export and named `logger` for compatibility; export routedLogger as default logger instance
export default routedLogger;

// Also provide an 'apiLogger' quick shim used in some artifacts (route through routedLogger)
export const apiLogger = {
  logStartup: (msg: string, meta?: unknown) => routedLogger.info(msg, meta as unknown),
  logShutdown: (msg: string, meta?: unknown) => routedLogger.info(msg, meta as unknown),
};
