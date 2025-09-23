/**
 * Error Handling System
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Centralized error handling, logging, and user-friendly error management
 */

import { ApiError, Result, createSuccess, createFailure } from '@/types/common';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for better classification
export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server_error'
  | 'client_error'
  | 'data_processing'
  | 'external_service'
  | 'unknown';

// Enhanced error interface
export interface EnhancedError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly user_friendly_message: string;
  readonly recovery_suggestions: readonly string[];
  readonly should_report: boolean;
}

// Error factory for creating consistent errors
export class ErrorFactory {
  /**
   * Creates a network-related error
   */
  static createNetworkError(
    message: string,
    code: string = 'NETWORK_ERROR',
    context?: Record<string, unknown>
  ): EnhancedError {
    return this.createError({
      message,
      code,
      category: 'network',
      severity: 'medium',
      context,
      user_friendly_message: 'Unable to connect to our servers. Please check your internet connection.',
      recovery_suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the problem persists'
      ],
      should_report: true
    });
  }

  /**
   * Creates a validation error
   */
  static createValidationError(
    field: string,
    message: string,
    context?: Record<string, unknown>
  ): EnhancedError {
    return this.createError({
      message: `Validation failed for ${field}: ${message}`,
      code: 'VALIDATION_ERROR',
      category: 'validation',
      severity: 'low',
      context,
      user_friendly_message: message,
      recovery_suggestions: ['Please check the highlighted fields and try again'],
      should_report: false
    });
  }

  /**
   * Creates an authentication error
   */
  static createAuthenticationError(
    message: string = 'Authentication required',
    context?: Record<string, unknown>
  ): EnhancedError {
    return this.createError({
      message,
      code: 'AUTHENTICATION_REQUIRED',
      category: 'authentication',
      severity: 'medium',
      context,
      user_friendly_message: 'Please sign in to access this feature.',
      recovery_suggestions: ['Sign in to your account', 'Create a new account if you don\'t have one'],
      should_report: false
    });
  }

  /**
   * Creates a data processing error
   */
  static createDataProcessingError(
    message: string,
    context?: Record<string, unknown>
  ): EnhancedError {
    return this.createError({
      message,
      code: 'DATA_PROCESSING_ERROR',
      category: 'data_processing',
      severity: 'high',
      context,
      user_friendly_message: 'There was a problem processing the marine data.',
      recovery_suggestions: [
        'Try refreshing the data',
        'Check if the data source is available',
        'Contact technical support'
      ],
      should_report: true
    });
  }

  /**
   * Creates a generic error with all required properties
   */
  private static createError(options: {
    message: string;
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    context?: Record<string, unknown>;
    user_friendly_message: string;
    recovery_suggestions: readonly string[];
    should_report: boolean;
  }): EnhancedError {
    const error = new Error(options.message) as EnhancedError;

    // Add enhanced properties
    Object.defineProperties(error, {
      code: { value: options.code, enumerable: true },
      category: { value: options.category, enumerable: true },
      severity: { value: options.severity, enumerable: true },
      context: { value: options.context || {}, enumerable: true },
      timestamp: { value: new Date(), enumerable: true },
      user_friendly_message: { value: options.user_friendly_message, enumerable: true },
      recovery_suggestions: { value: options.recovery_suggestions, enumerable: true },
      should_report: { value: options.should_report, enumerable: true }
    });

    return error;
  }
}

// Error boundary context for React Error Boundaries
export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: EnhancedError;
  readonly errorId?: string;
}

// Error logging service
export class ErrorLogger {
  private static readonly MAX_LOG_ENTRIES = 100;
  private static logs: Array<{
    error: EnhancedError;
    id: string;
    reported: boolean;
  }> = [];

  /**
   * Logs an error and optionally reports it
   */
  static async logError(error: EnhancedError): Promise<string> {
    const errorId = this.generateErrorId();

    // Add to local logs
    this.logs.push({
      error,
      id: errorId,
      reported: false
    });

    // Trim logs if too many
    if (this.logs.length > this.MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-this.MAX_LOG_ENTRIES);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error ${errorId} - ${error.severity.toUpperCase()}`);
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('Category:', error.category);
      console.error('Context:', error.context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // Report critical errors
    if (error.should_report && error.severity === 'critical') {
      await this.reportError(error, errorId);
    }

    return errorId;
  }

  /**
   * Reports an error to external monitoring service
   */
  private static async reportError(error: EnhancedError, errorId: string): Promise<void> {
    try {
      // In a real application, this would send to Sentry, LogRocket, etc.
      const reportData = {
        errorId,
        message: error.message,
        code: error.code,
        category: error.category,
        severity: error.severity,
        context: error.context,
        timestamp: error.timestamp.toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };

      // Simulate error reporting
      console.log('📡 Error reported:', reportData);

      // Mark as reported
      const logEntry = this.logs.find(log => log.id === errorId);
      if (logEntry) {
        logEntry.reported = true;
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Generates a unique error ID
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets recent error logs for debugging
   */
  static getRecentLogs(limit: number = 10): readonly typeof ErrorLogger.logs[number][] {
    return this.logs.slice(-limit);
  }

  /**
   * Clears error logs
   */
  static clearLogs(): void {
    this.logs = [];
  }
}

// Async operation wrapper with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext?: Record<string, unknown>
): Promise<Result<T, EnhancedError>> {
  try {
    const result = await operation();
    return createSuccess(result);
  } catch (error) {
    let enhancedError: EnhancedError;

    if (error instanceof Error) {
      // Convert regular errors to enhanced errors
      if ('code' in error && 'category' in error) {
        enhancedError = error as EnhancedError;
      } else {
        enhancedError = ErrorFactory.createDataProcessingError(
          error.message,
          { ...errorContext, originalError: error.name }
        );
      }
    } else {
      // Handle non-Error objects
      enhancedError = ErrorFactory.createDataProcessingError(
        String(error),
        { ...errorContext, originalError: typeof error }
      );
    }

    // Log the error
    await ErrorLogger.logError(enhancedError);

    return createFailure(enhancedError);
  }
}

// API error handler
export function handleApiError(response: Response, context?: Record<string, unknown>): EnhancedError {
  const statusCode = response.status;
  let category: ErrorCategory = 'unknown';
  let severity: ErrorSeverity = 'medium';
  let userMessage = 'An unexpected error occurred.';
  let suggestions: string[] = ['Try refreshing the page'];

  // Categorize based on status code
  if (statusCode >= 400 && statusCode < 500) {
    category = 'client_error';
    severity = 'low';

    switch (statusCode) {
      case 400:
        userMessage = 'The request was invalid. Please check your input.';
        suggestions = ['Check the form data and try again'];
        break;
      case 401:
        return ErrorFactory.createAuthenticationError('Authentication required', context);
      case 403:
        category = 'authorization';
        userMessage = 'You don\'t have permission to access this resource.';
        suggestions = ['Contact an administrator for access'];
        break;
      case 404:
        category = 'not_found';
        userMessage = 'The requested resource was not found.';
        suggestions = ['Check the URL and try again', 'Return to the home page'];
        break;
      case 429:
        userMessage = 'Too many requests. Please wait before trying again.';
        suggestions = ['Wait a few moments and try again'];
        break;
    }
  } else if (statusCode >= 500) {
    category = 'server_error';
    severity = 'high';
    userMessage = 'Our servers are experiencing issues. Please try again later.';
    suggestions = [
      'Try again in a few minutes',
      'Contact support if the problem persists'
    ];
  }

  return ErrorFactory.createError({
    message: `API request failed with status ${statusCode}`,
    code: `HTTP_${statusCode}`,
    category,
    severity,
    context: { ...context, statusCode, url: response.url },
    user_friendly_message: userMessage,
    recovery_suggestions: suggestions,
    should_report: severity === 'high' || severity === 'critical'
  });
}

// Type guard for enhanced errors
export function isEnhancedError(error: unknown): error is EnhancedError {
  return (
    error instanceof Error &&
    'code' in error &&
    'category' in error &&
    'severity' in error &&
    'user_friendly_message' in error
  );
}

// React hook for error handling in components
export function useErrorHandler() {
  const handleError = async (error: Error | EnhancedError, context?: Record<string, unknown>) => {
    let enhancedError: EnhancedError;

    if (isEnhancedError(error)) {
      enhancedError = error;
    } else {
      enhancedError = ErrorFactory.createDataProcessingError(error.message, context);
    }

    const errorId = await ErrorLogger.logError(enhancedError);
    return { error: enhancedError, errorId };
  };

  return { handleError };
}

// Export for easier imports
export { ErrorFactory as Errors };
export default ErrorFactory;