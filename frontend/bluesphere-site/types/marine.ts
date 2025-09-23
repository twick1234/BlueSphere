/**
 * Marine Data Types
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Comprehensive type definitions for marine monitoring and ocean data
 */

// Core Geographic Types
export interface Coordinates {
  readonly lat: number;
  readonly lon: number;
}

export interface BoundingBox {
  readonly north: number;
  readonly south: number;
  readonly east: number;
  readonly west: number;
}

export interface GeographicRegion {
  readonly name: string;
  readonly code: string;
  readonly bounds: BoundingBox;
  readonly type: 'ocean' | 'sea' | 'reef' | 'coastal' | 'protected_area';
}

// Environmental Data Types
export interface TemperatureReading {
  readonly celsius: number;
  readonly fahrenheit: number;
  readonly timestamp: string;
  readonly source: DataSource;
  readonly quality: DataQuality;
}

export interface SalinityReading {
  readonly psu: number; // Practical Salinity Units
  readonly timestamp: string;
  readonly depth_meters: number;
  readonly quality: DataQuality;
}

export interface CurrentData {
  readonly velocity_ms: number; // meters per second
  readonly direction_degrees: number; // 0-360 degrees
  readonly depth_meters: number;
  readonly timestamp: string;
  readonly quality: DataQuality;
}

export type DataQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface DataSource {
  readonly id: string;
  readonly name: string;
  readonly type: 'satellite' | 'buoy' | 'ship' | 'argo_float' | 'coastal_station' | 'model';
  readonly reliability: DataQuality;
  readonly last_updated: string;
}

// Marine Life Types
export interface MarineSpecies {
  readonly id: string;
  readonly name: string;
  readonly scientific_name: string;
  readonly category: 'fish' | 'coral' | 'mammal' | 'crustacean' | 'mollusc' | 'other';
  readonly conservation_status: ConservationStatus;
  readonly habitat_requirements: HabitatRequirements;
}

export type ConservationStatus =
  | 'least_concern'
  | 'near_threatened'
  | 'vulnerable'
  | 'endangered'
  | 'critically_endangered'
  | 'extinct_in_wild'
  | 'extinct'
  | 'data_deficient';

export interface HabitatRequirements {
  readonly temperature_range_celsius: [number, number];
  readonly depth_range_meters: [number, number];
  readonly salinity_tolerance: [number, number];
  readonly preferred_regions: readonly string[];
}

export interface SpeciesSighting {
  readonly id: string;
  readonly species_id: string;
  readonly coordinates: Coordinates;
  readonly timestamp: string;
  readonly confidence: number; // 0-100%
  readonly count?: number;
  readonly behavior?: string;
  readonly data_source: DataSource;
  readonly verified: boolean;
}

// Alert and Monitoring Types
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export interface EnvironmentalAlert {
  readonly id: string;
  readonly type: AlertType;
  readonly severity: AlertSeverity;
  readonly region: GeographicRegion;
  readonly coordinates: Coordinates;
  readonly start_time: string;
  readonly end_time?: string;
  readonly description: string;
  readonly impact_assessment: ImpactAssessment;
  readonly recommendations: readonly string[];
  readonly data_sources: readonly DataSource[];
}

export type AlertType =
  | 'marine_heatwave'
  | 'coral_bleaching'
  | 'pollution_event'
  | 'species_distress'
  | 'current_anomaly'
  | 'temperature_spike'
  | 'salinity_change';

export interface ImpactAssessment {
  readonly ecological_risk: RiskLevel;
  readonly economic_impact: RiskLevel;
  readonly affected_species: readonly string[];
  readonly affected_industries: readonly string[];
  readonly mitigation_urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// API Response Types
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly metadata?: ResponseMetadata;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
}

export interface ResponseMetadata {
  readonly request_id: string;
  readonly timestamp: string;
  readonly processing_time_ms: number;
  readonly source: string;
  readonly cache_hit?: boolean;
}

// User and Subscription Types
export interface UserPreferences {
  readonly user_id: string;
  readonly alert_subscriptions: readonly AlertSubscription[];
  readonly preferred_regions: readonly string[];
  readonly data_refresh_frequency: 'real_time' | 'hourly' | 'daily';
  readonly notification_methods: readonly NotificationMethod[];
  readonly language: string;
  readonly timezone: string;
}

export interface AlertSubscription {
  readonly id: string;
  readonly alert_types: readonly AlertType[];
  readonly severity_threshold: AlertSeverity;
  readonly regions: readonly string[];
  readonly active: boolean;
  readonly created_at: string;
}

export type NotificationMethod = 'email' | 'sms' | 'push' | 'webhook';

// Predictive Analytics Types
export interface PredictionModel {
  readonly id: string;
  readonly name: string;
  readonly type: 'temperature' | 'current' | 'species_migration' | 'coral_health';
  readonly accuracy: number; // 0-100%
  readonly last_trained: string;
  readonly input_parameters: readonly string[];
  readonly confidence_interval: number;
}

export interface Prediction {
  readonly id: string;
  readonly model_id: string;
  readonly target_parameter: string;
  readonly prediction_horizon_hours: number;
  readonly coordinates: Coordinates;
  readonly predicted_values: readonly PredictionValue[];
  readonly confidence_level: number;
  readonly generated_at: string;
}

export interface PredictionValue {
  readonly timestamp: string;
  readonly value: number;
  readonly confidence: number;
  readonly upper_bound?: number;
  readonly lower_bound?: number;
}

// Historical Data Types
export interface HistoricalTrend {
  readonly parameter: string;
  readonly region: string;
  readonly time_series: readonly TimeSeriesPoint[];
  readonly trend_direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  readonly statistical_significance: number;
  readonly baseline_period: string;
}

export interface TimeSeriesPoint {
  readonly timestamp: string;
  readonly value: number;
  readonly anomaly_score?: number;
  readonly data_quality: DataQuality;
}

// Component Props Types
export interface BaseComponentProps {
  readonly className?: string;
  readonly id?: string;
  readonly'data-testid'?: string;
}

export interface LoadingState {
  readonly isLoading: boolean;
  readonly progress?: number;
  readonly message?: string;
}

export interface ErrorState {
  readonly hasError: boolean;
  readonly error?: Error | ApiError;
  readonly retry?: () => void;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ReadonlyRecord<K extends string | number | symbol, V> = Readonly<Record<K, V>>;

// Type guards for runtime type checking
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
};

export const isValidCoordinates = (coords: unknown): coords is Coordinates => {
  return (
    typeof coords === 'object' &&
    coords !== null &&
    'lat' in coords &&
    'lon' in coords &&
    typeof (coords as any).lat === 'number' &&
    typeof (coords as any).lon === 'number' &&
    (coords as any).lat >= -90 &&
    (coords as any).lat <= 90 &&
    (coords as any).lon >= -180 &&
    (coords as any).lon <= 180
  );
};

export const isValidTemperature = (temp: unknown): temp is number => {
  return (
    typeof temp === 'number' &&
    !isNaN(temp) &&
    temp >= -273.15 && // Absolute zero in Celsius
    temp <= 100 // Reasonable upper bound for ocean temperatures
  );
};