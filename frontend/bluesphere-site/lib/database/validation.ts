// BlueSphere Data Validation System
// Comprehensive quality control and validation for ocean monitoring data
// Matches PRD specification for data validation and QC systems

import { z } from 'zod'

// ====================
// VALIDATION SCHEMAS
// ====================

// Station validation schema
export const StationSchema = z.object({
  station_id: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  provider: z.enum(['NDBC', 'ERDDAP', 'ERSST', 'EMSO', 'JMA', 'BOM', 'GOOS']),
  country: z.string().optional(),
  region: z.string().optional(),
  water_depth: z.number().min(0).optional(),
  station_type: z.enum(['moored_buoy', 'drifting_buoy', 'coastal_station', 'platform', 'glider']).optional(),
  deployment_date: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional()
})

// Observation validation schema with comprehensive oceanographic ranges
export const ObservationSchema = z.object({
  station_id: z.string().min(1),
  time: z.string().datetime(),
  sst_c: z.number().min(-5).max(40).optional(), // Sea surface temperature
  air_temp_c: z.number().min(-50).max(50).optional(),
  pressure_hpa: z.number().min(900).max(1100).optional(),
  wind_speed_ms: z.number().min(0).max(100).optional(),
  wind_direction_deg: z.number().min(0).max(360).optional(),
  wave_height_m: z.number().min(0).max(30).optional(),
  wave_period_s: z.number().min(0).max(30).optional(),
  salinity_psu: z.number().min(0).max(50).optional(), // Practical Salinity Units
  qc_flag: z.number().int().min(0).max(9).default(0),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  source: z.string().min(1),
  processing_level: z.number().int().min(1).max(4).default(1),
  anomaly_sst_c: z.number().min(-20).max(20).optional(),
  climatology_sst_c: z.number().min(-5).max(40).optional()
})

// Job run validation schema
export const JobRunSchema = z.object({
  source: z.string().min(1),
  job_type: z.string().default('ingestion'),
  status: z.enum(['running', 'ok', 'failed', 'cancelled', 'timeout']),
  rows_ingested: z.number().int().min(0).default(0),
  rows_updated: z.number().int().min(0).default(0),
  rows_failed: z.number().int().min(0).default(0),
  error_message: z.string().optional(),
  error_details: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  performance_metrics: z.record(z.string(), z.any()).optional()
})

// Marine heatwave validation schema
export const MarineHeatwaveSchema = z.object({
  station_id: z.string().min(1),
  start_date: z.string().date(),
  end_date: z.string().date().optional(),
  duration_days: z.number().int().min(1).optional(),
  max_intensity: z.number().min(0).optional(),
  mean_intensity: z.number().min(0).optional(),
  cumulative_intensity: z.number().min(0).optional(),
  category: z.enum(['Moderate', 'Strong', 'Severe', 'Extreme']).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

// ====================
// QUALITY CONTROL SYSTEM
// ====================

export interface QCResult {
  passed: boolean
  flag: number // 0=not_evaluated, 1=good, 2=probably_good, 3=probably_bad, 4=bad, 9=missing
  test_name: string
  test_value?: number
  threshold?: number
  message?: string
}

export class QualityController {
  private static instance: QualityController

  public static getInstance(): QualityController {
    if (!QualityController.instance) {
      QualityController.instance = new QualityController()
    }
    return QualityController.instance
  }

  // Range test - Check if values are within acceptable bounds
  rangeTest(value: number | undefined, parameter: string, lat?: number): QCResult {
    if (value === undefined || value === null) {
      return {
        passed: false,
        flag: 9,
        test_name: 'range_test',
        message: 'Missing value'
      }
    }

    const ranges: Record<string, { min: number, max: number }> = {
      sst_c: { min: -5, max: 40 },
      air_temp_c: { min: -50, max: 50 },
      pressure_hpa: { min: 900, max: 1100 },
      wind_speed_ms: { min: 0, max: 100 },
      wind_direction_deg: { min: 0, max: 360 },
      wave_height_m: { min: 0, max: 30 },
      wave_period_s: { min: 0, max: 30 },
      salinity_psu: { min: 0, max: 50 }
    }

    // Adjust SST range based on latitude for more realistic bounds
    if (parameter === 'sst_c' && lat !== undefined) {
      if (Math.abs(lat) > 60) { // Polar regions
        ranges.sst_c = { min: -2, max: 15 }
      } else if (Math.abs(lat) < 23.5) { // Tropical regions
        ranges.sst_c = { min: 10, max: 35 }
      }
    }

    const range = ranges[parameter]
    if (!range) {
      return {
        passed: true,
        flag: 0,
        test_name: 'range_test',
        message: 'No range defined for parameter'
      }
    }

    const passed = value >= range.min && value <= range.max
    return {
      passed,
      flag: passed ? 1 : 4,
      test_name: 'range_test',
      test_value: value,
      threshold: range.max,
      message: passed ? 'Value within range' : `Value ${value} outside range [${range.min}, ${range.max}]`
    }
  }

  // Spike test - Detect unrealistic sudden changes
  spikeTest(value: number, previousValue: number, nextValue: number, parameter: string): QCResult {
    if (!previousValue || !nextValue) {
      return {
        passed: true,
        flag: 0,
        test_name: 'spike_test',
        message: 'Insufficient data for spike test'
      }
    }

    const spikeTresholds: Record<string, number> = {
      sst_c: 5.0, // 5°C spike threshold
      air_temp_c: 10.0,
      pressure_hpa: 50.0,
      wind_speed_ms: 20.0,
      wave_height_m: 5.0,
      salinity_psu: 5.0
    }

    const threshold = spikeTresholds[parameter] || 999999
    const deviation = Math.abs(value - (previousValue + nextValue) / 2)
    const passed = deviation <= threshold

    return {
      passed,
      flag: passed ? 1 : (deviation > threshold * 2 ? 4 : 3),
      test_name: 'spike_test',
      test_value: deviation,
      threshold,
      message: passed ? 'No spike detected' : `Spike detected: deviation ${deviation.toFixed(2)} > ${threshold}`
    }
  }

  // Rate of change test - Detect unrealistic temporal gradients
  rateOfChangeTest(value: number, previousValue: number, timeInterval: number, parameter: string): QCResult {
    if (!previousValue || timeInterval <= 0) {
      return {
        passed: true,
        flag: 0,
        test_name: 'rate_of_change_test',
        message: 'Insufficient data for rate test'
      }
    }

    const rateThresholds: Record<string, number> = {
      sst_c: 2.0, // 2°C per hour maximum
      air_temp_c: 5.0,
      pressure_hpa: 10.0, // 10 hPa per hour
      wind_speed_ms: 30.0,
      wave_height_m: 3.0,
      salinity_psu: 1.0
    }

    const threshold = rateThresholds[parameter] || 999999
    const timeHours = timeInterval / (1000 * 60 * 60) // Convert ms to hours
    const rateOfChange = Math.abs(value - previousValue) / timeHours
    const passed = rateOfChange <= threshold

    return {
      passed,
      flag: passed ? 1 : (rateOfChange > threshold * 2 ? 4 : 3),
      test_name: 'rate_of_change_test',
      test_value: rateOfChange,
      threshold,
      message: passed ? 'Rate of change normal' : `Excessive rate: ${rateOfChange.toFixed(2)} > ${threshold} per hour`
    }
  }

  // Climatology test - Compare against long-term averages
  climatologyTest(value: number, climatologyMean: number, climatologyStd: number, parameter: string): QCResult {
    if (!climatologyMean || !climatologyStd) {
      return {
        passed: true,
        flag: 0,
        test_name: 'climatology_test',
        message: 'No climatology data available'
      }
    }

    // Use 3-sigma rule for outlier detection
    const zscore = Math.abs(value - climatologyMean) / climatologyStd
    const threshold = 3.0 // 3 standard deviations
    const passed = zscore <= threshold

    return {
      passed,
      flag: passed ? 1 : (zscore > 4 ? 4 : 3),
      test_name: 'climatology_test',
      test_value: zscore,
      threshold,
      message: passed ? 'Within climatological bounds' : `Outside climatology: z-score ${zscore.toFixed(2)} > ${threshold}`
    }
  }

  // Spatial consistency test - Compare with nearby stations
  spatialConsistencyTest(value: number, nearbyValues: number[], parameter: string): QCResult {
    if (nearbyValues.length === 0) {
      return {
        passed: true,
        flag: 0,
        test_name: 'spatial_consistency_test',
        message: 'No nearby stations for comparison'
      }
    }

    const nearbyMean = nearbyValues.reduce((sum, val) => sum + val, 0) / nearbyValues.length
    const nearbyStd = Math.sqrt(
      nearbyValues.reduce((sum, val) => sum + Math.pow(val - nearbyMean, 2), 0) / nearbyValues.length
    )

    const spatialThresholds: Record<string, number> = {
      sst_c: 3.0, // 3°C difference from nearby stations
      air_temp_c: 5.0,
      pressure_hpa: 20.0,
      wind_speed_ms: 15.0,
      salinity_psu: 2.0
    }

    const threshold = spatialThresholds[parameter] || 999999
    const deviation = Math.abs(value - nearbyMean)
    const passed = deviation <= threshold

    return {
      passed,
      flag: passed ? 1 : (deviation > threshold * 1.5 ? 4 : 3),
      test_name: 'spatial_consistency_test',
      test_value: deviation,
      threshold,
      message: passed ? 'Spatially consistent' : `Spatial outlier: deviation ${deviation.toFixed(2)} > ${threshold}`
    }
  }

  // Run comprehensive QC on an observation
  runQualityControl(observation: any, context?: {
    previousObs?: any,
    nextObs?: any,
    nearbyObs?: any[],
    climatology?: { mean: number, std: number }
  }): { overall_flag: number, tests: QCResult[] } {
    const tests: QCResult[] = []
    let worstFlag = 1

    // Run tests for each parameter that exists
    const parameters = ['sst_c', 'air_temp_c', 'pressure_hpa', 'wind_speed_ms', 'wave_height_m', 'salinity_psu']
    
    for (const param of parameters) {
      const value = observation[param]
      if (value !== undefined && value !== null) {
        // Range test
        const rangeResult = this.rangeTest(value, param, observation.lat)
        tests.push(rangeResult)
        worstFlag = Math.max(worstFlag, rangeResult.flag)

        // Spike test (if we have previous and next observations)
        if (context?.previousObs && context?.nextObs) {
          const prevValue = context.previousObs[param]
          const nextValue = context.nextObs[param]
          if (prevValue && nextValue) {
            const spikeResult = this.spikeTest(value, prevValue, nextValue, param)
            tests.push(spikeResult)
            worstFlag = Math.max(worstFlag, spikeResult.flag)
          }
        }

        // Rate of change test
        if (context?.previousObs) {
          const prevValue = context.previousObs[param]
          const prevTime = new Date(context.previousObs.time).getTime()
          const currTime = new Date(observation.time).getTime()
          if (prevValue && prevTime && currTime) {
            const rateResult = this.rateOfChangeTest(value, prevValue, currTime - prevTime, param)
            tests.push(rateResult)
            worstFlag = Math.max(worstFlag, rateResult.flag)
          }
        }

        // Climatology test (primarily for SST)
        if (param === 'sst_c' && context?.climatology) {
          const climResult = this.climatologyTest(value, context.climatology.mean, context.climatology.std, param)
          tests.push(climResult)
          worstFlag = Math.max(worstFlag, climResult.flag)
        }

        // Spatial consistency test
        if (context?.nearbyObs && context.nearbyObs.length > 0) {
          const nearbyValues = context.nearbyObs.map(obs => obs[param]).filter(val => val !== undefined)
          if (nearbyValues.length > 0) {
            const spatialResult = this.spatialConsistencyTest(value, nearbyValues, param)
            tests.push(spatialResult)
            worstFlag = Math.max(worstFlag, spatialResult.flag)
          }
        }
      }
    }

    return {
      overall_flag: worstFlag,
      tests
    }
  }
}

// ====================
// DATA VALIDATION UTILITIES
// ====================

export class DataValidator {
  private qc: QualityController

  constructor() {
    this.qc = QualityController.getInstance()
  }

  // Validate station data
  validateStation(data: any): { isValid: boolean, errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      StationSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(e => `${e.path.join('.')}: ${e.message}`))
      }
    }

    // Additional business logic validation
    if (data.water_depth && data.water_depth > 11000) {
      warnings.push('Water depth exceeds deepest ocean trenches')
    }

    if (data.deployment_date) {
      const deployDate = new Date(data.deployment_date)
      if (deployDate > new Date()) {
        errors.push('Deployment date cannot be in the future')
      }
      if (deployDate < new Date('1950-01-01')) {
        warnings.push('Very early deployment date - please verify')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Validate observation with comprehensive QC
  validateObservation(data: any, context?: any): { 
    isValid: boolean, 
    errors: string[], 
    warnings: string[], 
    qc_flag: number, 
    qc_tests: QCResult[] 
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Schema validation
    try {
      ObservationSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(e => `${e.path.join('.')}: ${e.message}`))
      }
    }

    // Quality control tests
    const qcResult = this.qc.runQualityControl(data, context)

    // Convert QC results to warnings/errors
    for (const test of qcResult.tests) {
      if (test.flag === 4) {
        errors.push(`QC Error - ${test.test_name}: ${test.message}`)
      } else if (test.flag === 3) {
        warnings.push(`QC Warning - ${test.test_name}: ${test.message}`)
      }
    }

    // Time validation
    const obsTime = new Date(data.time)
    if (obsTime > new Date()) {
      errors.push('Observation time cannot be in the future')
    }
    if (obsTime < new Date('1900-01-01')) {
      warnings.push('Very old observation - please verify timestamp')
    }

    // Coordinate validation
    if (data.lat && data.lon) {
      // Check if coordinates are on land (simplified check)
      if (Math.abs(data.lat) < 1 && Math.abs(data.lon) < 1) {
        warnings.push('Coordinates near 0,0 - please verify location')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qc_flag: qcResult.overall_flag,
      qc_tests: qcResult.tests
    }
  }

  // Validate job run data
  validateJobRun(data: any): { isValid: boolean, errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      JobRunSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(e => `${e.path.join('.')}: ${e.message}`))
      }
    }

    // Business logic validation
    if (data.rows_failed > data.rows_ingested * 0.5) {
      warnings.push('High failure rate - more than 50% of rows failed')
    }

    if (data.status === 'failed' && !data.error_message) {
      warnings.push('Failed job should include error message')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Batch validation for multiple observations
  validateObservationBatch(observations: any[]): {
    totalCount: number,
    validCount: number,
    errorCount: number,
    warningCount: number,
    results: Array<{ index: number, isValid: boolean, errors: string[], warnings: string[], qc_flag: number }>
  } {
    let validCount = 0
    let errorCount = 0
    let warningCount = 0
    const results: any[] = []

    observations.forEach((obs, index) => {
      const result = this.validateObservation(obs)
      
      if (result.isValid) validCount++
      if (result.errors.length > 0) errorCount++
      if (result.warnings.length > 0) warningCount++

      results.push({
        index,
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        qc_flag: result.qc_flag
      })
    })

    return {
      totalCount: observations.length,
      validCount,
      errorCount,
      warningCount,
      results
    }
  }
}

// Export singleton validator instance
export const dataValidator = new DataValidator()