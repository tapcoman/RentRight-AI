import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import requestIp from 'request-ip';
import type { Request, Response, NextFunction } from 'express';

// Define custom request property to store client IP
declare global {
  namespace Express {
    interface Request {
      clientIp?: string;
    }
  }
}

// IP Detection middleware
export const detectClientIp = (req: Request, res: Response, next: NextFunction) => {
  req.clientIp = requestIp.getClientIp(req) || '0.0.0.0';
  next();
};

// Custom key generator that uses multiple identifiers
const keyGenerator = (req: Request): string => {
  // Get the detected IP address (set by detectClientIp middleware)
  const ip = req.clientIp || requestIp.getClientIp(req) || '0.0.0.0';
  
  // Get user-agent if available (can be spoofed but adds an extra layer)
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Optional: Get a forwarded domain or referer
  const referer = req.headers['referer'] || 'unknown';
  
  // Return a combined key based on IP, user-agent hash, and referer hash
  // Using short hashes to avoid unnecessarily long keys while maintaining uniqueness
  const userAgentHash = Buffer.from(userAgent).toString('base64').substring(0, 10);
  const refererHash = Buffer.from(referer).toString('base64').substring(0, 10);
  
  return `${ip}:${userAgentHash}:${refererHash}`;
};

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10), // Limit each IP to 200 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Don't use older X-RateLimit-* headers
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

// Auth endpoint rate limiter (login/signup)
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour default
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '30', 10), // 30 attempts per hour default
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      retryAfter: Math.ceil(60 * 60)
    });
  }
});

// Document upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour default
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || '10', 10), // 10 uploads per hour default
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many document uploads, please try again later.',
      retryAfter: Math.ceil(60 * 60)
    });
  }
});

// CAPTCHA request rate limiter
export const captchaLimiter = rateLimit({
  windowMs: parseInt(process.env.CAPTCHA_RATE_LIMIT_WINDOW_MS || '300000', 10), // 5 minutes default
  max: parseInt(process.env.CAPTCHA_RATE_LIMIT_MAX_REQUESTS || '20', 10), // 20 captcha requests per 5 minutes default
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many CAPTCHA requests, please try again later.',
      retryAfter: Math.ceil(5 * 60)
    });
  }
});

// Speed limiting middleware for all requests (gradually slows down frequent requests)
export const speedLimiter = slowDown({
  windowMs: parseInt(process.env.SPEED_LIMIT_WINDOW_MS || '300000', 10), // 5 minutes default
  delayAfter: parseInt(process.env.SPEED_LIMIT_DELAY_AFTER || '50', 10), // Allow 50 requests per 5 minutes without delay default
  delayMs: (hits) => hits * 50, // Add 50ms per request above threshold (hit 60 = 500ms delay)
  keyGenerator
});

// Track and block suspicious activity (excessive failed attempts, suspicious patterns)
const suspiciousIPs = new Map<string, { count: number, timestamp: number }>();

export const trackSuspiciousActivity = (req: Request, suspicious: boolean, severity: number = 1) => {
  const ip = req.clientIp || requestIp.getClientIp(req) || '0.0.0.0';
  
  if (suspicious) {
    const record = suspiciousIPs.get(ip) || { count: 0, timestamp: Date.now() };
    record.count += severity;
    record.timestamp = Date.now();
    suspiciousIPs.set(ip, record);
    
    // Log suspicious activity
    console.warn(`Suspicious activity detected from ${ip}: ${req.method} ${req.path}`);
  }
};

// Check if IP is banned
export const isSuspiciousIP = (req: Request): boolean => {
  const ip = req.clientIp || requestIp.getClientIp(req) || '0.0.0.0';
  const record = suspiciousIPs.get(ip);
  
  if (!record) return false;
  
  // If more than 10 suspicious activities in the last hour
  if (record.count > 10 && (Date.now() - record.timestamp) < 3600000) {
    return true;
  }
  
  return false;
};

// Middleware to block suspicious IPs
export const blockSuspiciousIPs = (req: Request, res: Response, next: NextFunction) => {
  if (isSuspiciousIP(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied due to suspicious activity. If you believe this is an error, please contact support.'
    });
  }
  next();
};

// Cleanup function to remove old records
export const cleanupSuspiciousIPs = () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  
  suspiciousIPs.forEach((record, ip) => {
    if (record.timestamp < oneHourAgo) {
      suspiciousIPs.delete(ip);
    }
  });
};

// Set up regular cleanup
setInterval(cleanupSuspiciousIPs, 15 * 60 * 1000); // Clean up every 15 minutes