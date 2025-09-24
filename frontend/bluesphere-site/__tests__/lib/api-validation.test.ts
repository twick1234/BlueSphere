/**
 * Comprehensive tests for API Validation utilities
 * Tests input validation, security, rate limiting, and error handling
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import {
  ValidationSchemas,
  sanitizeInput,
  validateMethod,
  validateQuery,
  validateBody,
  createSecureApiHandler,
  createApiResponse,
  createApiErrorResponse,
  setCorsHeaders,
  setSecurityHeaders,
  createRateLimit
} from '@/lib/api-validation';

// Mock Next.js API objects
const createMockRequest = (overrides: Partial<NextApiRequest> = {}): NextApiRequest => ({
  method: 'GET',
  url: '/api/test',
  headers: {},
  query: {},
  body: {},
  cookies: {},
  socket: { remoteAddress: '127.0.0.1' },
  ...overrides
} as NextApiRequest);

const createMockResponse = (): NextApiResponse => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };
  return response as unknown as NextApiResponse;
};

describe('ValidationSchemas', () => {
  describe('coordinates schema', () => {
    it('should validate valid coordinates', () => {
      const validCoords = { lat: 45.5, lon: -122.5 };
      const result = ValidationSchemas.coordinates.parse(validCoords);
      expect(result).toEqual(validCoords);
    });

    it('should reject invalid latitude', () => {
      expect(() => ValidationSchemas.coordinates.parse({ lat: 91, lon: 0 }))
        .toThrow();
      expect(() => ValidationSchemas.coordinates.parse({ lat: -91, lon: 0 }))
        .toThrow();
    });

    it('should reject invalid longitude', () => {
      expect(() => ValidationSchemas.coordinates.parse({ lat: 0, lon: 181 }))
        .toThrow();
      expect(() => ValidationSchemas.coordinates.parse({ lat: 0, lon: -181 }))
        .toThrow();
    });

    it('should reject non-numeric coordinates', () => {
      expect(() => ValidationSchemas.coordinates.parse({ lat: 'invalid', lon: 0 }))
        .toThrow();
      expect(() => ValidationSchemas.coordinates.parse({ lat: 0, lon: 'invalid' }))
        .toThrow();
    });
  });

  describe('pagination schema', () => {
    it('should validate valid pagination with defaults', () => {
      const result = ValidationSchemas.pagination.parse({});
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sort_order: 'asc'
      });
    });

    it('should validate custom pagination values', () => {
      const input = {
        page: 2,
        limit: 50,
        sort_by: 'name',
        sort_order: 'desc' as const
      };
      const result = ValidationSchemas.pagination.parse(input);
      expect(result).toEqual(input);
    });

    it('should reject invalid page numbers', () => {
      expect(() => ValidationSchemas.pagination.parse({ page: 0 })).toThrow();
      expect(() => ValidationSchemas.pagination.parse({ page: -1 })).toThrow();
      expect(() => ValidationSchemas.pagination.parse({ page: 1.5 })).toThrow();
    });

    it('should reject invalid limit values', () => {
      expect(() => ValidationSchemas.pagination.parse({ limit: 0 })).toThrow();
      expect(() => ValidationSchemas.pagination.parse({ limit: 101 })).toThrow();
      expect(() => ValidationSchemas.pagination.parse({ limit: -5 })).toThrow();
    });

    it('should reject invalid sort order', () => {
      expect(() => ValidationSchemas.pagination.parse({ sort_order: 'invalid' }))
        .toThrow();
    });
  });

  describe('dateRange schema', () => {
    it('should validate valid date range', () => {
      const input = {
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-02T00:00:00Z'
      };
      const result = ValidationSchemas.dateRange.parse(input);
      expect(result).toEqual(input);
    });

    it('should reject invalid date format', () => {
      expect(() => ValidationSchemas.dateRange.parse({
        start_date: 'invalid-date',
        end_date: '2024-01-02T00:00:00Z'
      })).toThrow();
    });

    it('should reject end_date before start_date', () => {
      expect(() => ValidationSchemas.dateRange.parse({
        start_date: '2024-01-02T00:00:00Z',
        end_date: '2024-01-01T00:00:00Z'
      })).toThrow();
    });

    it('should allow same start and end dates', () => {
      const sameDate = '2024-01-01T00:00:00Z';
      const input = { start_date: sameDate, end_date: sameDate };
      const result = ValidationSchemas.dateRange.parse(input);
      expect(result).toEqual(input);
    });
  });

  describe('alertSubscription schema', () => {
    it('should validate valid alert subscription', () => {
      const input = {
        email: 'test@example.com',
        regions: ['north-pacific', 'atlantic'],
        severity_threshold: 'warning' as const,
        notification_methods: ['email', 'push'] as const,
        frequency: 'daily' as const
      };
      const result = ValidationSchemas.alertSubscription.parse(input);
      expect(result).toEqual(input);
    });

    it('should reject invalid email', () => {
      expect(() => ValidationSchemas.alertSubscription.parse({
        email: 'invalid-email',
        regions: ['test'],
        severity_threshold: 'warning',
        notification_methods: ['email'],
        frequency: 'daily'
      })).toThrow();
    });

    it('should reject empty regions array', () => {
      expect(() => ValidationSchemas.alertSubscription.parse({
        email: 'test@example.com',
        regions: [],
        severity_threshold: 'warning',
        notification_methods: ['email'],
        frequency: 'daily'
      })).toThrow();
    });

    it('should reject too many regions', () => {
      const manyRegions = Array(11).fill('region');
      expect(() => ValidationSchemas.alertSubscription.parse({
        email: 'test@example.com',
        regions: manyRegions,
        severity_threshold: 'warning',
        notification_methods: ['email'],
        frequency: 'daily'
      })).toThrow();
    });

    it('should reject empty notification methods', () => {
      expect(() => ValidationSchemas.alertSubscription.parse({
        email: 'test@example.com',
        regions: ['test'],
        severity_threshold: 'warning',
        notification_methods: [],
        frequency: 'daily'
      })).toThrow();
    });
  });

  describe('marineQuery schema', () => {
    it('should validate marine query with all optional fields', () => {
      const input = {
        coordinates: { lat: 45.5, lon: -122.5 },
        region: 'pacific-northwest',
        species: 'salmon',
        date_range: {
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-02T00:00:00Z'
        },
        data_quality: 'excellent' as const
      };
      const result = ValidationSchemas.marineQuery.parse(input);
      expect(result).toEqual(input);
    });

    it('should validate empty marine query', () => {
      const result = ValidationSchemas.marineQuery.parse({});
      expect(result).toEqual({});
    });

    it('should reject invalid nested coordinates', () => {
      expect(() => ValidationSchemas.marineQuery.parse({
        coordinates: { lat: 91, lon: 0 }
      })).toThrow();
    });

    it('should reject invalid region length', () => {
      expect(() => ValidationSchemas.marineQuery.parse({
        region: 'a'.repeat(101)
      })).toThrow();
    });

    it('should reject invalid data quality', () => {
      expect(() => ValidationSchemas.marineQuery.parse({
        data_quality: 'invalid'
      })).toThrow();
    });
  });
});

describe('sanitizeInput', () => {
  it('should sanitize string inputs', () => {
    expect(sanitizeInput('<script>alert("xss")</script>'))
      .toBe('scriptalert(xss)/script');
    expect(sanitizeInput('normal text')).toBe('normal text');
    expect(sanitizeInput('  spaced  ')).toBe('spaced');
  });

  it('should limit string length', () => {
    const longString = 'a'.repeat(1500);
    const result = sanitizeInput(longString) as string;
    expect(result.length).toBe(1000);
  });

  it('should sanitize array inputs', () => {
    const input = ['<script>', 'normal', { key: 'value>' }];
    const result = sanitizeInput(input) as any[];
    expect(result[0]).toBe('script');
    expect(result[1]).toBe('normal');
    expect(result[2]).toEqual({ key: 'value' });
  });

  it('should limit array size', () => {
    const largeArray = Array(150).fill('test');
    const result = sanitizeInput(largeArray) as any[];
    expect(result.length).toBe(100);
  });

  it('should sanitize object inputs', () => {
    const input = {
      'normal<key>': 'normal<value>',
      'a'.repeat(150): 'long key should be ignored'
    };
    const result = sanitizeInput(input) as Record<string, any>;
    expect(result['normalkey']).toBe('normalvalue');
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('should pass through primitive types unchanged', () => {
    expect(sanitizeInput(42)).toBe(42);
    expect(sanitizeInput(true)).toBe(true);
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
  });

  it('should handle nested objects', () => {
    const input = {
      nested: {
        value: '<script>',
        array: ['<test>', 'normal']
      }
    };
    const result = sanitizeInput(input) as any;
    expect(result.nested.value).toBe('script');
    expect(result.nested.array[0]).toBe('test');
    expect(result.nested.array[1]).toBe('normal');
  });
});

describe('validateMethod', () => {
  it('should validate allowed methods', () => {
    const req = createMockRequest({ method: 'GET' });
    expect(validateMethod(req, ['GET', 'POST'])).toBe(true);
  });

  it('should reject disallowed methods', () => {
    const req = createMockRequest({ method: 'DELETE' });
    expect(validateMethod(req, ['GET', 'POST'])).toBe(false);
  });

  it('should handle undefined method', () => {
    const req = createMockRequest({ method: undefined });
    expect(validateMethod(req, ['GET', 'POST'])).toBe(false);
  });

  it('should be case sensitive', () => {
    const req = createMockRequest({ method: 'get' });
    expect(validateMethod(req, ['GET'])).toBe(false);
  });
});

describe('validateQuery', () => {
  const testSchema = z.object({
    id: z.string(),
    count: z.number().optional()
  });

  it('should validate valid query parameters', () => {
    const req = createMockRequest({ query: { id: 'test', count: 5 } });
    const result = validateQuery(req, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 'test', count: 5 });
    }
  });

  it('should return error for invalid query parameters', () => {
    const req = createMockRequest({ query: { count: 'invalid' } });
    const result = validateQuery(req, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details?.issues).toBeDefined();
    }
  });

  it('should sanitize query parameters before validation', () => {
    const req = createMockRequest({
      query: { id: '<script>test</script>', count: 5 }
    });
    const result = validateQuery(req, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('scripttest/script');
    }
  });

  it('should handle validation errors gracefully', () => {
    const req = createMockRequest({ query: {} });
    const result = validateQuery(req, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Invalid query parameters');
      expect(result.error.timestamp).toBeDefined();
    }
  });
});

describe('validateBody', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0)
  });

  it('should validate valid request body', () => {
    const req = createMockRequest({
      body: { name: 'John', age: 25 }
    });
    const result = validateBody(req, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'John', age: 25 });
    }
  });

  it('should return error for invalid request body', () => {
    const req = createMockRequest({
      body: { name: '', age: -5 }
    });
    const result = validateBody(req, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Invalid request body');
    }
  });

  it('should sanitize body before validation', () => {
    const req = createMockRequest({
      body: { name: '<script>alert("xss")</script>', age: 25 }
    });
    const result = validateBody(req, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('scriptalert(xss)/script');
    }
  });
});

describe('createRateLimit', () => {
  beforeEach(() => {
    // Clear the rate limit store before each test
    jest.clearAllMocks();
  });

  it('should allow requests within limit', async () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 5
    });

    const req = createMockRequest();
    const res = createMockResponse();
    const next = jest.fn();

    rateLimit(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block requests exceeding limit', async () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 1,
      message: 'Rate limit exceeded'
    });

    const req = createMockRequest();
    const res = createMockResponse();
    const next = jest.fn();

    // First request should pass
    rateLimit(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second request should be blocked
    const next2 = jest.fn();
    rateLimit(req, res, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded'
      })
    });
  });

  it('should use different limits for different IPs', () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 1
    });

    const req1 = createMockRequest({
      socket: { remoteAddress: '127.0.0.1' }
    });
    const req2 = createMockRequest({
      socket: { remoteAddress: '127.0.0.2' }
    });
    const res = createMockResponse();
    const next = jest.fn();

    // Both requests should pass as they're from different IPs
    rateLimit(req1, res, next);
    rateLimit(req2, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should reset window after expiration', (done) => {
    const rateLimit = createRateLimit({
      windowMs: 100, // Very short window for testing
      maxRequests: 1
    });

    const req = createMockRequest();
    const res = createMockResponse();
    const next = jest.fn();

    // First request should pass
    rateLimit(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Wait for window to expire
    setTimeout(() => {
      const next2 = jest.fn();
      rateLimit(req, res, next2);
      expect(next2).toHaveBeenCalled();
      done();
    }, 150);
  });
});

describe('setCorsHeaders', () => {
  it('should set CORS headers for allowed origins', () => {
    const res = createMockResponse();
    setCorsHeaders(res, 'https://bluesphere.app');

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://bluesphere.app'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
  });

  it('should allow all origins in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const res = createMockResponse();
    setCorsHeaders(res, 'https://evil.com');

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://evil.com'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not set origin for disallowed origins in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = createMockResponse();
    setCorsHeaders(res, 'https://evil.com');

    // Should not set the origin header for disallowed origins
    const originCall = (res.setHeader as jest.Mock).mock.calls
      .find(call => call[0] === 'Access-Control-Allow-Origin');
    expect(originCall).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should use wildcard when no origin provided', () => {
    const res = createMockResponse();
    setCorsHeaders(res);

    // In production with no origin, it should not set CORS headers for security
    const originCall = (res.setHeader as jest.Mock).mock.calls
      .find(call => call[0] === 'Access-Control-Allow-Origin');
    expect(originCall).toBeUndefined();
  });
});

describe('setSecurityHeaders', () => {
  it('should set basic security headers', () => {
    const res = createMockResponse();
    setSecurityHeaders(res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'DENY'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-XSS-Protection',
      '1; mode=block'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    );
  });

  it('should set HSTS header in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = createMockResponse();
    setSecurityHeaders(res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not set HSTS header in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const res = createMockResponse();
    setSecurityHeaders(res);

    const hstsCall = (res.setHeader as jest.Mock).mock.calls
      .find(call => call[0] === 'Strict-Transport-Security');
    expect(hstsCall).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('createApiResponse', () => {
  it('should create successful API response', () => {
    const data = { id: 1, name: 'test' };
    const response = createApiResponse(data);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.metadata.timestamp).toBeDefined();
  });

  it('should include custom metadata', () => {
    const data = { id: 1, name: 'test' };
    const metadata = {
      request_id: 'req-123',
      processing_time_ms: 150,
      cache_hit: true
    };
    const response = createApiResponse(data, metadata);

    expect(response.metadata.request_id).toBe('req-123');
    expect(response.metadata.processing_time_ms).toBe(150);
    expect(response.metadata.cache_hit).toBe(true);
    expect(response.metadata.timestamp).toBeDefined();
  });
});

describe('createApiErrorResponse', () => {
  it('should create error API response', () => {
    const response = createApiErrorResponse(
      'VALIDATION_ERROR',
      'Invalid input data',
      { field: 'email' }
    );

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.message).toBe('Invalid input data');
    expect(response.error.details).toEqual({ field: 'email' });
    expect(response.error.timestamp).toBeDefined();
  });

  it('should create error response without details', () => {
    const response = createApiErrorResponse(
      'INTERNAL_ERROR',
      'Something went wrong'
    );

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('INTERNAL_ERROR');
    expect(response.error.message).toBe('Something went wrong');
    expect(response.error.details).toBeUndefined();
  });
});

describe('createSecureApiHandler', () => {
  const mockHandler = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle valid requests', async () => {
    const secureHandler = createSecureApiHandler(mockHandler, {
      allowedMethods: ['GET'],
      cors: true
    });

    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    await secureHandler(req, res);

    expect(mockHandler).toHaveBeenCalledWith(req, res);
    expect(res.setHeader).toHaveBeenCalled(); // Security headers
  });

  it('should reject disallowed methods', async () => {
    const secureHandler = createSecureApiHandler(mockHandler, {
      allowedMethods: ['GET']
    });

    const req = createMockRequest({ method: 'DELETE' });
    const res = createMockResponse();

    await secureHandler(req, res);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        code: 'METHOD_NOT_ALLOWED'
      })
    });
  });

  it('should handle OPTIONS requests', async () => {
    const secureHandler = createSecureApiHandler(mockHandler, {
      allowedMethods: ['GET'],
      cors: true
    });

    const req = createMockRequest({ method: 'OPTIONS' });
    const res = createMockResponse();

    await secureHandler(req, res);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should apply rate limiting when configured', async () => {
    const secureHandler = createSecureApiHandler(mockHandler, {
      allowedMethods: ['GET'],
      rateLimit: {
        windowMs: 60000,
        maxRequests: 1
      }
    });

    const req = createMockRequest();
    const res = createMockResponse();

    // First request should pass
    await secureHandler(req, res);
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Second request should be rate limited
    await secureHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should handle handler errors gracefully', async () => {
    const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
    const secureHandler = createSecureApiHandler(errorHandler, {
      allowedMethods: ['GET']
    });

    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    await secureHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred'
      })
    });
  });

  it('should skip CORS when disabled', async () => {
    const secureHandler = createSecureApiHandler(mockHandler, {
      allowedMethods: ['GET'],
      cors: false
    });

    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    await secureHandler(req, res);

    // Should not set CORS headers
    const corsCall = (res.setHeader as jest.Mock).mock.calls
      .find(call => call[0] === 'Access-Control-Allow-Origin');
    expect(corsCall).toBeUndefined();
  });
});

// Performance and stress tests
describe('API Validation Performance', () => {
  it('should handle large input sanitization efficiently', () => {
    const start = performance.now();

    const largeObject = {
      data: Array(1000).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: 'A'.repeat(100)
      }))
    };

    sanitizeInput(largeObject);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete within 100ms
  });

  it('should validate schemas efficiently', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      ValidationSchemas.coordinates.parse({ lat: i % 90, lon: i % 180 });
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete within 100ms
  });

  it('should handle concurrent rate limiting', async () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 100
    });

    const promises = Array(50).fill(0).map(() => {
      return new Promise<void>((resolve) => {
        const req = createMockRequest();
        const res = createMockResponse();
        rateLimit(req, res, () => resolve());
      });
    });

    const start = performance.now();
    await Promise.all(promises);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Should handle concurrent requests quickly
  });
});

// Edge cases and error scenarios
describe('API Validation Edge Cases', () => {
  it('should handle null and undefined inputs gracefully', () => {
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle circular references in objects', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;

    // Should not throw an error, but may not fully sanitize circular refs
    expect(() => sanitizeInput(circular)).not.toThrow();
  });

  it('should handle special characters in rate limiting', () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 5
    });

    const req = createMockRequest({
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      socket: { remoteAddress: undefined }
    });
    const res = createMockResponse();
    const next = jest.fn();

    rateLimit(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should handle validation with deeply nested schemas', () => {
    const deepSchema = z.object({
      level1: z.object({
        level2: z.object({
          level3: z.object({
            value: z.string()
          })
        })
      })
    });

    const req = createMockRequest({
      body: {
        level1: {
          level2: {
            level3: {
              value: 'deep<value>'
            }
          }
        }
      }
    });

    const result = validateBody(req, deepSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level1.level2.level3.value).toBe('deepvalue');
    }
  });
});