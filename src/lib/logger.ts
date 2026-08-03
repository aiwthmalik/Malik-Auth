type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function getTimestamp(): string {
  return new Date().toISOString();
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return '';
  return ' ' + JSON.stringify(meta);
}

function formatDevMessage(level: LogLevel, msg: string, meta?: Record<string, unknown>): string {
  const color = LEVEL_COLORS[level];
  const ts = getTimestamp();
  return `${BOLD}${color}[${ts}] ${level.toUpperCase().padEnd(5)}${RESET} ${msg}${formatMeta(meta)}`;
}

function formatProdMessage(level: LogLevel, msg: string, meta?: Record<string, unknown>): string {
  return JSON.stringify({
    timestamp: getTimestamp(),
    level,
    message: msg,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  });
}

function getMinLevel(): LogLevel {
  const env = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  return env as LogLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[getMinLevel()];
}

function writeLog(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  if (process.env.NODE_ENV === 'production') {
    const line = formatProdMessage(level, msg, meta);
    if (level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  } else {
    const line = formatDevMessage(level, msg, meta);
    if (level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }
}

function logRequest(method: string, url: string, status: number, duration: number): void {
  const meta = { method, url, status, duration: `${duration}ms` };
  if (status >= 500) {
    writeLog('error', `${method} ${url} ${status}`, meta);
  } else if (status >= 400) {
    writeLog('warn', `${method} ${url} ${status}`, meta);
  } else {
    writeLog('info', `${method} ${url} ${status}`, meta);
  }
}

export const logger = {
  error: (msg: string, meta?: Record<string, unknown>) => writeLog('error', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => writeLog('warn', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => writeLog('info', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => writeLog('debug', msg, meta),
  logRequest,
};
