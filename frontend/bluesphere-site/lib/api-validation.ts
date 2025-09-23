/**
 * API Validation and Security Utilities
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Comprehensive input validation, sanitization, and security measures for API endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { Result, createSuccess, createFailure, ApiError } from '@/types/common';
import { ErrorFactory, handleApiError } from '@/lib/error-handling';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

// Rate limit store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    // Check current client
    const clientData = rateLimitStore.get(clientId);

    if (!clientData || clientData.resetTime < now) {
      // Reset window
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + config.windowMs
      });
      next();
    } else if (clientData.count < config.maxRequests) {
      // Increment count
      clientData.count++;
      next();
    } else {
      // Rate limit exceeded
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Too many requests. Please try again later.',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: NextApiRequest): string {
  // In production, consider using a more sophisticated approach
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  return ip || 'unknown';
}

/**
 * CORS configuration
 */
export function setCorsHeaders(res: NextApiResponse, origin?: string): void {
  const allowedOrigins = [
    'https://bluesphere.app',
    'https://www.bluesphere.app',
    'http://localhost:3000',
    'http://localhost:4000'
  ];

  const requestOrigin = origin || '*';

  if (allowedOrigins.includes(requestOrigin) || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Security headers middleware
 */
export function setSecurityHeaders(res: NextApiResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/**
 * Input validation schemas using Zod
 */
export const ValidationSchemas = {
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180)
  }),

  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).default('asc')
  }),

  dateRange: z.object({
    start_date: z.string().datetime(),
    end_date: z.string().datetime()
  }).refine(data => new Date(data.start_date) <= new Date(data.end_date), {
    message: 'start_date must be before end_date'
  }),

  alertSubscription: z.object({
    email: z.string().email(),
    regions: z.array(z.string()).min(1).max(10),
    severity_threshold: z.enum(['info', 'warning', 'critical', 'emergency']),
    notification_methods: z.array(z.enum(['email', 'sms', 'push'])).min(1),
    frequency: z.enum(['immediate', 'daily', 'weekly'])
  }),

  marineQuery: z.object({
    coordinates: z.lazy(() => ValidationSchemas.coordinates).optional(),
    region: z.string().min(1).max(100).optional(),
    species: z.string().min(1).max(100).optional(),
    date_range: z.lazy(() => ValidationSchemas.dateRange).optional(),
    data_quality: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
  })
};

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return input
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .trim()
      .slice(0, 1000); // Limit length
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput).slice(0, 100); // Limit array size
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof key === 'string' && key.length <= 100) {
        sanitized[sanitizeInput(key) as string] = sanitizeInput(value);
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate request method
 */
export function validateMethod(req: NextApiRequest, allowedMethods: string[]): boolean {
  return allowedMethods.includes(req.method || '');
}

/**
 * Extract and validate query parameters
 */
export function validateQuery<T>(
  req: NextApiRequest,
  schema: z.ZodSchema<T>
): Result<T, ApiError> {
  try {
    const sanitized = sanitizeInput(req.query);
    const result = schema.parse(sanitized);
    return createSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const apiError: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: {
          issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        timestamp: new Date().toISOString()
      };
      return createFailure(apiError);
    }

    const apiError: ApiError = {
      code: 'UNKNOWN_VALIDATION_ERROR',
      message: 'Query validation failed',
      timestamp: new Date().toISOString()
    };
    return createFailure(apiError);
  }
}

/**
 * Extract and validate request body
 */
export function validateBody<T>(
  req: NextApiRequest,
  schema: z.ZodSchema<T>
): Result<T, ApiError> {
  try {
    const sanitized = sanitizeInput(req.body);
    const result = schema.parse(sanitized);
    return createSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const apiError: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: {
          issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        timestamp: new Date().toISOString()
      };
      return createFailure(apiError);
    }

    const apiError: ApiError = {
      code: 'UNKNOWN_VALIDATION_ERROR',
      message: 'Body validation failed',
      timestamp: new Date().toISOString()
    };
    return createFailure(apiError);
  }
}

/**
 * API handler wrapper with comprehensive security and validation
 */
export function createSecureApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: {
    allowedMethods: string[];
    rateLimit?: RateLimitConfig;
    requireAuth?: boolean;
    cors?: boolean;
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Set security headers
      setSecurityHeaders(res);

      // Handle CORS
      if (options.cors !== false) {
        setCorsHeaders(res, req.headers.origin as string);
      }

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      // Validate method
      if (!validateMethod(req, options.allowedMethods)) {
        res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${req.method} not allowed. Allowed methods: ${options.allowedMethods.join(', ')}`,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimiter = createRateLimit(options.rateLimit);
        await new Promise<void>((resolve, reject) => {
          rateLimiter(req, res, () => resolve());
        });
      }

      // TODO: Add authentication check if required
      if (options.requireAuth) {
        // Implementation would depend on authentication strategy
        // For now, we'll skip this as the current system doesn't have auth
      }

      // Call the actual handler
      await handler(req, res);

    } catch (error) {
      console.error('API Handler Error:', error);

      const enhancedError = ErrorFactory.createDataProcessingError(
        error instanceof Error ? error.message : 'Unknown API error',
        {
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent']
        }
      );

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}

/**
 * Standard API response formatter
 */
export function createApiResponse<T>(
  data: T,
  metadata?: {
    request_id?: string;
    processing_time_ms?: number;
    cache_hit?: boolean;
  }
) {
  return {
    success: true as const,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
}

/**
 * Standard API error response formatter
 */
export function createApiErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return {
    success: false as const,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };
}

export default {
  ValidationSchemas,
  sanitizeInput,
  validateMethod,
  validateQuery,
  validateBody,
  createSecureApiHandler,
  createApiResponse,
  createApiErrorResponse,
  setCorsHeaders,
  setSecurityHeaders
};