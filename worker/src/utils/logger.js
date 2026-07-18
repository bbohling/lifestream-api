// Simple logger utility for the application
export const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...args);
  },
  debug: (message, ...args) => {
    // Workers have no process.env; debug output goes to observability logs.
    console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...args);
  },
};
