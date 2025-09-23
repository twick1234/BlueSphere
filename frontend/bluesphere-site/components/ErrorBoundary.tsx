/**
 * Error Boundary Components
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * React Error Boundaries with enhanced error handling and user-friendly interfaces
 */

import React, { Component, ReactNode } from 'react';
import { EnhancedError, ErrorLogger, isEnhancedError, ErrorFactory } from '@/lib/error-handling';
import { trackErrorBoundaryPerformance } from '@/lib/performance';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: EnhancedError;
  errorId?: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: EnhancedError, errorId?: string, retry?: () => void) => ReactNode;
  onError?: (error: EnhancedError, errorId: string) => void;
  level: 'page' | 'component' | 'widget';
  context?: Record<string, unknown>;
}

/**
 * Enhanced Error Boundary with comprehensive error handling
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxRetryCount = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo): Promise<void> {
    // Convert to enhanced error if needed
    let enhancedError: EnhancedError;

    if (isEnhancedError(error)) {
      enhancedError = error;
    } else {
      enhancedError = ErrorFactory.createDataProcessingError(
        `Component error: ${error.message}`,
        {
          ...this.props.context,
          componentStack: errorInfo.componentStack,
          errorBoundaryLevel: this.props.level
        }
      );
    }

    // Log the error and get error ID
    const errorId = await ErrorLogger.logError(enhancedError);

    // Track performance impact
    trackErrorBoundaryPerformance(error, errorInfo);

    // Update state with error details
    this.setState({
      error: enhancedError,
      errorId
    });

    // Call optional error handler
    this.props.onError?.(enhancedError, errorId);
  }

  private handleRetry = (): void => {
    if (this.state.retryCount < this.maxRetryCount) {
      this.setState({
        hasError: false,
        error: undefined,
        errorId: undefined,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorId,
          this.state.retryCount < this.maxRetryCount ? this.handleRetry : undefined
        );
      }

      // Default fallback based on boundary level
      switch (this.props.level) {
        case 'page':
          return (
            <PageErrorFallback
              error={this.state.error}
              errorId={this.state.errorId}
              onRetry={this.state.retryCount < this.maxRetryCount ? this.handleRetry : undefined}
            />
          );
        case 'component':
          return (
            <ComponentErrorFallback
              error={this.state.error}
              errorId={this.state.errorId}
              onRetry={this.state.retryCount < this.maxRetryCount ? this.handleRetry : undefined}
            />
          );
        case 'widget':
          return (
            <WidgetErrorFallback
              error={this.state.error}
              errorId={this.state.errorId}
              onRetry={this.state.retryCount < this.maxRetryCount ? this.handleRetry : undefined}
            />
          );
        default:
          return <ComponentErrorFallback error={this.state.error} />;
      }
    }

    return this.props.children;
  }
}

/**
 * Page-level error fallback with full page error UI
 */
interface ErrorFallbackProps {
  error: EnhancedError;
  errorId?: string;
  onRetry?: () => void;
}

export const PageErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorId, onRetry }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#f8fafc'
  }}>
    <div style={{
      maxWidth: '600px',
      textAlign: 'center',
      backgroundColor: 'white',
      padding: '3rem',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌊</div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: '1rem'
      }}>
        Rough Waters Ahead
      </h1>

      <p style={{
        fontSize: '1.1rem',
        color: '#64748b',
        marginBottom: '1.5rem',
        lineHeight: 1.6
      }}>
        {error.user_friendly_message}
      </p>

      {error.recovery_suggestions.length > 0 && (
        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            What you can try:
          </h3>
          <ul style={{ color: '#64748b', lineHeight: 1.5 }}>
            {error.recovery_suggestions.map((suggestion, index) => (
              <li key={index} style={{ marginBottom: '0.25rem' }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
        )}

        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Return Home
        </button>
      </div>

      {errorId && (
        <p style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#94a3b8',
          fontFamily: 'monospace'
        }}>
          Error ID: {errorId}
        </p>
      )}
    </div>
  </div>
);

/**
 * Component-level error fallback for individual components
 */
export const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorId, onRetry }) => (
  <div style={{
    padding: '1.5rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    margin: '1rem 0'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
      <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#dc2626' }}>
        Component Error
      </h3>
    </div>

    <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
      {error.user_friendly_message}
    </p>

    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.875rem',
          cursor: 'pointer',
          fontWeight: '500'
        }}
      >
        Retry
      </button>
    )}

    {errorId && (
      <p style={{
        marginTop: '1rem',
        fontSize: '0.75rem',
        color: '#991b1b',
        fontFamily: 'monospace'
      }}>
        Error ID: {errorId}
      </p>
    )}
  </div>
);

/**
 * Widget-level error fallback for small components
 */
export const WidgetErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => (
  <div style={{
    padding: '1rem',
    backgroundColor: '#fffbeb',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    textAlign: 'center'
  }}>
    <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.5rem' }}>⚠️</span>
    <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem' }}>
      Unable to load
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '0.25rem 0.5rem',
          backgroundColor: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.75rem',
          cursor: 'pointer'
        }}
      >
        Retry
      </button>
    )}
  </div>
);

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: ErrorBoundaryProps['level'] = 'component',
  context?: Record<string, unknown>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary level={level} context={context}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;