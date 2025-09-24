/**
 * Comprehensive tests for Error Handling system
 * Tests error factory, logging, enhancement, and user-friendly error management
 */

import {
  ErrorFactory,
  ErrorLogger,
  EnhancedError,
  ErrorSeverity,
  ErrorCategory,
  withErrorHandling,
  handleApiError,
  isEnhancedError,
  useErrorHandler
} from '@/lib/error-handling';

// Mock console methods to avoid noise in tests
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  group: console.group,
  groupEnd: console.groupEnd
};

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.group = originalConsole.group;
  console.groupEnd = originalConsole.groupEnd;
});

beforeEach(() => {
  // Clear error logs before each test
  ErrorLogger.clearLogs();
  jest.clearAllMocks();
});

describe('ErrorFactory', () => {
  describe('createNetworkError', () => {
    it('should create network error with default properties', () => {
      const error = ErrorFactory.createNetworkError('Connection failed');

      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe('network');
      expect(error.severity).toBe('medium');
      expect(error.user_friendly_message).toBe('Unable to connect to our servers. Please check your internet connection.');
      expect(error.recovery_suggestions).toContain('Check your internet connection');
      expect(error.should_report).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create network error with custom code and context', () => {
      const context = { url: 'https://api.example.com', timeout: 5000 };
      const error = ErrorFactory.createNetworkError(
        'Timeout occurred',
        'NETWORK_TIMEOUT',
        context
      );

      expect(error.code).toBe('NETWORK_TIMEOUT');
      expect(error.context).toEqual(context);
      expect(error.category).toBe('network');
    });

    it('should be instanceof Error', () => {
      const error = ErrorFactory.createNetworkError('Test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with field-specific message', () => {
      const error = ErrorFactory.createValidationError(
        'email',
        'Invalid email format',
        { value: 'not-an-email' }
      );

      expect(error.message).toBe('Validation failed for email: Invalid email format');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe('validation');
      expect(error.severity).toBe('low');
      expect(error.user_friendly_message).toBe('Invalid email format');
      expect(error.recovery_suggestions).toContain('Please check the highlighted fields and try again');
      expect(error.should_report).toBe(false);
      expect(error.context).toEqual({ value: 'not-an-email' });
    });

    it('should handle special characters in field names', () => {
      const error = ErrorFactory.createValidationError(
        'user.profile.age',
        'Age must be positive'
      );

      expect(error.message).toBe('Validation failed for user.profile.age: Age must be positive');
    });
  });

  describe('createAuthenticationError', () => {
    it('should create authentication error with default message', () => {
      const error = ErrorFactory.createAuthenticationError();

      expect(error.message).toBe('Authentication required');
      expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(error.category).toBe('authentication');
      expect(error.severity).toBe('medium');
      expect(error.user_friendly_message).toBe('Please sign in to access this feature.');
      expect(error.recovery_suggestions).toContain('Sign in to your account');
      expect(error.should_report).toBe(false);
    });

    it('should create authentication error with custom message', () => {
      const error = ErrorFactory.createAuthenticationError(
        'Token expired',
        { token: 'expired-token' }
      );

      expect(error.message).toBe('Token expired');
      expect(error.context).toEqual({ token: 'expired-token' });
    });
  });

  describe('createDataProcessingError', () => {
    it('should create data processing error', () => {
      const error = ErrorFactory.createDataProcessingError(
        'Failed to parse marine data',
        { source: 'NDBC', stationId: '41001' }
      );

      expect(error.message).toBe('Failed to parse marine data');
      expect(error.code).toBe('DATA_PROCESSING_ERROR');
      expect(error.category).toBe('data_processing');
      expect(error.severity).toBe('high');
      expect(error.user_friendly_message).toBe('There was a problem processing the marine data.');
      expect(error.recovery_suggestions).toContain('Try refreshing the data');
      expect(error.should_report).toBe(true);
      expect(error.context).toEqual({ source: 'NDBC', stationId: '41001' });
    });
  });
});

describe('ErrorLogger', () => {
  describe('logError', () => {
    it('should log error and return error ID', async () => {
      const error = ErrorFactory.createNetworkError('Test error');
      const errorId = await ErrorLogger.logError(error);

      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(console.group).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Message:', 'Test error');
      expect(console.error).toHaveBeenCalledWith('Code:', 'NETWORK_ERROR');
    });

    it('should not log to console in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = ErrorFactory.createNetworkError('Test error');
      await ErrorLogger.logError(error);

      expect(console.group).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should store error in logs', async () => {
      const error = ErrorFactory.createNetworkError('Test error');
      await ErrorLogger.logError(error);

      const logs = ErrorLogger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].error).toBe(error);
      expect(logs[0].reported).toBe(false);
    });

    it('should report critical errors automatically', async () => {
      const error = ErrorFactory.createDataProcessingError('Critical failure');
      // Override severity to critical for this test
      Object.defineProperty(error, 'severity', { value: 'critical' });

      await ErrorLogger.logError(error);

      const logs = ErrorLogger.getRecentLogs(1);
      expect(logs[0].reported).toBe(true);
      expect(console.log).toHaveBeenCalledWith('📡 Error reported:', expect.any(Object));
    });

    it('should limit log entries to maximum', async () => {
      const maxEntries = 100;

      // Create more errors than the maximum
      for (let i = 0; i < maxEntries + 10; i++) {
        const error = ErrorFactory.createNetworkError(`Error ${i}`);
        await ErrorLogger.logError(error);
      }

      const logs = ErrorLogger.getRecentLogs(maxEntries + 20);
      expect(logs.length).toBeLessThanOrEqual(maxEntries);
    });

    it('should generate unique error IDs', async () => {
      const error1 = ErrorFactory.createNetworkError('Error 1');
      const error2 = ErrorFactory.createNetworkError('Error 2');

      const id1 = await ErrorLogger.logError(error1);
      const id2 = await ErrorLogger.logError(error2);

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^err_\d+_[a-z0-9]+$/);
    });
  });

  describe('getRecentLogs', () => {
    it('should return recent logs with default limit', async () => {
      for (let i = 0; i < 15; i++) {
        const error = ErrorFactory.createNetworkError(`Error ${i}`);
        await ErrorLogger.logError(error);
      }

      const logs = ErrorLogger.getRecentLogs();
      expect(logs).toHaveLength(10); // Default limit
    });

    it('should return logs with custom limit', async () => {
      for (let i = 0; i < 20; i++) {
        const error = ErrorFactory.createNetworkError(`Error ${i}`);
        await ErrorLogger.logError(error);
      }

      const logs = ErrorLogger.getRecentLogs(5);
      expect(logs).toHaveLength(5);
    });

    it('should return empty array when no logs exist', () => {
      const logs = ErrorLogger.getRecentLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', async () => {
      const error = ErrorFactory.createNetworkError('Test error');
      await ErrorLogger.logError(error);

      expect(ErrorLogger.getRecentLogs()).toHaveLength(1);

      ErrorLogger.clearLogs();
      expect(ErrorLogger.getRecentLogs()).toHaveLength(0);
    });
  });
});

describe('withErrorHandling', () => {
  it('should return success for successful operations', async () => {
    const operation = jest.fn().mockResolvedValue('success data');
    const result = await withErrorHandling(operation);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('success data');
    }
    expect(operation).toHaveBeenCalled();
  });

  it('should handle regular errors', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Regular error'));
    const result = await withErrorHandling(operation, { context: 'test' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Regular error');
      expect(result.error.category).toBe('data_processing');
      expect(result.error.context).toEqual({
        context: 'test',
        originalError: 'Error'
      });
    }
  });

  it('should handle enhanced errors', async () => {
    const enhancedError = ErrorFactory.createValidationError('field', 'Invalid');
    const operation = jest.fn().mockRejectedValue(enhancedError);
    const result = await withErrorHandling(operation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(enhancedError);
      expect(result.error.category).toBe('validation');
    }
  });

  it('should handle non-Error objects', async () => {
    const operation = jest.fn().mockRejectedValue('string error');
    const result = await withErrorHandling(operation);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('string error');
      expect(result.error.context.originalError).toBe('string');
    }
  });

  it('should log errors automatically', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Test error'));
    await withErrorHandling(operation);

    const logs = ErrorLogger.getRecentLogs(1);
    expect(logs).toHaveLength(1);
    expect(logs[0].error.message).toBe('Test error');
  });

  it('should include error context', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Test error'));
    const context = { userId: '123', action: 'update' };
    const result = await withErrorHandling(operation, context);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.context).toEqual({
        ...context,
        originalError: 'Error'
      });
    }
  });
});

describe('handleApiError', () => {
  const createMockResponse = (status: number, url: string = 'https://api.example.com') => ({
    status,
    url
  } as Response);

  it('should handle 400 Bad Request', () => {
    const response = createMockResponse(400);
    const error = handleApiError(response);

    expect(error.category).toBe('client_error');
    expect(error.severity).toBe('low');
    expect(error.user_friendly_message).toBe('The request was invalid. Please check your input.');
    expect(error.recovery_suggestions).toContain('Check the form data and try again');
    expect(error.code).toBe('HTTP_400');
  });

  it('should handle 401 Unauthorized', () => {
    const response = createMockResponse(401);
    const error = handleApiError(response);

    expect(error.category).toBe('authentication');
    expect(error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(error.user_friendly_message).toBe('Please sign in to access this feature.');
  });

  it('should handle 403 Forbidden', () => {
    const response = createMockResponse(403);
    const error = handleApiError(response);

    expect(error.category).toBe('authorization');
    expect(error.user_friendly_message).toBe('You don\'t have permission to access this resource.');
    expect(error.recovery_suggestions).toContain('Contact an administrator for access');
  });

  it('should handle 404 Not Found', () => {
    const response = createMockResponse(404);
    const error = handleApiError(response);

    expect(error.category).toBe('not_found');
    expect(error.user_friendly_message).toBe('The requested resource was not found.');
    expect(error.recovery_suggestions).toContain('Check the URL and try again');
  });

  it('should handle 429 Rate Limited', () => {
    const response = createMockResponse(429);
    const error = handleApiError(response);

    expect(error.user_friendly_message).toBe('Too many requests. Please wait before trying again.');
    expect(error.recovery_suggestions).toContain('Wait a few moments and try again');
  });

  it('should handle 500 Server Error', () => {
    const response = createMockResponse(500);
    const error = handleApiError(response);

    expect(error.category).toBe('server_error');
    expect(error.severity).toBe('high');
    expect(error.user_friendly_message).toBe('Our servers are experiencing issues. Please try again later.');
    expect(error.should_report).toBe(true);
  });

  it('should include context and URL', () => {
    const response = createMockResponse(500, 'https://api.bluesphere.app/data');
    const context = { requestId: 'req-123' };
    const error = handleApiError(response, context);

    expect(error.context).toEqual({
      requestId: 'req-123',
      statusCode: 500,
      url: 'https://api.bluesphere.app/data'
    });
  });

  it('should handle unknown status codes', () => {
    const response = createMockResponse(418); // I'm a teapot
    const error = handleApiError(response);

    expect(error.category).toBe('client_error');
    expect(error.severity).toBe('low');
    expect(error.code).toBe('HTTP_418');
  });
});

describe('isEnhancedError', () => {
  it('should identify enhanced errors', () => {
    const enhancedError = ErrorFactory.createNetworkError('Test');
    expect(isEnhancedError(enhancedError)).toBe(true);
  });

  it('should reject regular errors', () => {
    const regularError = new Error('Regular error');
    expect(isEnhancedError(regularError)).toBe(false);
  });

  it('should reject non-error objects', () => {
    expect(isEnhancedError('string')).toBe(false);
    expect(isEnhancedError(123)).toBe(false);
    expect(isEnhancedError(null)).toBe(false);
    expect(isEnhancedError(undefined)).toBe(false);
    expect(isEnhancedError({})).toBe(false);
  });

  it('should reject objects with partial enhanced error properties', () => {
    const partialError = {
      message: 'Error',
      code: 'TEST_ERROR'
      // Missing category, severity, user_friendly_message
    };
    expect(isEnhancedError(partialError)).toBe(false);
  });
});

describe('useErrorHandler', () => {
  it('should handle regular errors', async () => {
    const { handleError } = useErrorHandler();
    const error = new Error('Test error');
    const result = await handleError(error, { context: 'test' });

    expect(result.error.message).toBe('Test error');
    expect(result.errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
    expect(result.error.context).toEqual({ context: 'test' });
  });

  it('should handle enhanced errors', async () => {
    const { handleError } = useErrorHandler();
    const enhancedError = ErrorFactory.createValidationError('field', 'Invalid');
    const result = await handleError(enhancedError);

    expect(result.error).toBe(enhancedError);
    expect(result.errorId).toBeDefined();
  });

  it('should log errors automatically', async () => {
    const { handleError } = useErrorHandler();
    const error = new Error('Test error');
    await handleError(error);

    const logs = ErrorLogger.getRecentLogs(1);
    expect(logs).toHaveLength(1);
    expect(logs[0].error.message).toBe('Test error');
  });
});

// Integration and performance tests
describe('Error Handling Integration', () => {
  it('should handle multiple concurrent error logs', async () => {
    const promises = Array(50).fill(0).map(async (_, i) => {
      const error = ErrorFactory.createNetworkError(`Concurrent error ${i}`);
      return await ErrorLogger.logError(error);
    });

    const errorIds = await Promise.all(promises);

    // All error IDs should be unique
    const uniqueIds = new Set(errorIds);
    expect(uniqueIds.size).toBe(50);

    const logs = ErrorLogger.getRecentLogs(50);
    expect(logs).toHaveLength(50);
  });

  it('should handle error logging performance', async () => {
    const start = performance.now();

    const promises = Array(100).fill(0).map(async (_, i) => {
      const error = ErrorFactory.createNetworkError(`Performance test ${i}`);
      return await ErrorLogger.logError(error);
    });

    await Promise.all(promises);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete within 100ms
  });

  it('should maintain error properties immutability', () => {
    const error = ErrorFactory.createNetworkError('Immutable test');

    // Try to modify properties
    expect(() => {
      (error as any).code = 'MODIFIED';
    }).not.toThrow(); // Properties are not strictly immutable, but well-defined

    expect(() => {
      (error as any).category = 'modified';
    }).not.toThrow();

    // Values should remain unchanged due to defineProperty
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.category).toBe('network');
  });

  it('should handle complex error contexts', async () => {
    const complexContext = {
      request: {
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: { 'Content-Type': 'application/json' }
      },
      response: {
        status: 500,
        timestamp: new Date().toISOString()
      },
      user: {
        id: '12345',
        role: 'researcher'
      },
      marine_data: {
        station_id: '41001',
        parameter: 'temperature',
        quality_flags: [1, 1, 2, 1]
      }
    };

    const error = ErrorFactory.createDataProcessingError(
      'Failed to process marine data',
      complexContext
    );

    expect(error.context).toEqual(complexContext);
    expect(JSON.stringify(error.context)).toBeDefined(); // Should be serializable
  });
});

// Memory and resource management tests
describe('Error Handling Memory Management', () => {
  it('should not leak memory with many error logs', async () => {
    const initialLogs = ErrorLogger.getRecentLogs().length;

    // Create many errors
    for (let i = 0; i < 200; i++) {
      const error = ErrorFactory.createNetworkError(`Memory test ${i}`);
      await ErrorLogger.logError(error);
    }

    const finalLogs = ErrorLogger.getRecentLogs(200);

    // Should not exceed maximum log entries
    expect(finalLogs.length).toBeLessThanOrEqual(100);

    // Clear to free memory
    ErrorLogger.clearLogs();
    expect(ErrorLogger.getRecentLogs()).toHaveLength(0);
  });

  it('should handle large error contexts efficiently', async () => {
    const largeContext = {
      data: Array(1000).fill(0).map((_, i) => ({
        id: i,
        value: `Large data item ${i}`.repeat(10)
      }))
    };

    const start = performance.now();
    const error = ErrorFactory.createDataProcessingError('Large context test', largeContext);
    await ErrorLogger.logError(error);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Should handle large contexts efficiently
    expect(error.context).toEqual(largeContext);
  });
});

// Error severity and categorization tests
describe('Error Severity and Categories', () => {
  const severityTests: Array<{ factory: () => EnhancedError; expectedSeverity: ErrorSeverity }> = [
    { factory: () => ErrorFactory.createValidationError('field', 'Invalid'), expectedSeverity: 'low' },
    { factory: () => ErrorFactory.createNetworkError('Network failed'), expectedSeverity: 'medium' },
    { factory: () => ErrorFactory.createAuthenticationError(), expectedSeverity: 'medium' },
    { factory: () => ErrorFactory.createDataProcessingError('Processing failed'), expectedSeverity: 'high' }
  ];

  severityTests.forEach(({ factory, expectedSeverity }) => {
    it(`should assign correct severity for ${expectedSeverity} errors`, () => {
      const error = factory();
      expect(error.severity).toBe(expectedSeverity);
    });
  });

  const categoryTests: Array<{ factory: () => EnhancedError; expectedCategory: ErrorCategory }> = [
    { factory: () => ErrorFactory.createValidationError('field', 'Invalid'), expectedCategory: 'validation' },
    { factory: () => ErrorFactory.createNetworkError('Network failed'), expectedCategory: 'network' },
    { factory: () => ErrorFactory.createAuthenticationError(), expectedCategory: 'authentication' },
    { factory: () => ErrorFactory.createDataProcessingError('Processing failed'), expectedCategory: 'data_processing' }
  ];

  categoryTests.forEach(({ factory, expectedCategory }) => {
    it(`should assign correct category for ${expectedCategory} errors`, () => {
      const error = factory();
      expect(error.category).toBe(expectedCategory);
    });
  });
});