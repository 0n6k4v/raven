// Lightweight logger wrapper for frontend
const isDev = import.meta.env.DEV;

function safeSend(payload) {
  // No-op placeholder for sending logs to remote endpoint or RUM
  // e.g. fetch('/_logs', { method: 'POST', body: JSON.stringify(payload) })
}

const logger = {
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
    // Optionally send structured info to backend in production
    // safeSend({ level: 'info', args });
  },
  warn: (...args) => {
    console.warn(...args);
    // safeSend({ level: 'warn', args });
  },
  error: (...args) => {
    console.error(...args);
    // In production, consider sending error reports
    // safeSend({ level: 'error', args, timestamp: Date.now() });
  },
};

export default logger;
