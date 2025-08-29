// src/utils/logger.js - Structured logging system
import { createLogger, format, transports } from 'winston';
import { config } from '../config/environment.js';

const { combine, timestamp, errors, json, colorize, simple } = format;

// Create logger instance
const logger = createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    config.nodeEnv === 'production' ? json() : combine(colorize(), simple())
  ),
  transports: [
    new transports.Console(),
    ...(config.nodeEnv === 'production' 
      ? [new transports.File({ filename: 'error.log', level: 'error' })]
      : []
    )
  ]
});

// Backwards compatible console.log/error wrappers
export const log = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta)
};

// Preserve existing console.log behavior for backwards compatibility
export const console = {
  log: (...args) => logger.info(args.join(' ')),
  error: (...args) => logger.error(args.join(' ')),
  warn: (...args) => logger.warn(args.join(' '))
};

export default logger;