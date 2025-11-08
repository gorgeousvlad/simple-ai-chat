import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Use basic pino without transport to avoid worker thread issues in Next.js
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  ...(isDevelopment && {
    // Pretty print for development
    base: undefined,
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  }),
});
