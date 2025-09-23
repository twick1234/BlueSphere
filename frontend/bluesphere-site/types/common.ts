/**
 * Common Types and Utilities
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Shared type definitions and utility types for the BlueSphere platform
 */

// Base Entity Types
export interface BaseEntity {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface TimestampedEntity extends BaseEntity {
  readonly version: number;
  readonly last_modified_by?: string;
}

// Result Types for Error Handling
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

// Create result helpers
export const createSuccess = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

export const createFailure = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

// Async Result type for Promise-based operations
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Loading states for UI components
export interface LoadingState {
  readonly isLoading: boolean;
  readonly progress?: number;
  readonly loadingText?: string;
  readonly error?: Error;
}

// Pagination types
export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly sort_by?: string;
  readonly sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total_count: number;
  readonly page: number;
  readonly limit: number;
  readonly total_pages: number;
  readonly has_next: boolean;
  readonly has_previous: boolean;
}

// Configuration types
export interface AppConfig {
  readonly api: ApiConfig;
  readonly features: FeatureFlags;
  readonly monitoring: MonitoringConfig;
  readonly cache: CacheConfig;
}

export interface ApiConfig {
  readonly base_url: string;
  readonly timeout_ms: number;
  readonly retry_attempts: number;
  readonly rate_limit: RateLimitConfig;
}

export interface RateLimitConfig {
  readonly requests_per_minute: number;
  readonly burst_limit: number;
}

export interface FeatureFlags {
  readonly enable_real_time_updates: boolean;
  readonly enable_predictive_analytics: boolean;
  readonly enable_advanced_mapping: boolean;
  readonly enable_offline_mode: boolean;
  readonly enable_experimental_features: boolean;
}

export interface MonitoringConfig {
  readonly enable_performance_monitoring: boolean;
  readonly enable_error_tracking: boolean;
  readonly sample_rate: number;
  readonly debug_mode: boolean;
}

export interface CacheConfig {
  readonly default_ttl_minutes: number;
  readonly max_cache_size_mb: number;
  readonly enable_persistent_cache: boolean;
}

// Form and Validation Types
export interface FormField<T = string> {
  readonly value: T;
  readonly error?: string;
  readonly touched: boolean;
  readonly required: boolean;
}

export interface ValidationRule<T> {
  readonly validate: (value: T) => string | null;
  readonly message: string;
}

export interface FormState<T extends Record<string, any>> {
  readonly fields: { readonly [K in keyof T]: FormField<T[K]> };
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly submitError?: string;
}

// Theme and UI Types
export interface ThemeColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly border: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
}

export interface Breakpoints {
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly xxl: string;
}

export interface Spacing {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly xxl: string;
}

export interface Typography {
  readonly fontFamily: string;
  readonly fontSize: {
    readonly xs: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
    readonly xxl: string;
  };
  readonly fontWeight: {
    readonly light: number;
    readonly normal: number;
    readonly medium: number;
    readonly semibold: number;
    readonly bold: number;
  };
  readonly lineHeight: {
    readonly tight: number;
    readonly normal: number;
    readonly relaxed: number;
  };
}

export interface Theme {
  readonly name: string;
  readonly colors: ThemeColors;
  readonly breakpoints: Breakpoints;
  readonly spacing: Spacing;
  readonly typography: Typography;
}

// Event Types
export interface BaseEvent {
  readonly type: string;
  readonly timestamp: string;
  readonly source: string;
}

export interface UserEvent extends BaseEvent {
  readonly user_id?: string;
  readonly session_id: string;
  readonly payload: Record<string, unknown>;
}

export interface SystemEvent extends BaseEvent {
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly component: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

// Utility type for making properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility type for making properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Deep readonly utility
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

// Extract array element type
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// Type-safe Object.keys
export const getTypedKeys = <T extends Record<string, unknown>>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

// Type guards
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

// Assertion functions
export const assertIsDefined = <T>(value: T | null | undefined): asserts value is T => {
  if (value === null || value === undefined) {
    throw new Error('Expected value to be defined');
  }
};

export const assertIsString = (value: unknown): asserts value is string => {
  if (!isString(value)) {
    throw new Error('Expected value to be a string');
  }
};

export const assertIsNumber = (value: unknown): asserts value is number => {
  if (!isNumber(value)) {
    throw new Error('Expected value to be a number');
  }
};

// Branded types for compile-time safety
export type Brand<T, B> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type Timestamp = Brand<string, 'Timestamp'>;
export type EmailAddress = Brand<string, 'EmailAddress'>;
export type Url = Brand<string, 'Url'>;

// Helper functions for branded types
export const createUserId = (id: string): UserId => id as UserId;
export const createSessionId = (id: string): SessionId => id as SessionId;
export const createTimestamp = (timestamp: string): Timestamp => timestamp as Timestamp;
export const createEmailAddress = (email: string): EmailAddress => email as EmailAddress;
export const createUrl = (url: string): Url => url as Url;

// JSON serialization helpers
export interface JsonSerializable {
  readonly [key: string]: JsonValue;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonSerializable
  | readonly JsonValue[];

export const isJsonSerializable = (value: unknown): value is JsonSerializable => {
  try {
    JSON.stringify(value);
    return isObject(value);
  } catch {
    return false;
  }
};