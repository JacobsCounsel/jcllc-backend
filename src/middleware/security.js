// src/middleware/security.js - Enhanced security middleware
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { log } from '../utils/logger.js';

// Enhanced rate limiting with better configuration
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 10, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      log.warn('Rate limit exceeded', { 
        ip: req.ip, 
        endpoint: req.path,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({ 
        ok: false, 
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Standard rate limiter for intake forms (more restrictive)
export const intakeRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests max (reduced from 20)
  'Too many form submissions. Please wait before trying again.'
);

// API rate limiter
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes  
  50, // 50 requests max
  'API rate limit exceeded. Please try again later.'
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    };
    
    if (res.statusCode >= 400) {
      log.warn('Request failed', logData);
    } else {
      log.info('Request completed', logData);
    }
  });
  
  next();
};

// Input validation middleware
export const validateContentType = (req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json') && !req.is('multipart/form-data')) {
    return res.status(400).json({
      ok: false,
      error: 'Content-Type must be application/json or multipart/form-data'
    });
  }
  next();
};