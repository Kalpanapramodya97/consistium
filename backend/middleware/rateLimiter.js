const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for authentication endpoints (login / register).
 * Prevents brute-force and credential-stuffing attacks.
 *   – 10 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,
  standardHeaders: true,       // Return RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  skipSuccessfulRequests: false,
});

/**
 * General API limiter for authenticated private routes.
 * Limits abusive scraping / denial-of-service via the API.
 *   – 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP. Please try again in 15 minutes.'
  },
});

/**
 * Admin endpoint limiter — tighter than general API.
 * Admin actions (user deletion, stats) should be low-frequency.
 *   – 30 requests per 15 minutes per IP
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many admin requests from this IP. Please try again in 15 minutes.'
  },
});

module.exports = { authLimiter, apiLimiter, adminLimiter };
