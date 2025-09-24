import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/predictions/forecast'

// Mock the prediction service
jest.mock('../../../lib/ml/predictive-modeling', () => ({
  predictionService: {
    generatePrediction: jest.fn()
  }
}))

import { predictionService } from '../../../lib/ml/predictive-modeling'

describe('/api/predictions/forecast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error and console.log to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockPredictionData = [
    {
      targetTime: '2023-01-01T12:00:00.000Z',
      forecastHorizon: 24,
      predictedSST: 22.5,
      uncertainty: {
        std: 0.8,
        confidenceInterval: {
          lower_95: 21.0,
          upper_95: 24.0,
          lower_68: 21.7,
          upper_68: 23.3
        }
      },
      skill: {
        expectedError: 0.5,
        reliability: 0.85
      },
      modelUsed: 'ARIMA Short-term',
      modelVersion: '1.2.0',
      featuresUsed: ['SST history', 'Wind patterns', 'Ocean currents']
    },
    {
      targetTime: '2023-01-02T12:00:00.000Z',
      forecastHorizon: 48,
      predictedSST: 23.1,
      uncertainty: {
        std: 1.0,
        confidenceInterval: {
          lower_95: 21.1,
          upper_95: 25.1,
          lower_68: 22.1,
          upper_68: 24.1
        }
      },
      skill: {
        expectedError: 0.7,
        reliability: 0.80
      },
      modelUsed: 'ARIMA Short-term',
      modelVersion: '1.2.0',
      featuresUsed: ['SST history', 'Wind patterns', 'Ocean currents']
    }
  ]

  describe('POST requests', () => {
    it('should generate forecast successfully with required parameters', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          station_id: 'test_station_001'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Verify top-level structure
      expect(response).toHaveProperty('metadata')
      expect(response).toHaveProperty('forecast_summary')
      expect(response).toHaveProperty('predictions')
      expect(response).toHaveProperty('performance_info')
      expect(response).toHaveProperty('api_info')

      // Verify metadata
      expect(response.metadata).toHaveProperty('station_id', 'test_station_001')
      expect(response.metadata).toHaveProperty('forecast_generated_at')
      expect(response.metadata).toHaveProperty('base_time')
      expect(response.metadata).toHaveProperty('forecast_horizon_hours', 168) // Default
      expect(response.metadata).toHaveProperty('total_predictions', 2)
      expect(response.metadata).toHaveProperty('model_info')

      // Verify forecast summary
      expect(response.forecast_summary).toHaveProperty('temperature_range')
      expect(response.forecast_summary).toHaveProperty('uncertainty_metrics')
      expect(response.forecast_summary).toHaveProperty('anomaly_alerts')

      // Verify predictions array
      expect(Array.isArray(response.predictions)).toBe(true)
      expect(response.predictions).toHaveLength(2)
    })

    it('should handle custom forecast parameters', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const customParams = {
        station_id: 'custom_station',
        base_time: '2023-01-01T00:00:00.000Z',
        forecast_horizon_hours: 72,
        model_type: 'lstm',
        include_uncertainty: false
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: customParams
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.metadata.station_id).toBe('custom_station')
      expect(response.metadata.forecast_horizon_hours).toBe(72)
      expect(response.metadata.base_time).toBe('2023-01-01T00:00:00.000Z')

      // Verify prediction service was called with correct parameters
      expect(predictionService.generatePrediction).toHaveBeenCalledWith({
        stationId: 'custom_station',
        baseTime: '2023-01-01T00:00:00.000Z',
        forecastHorizon: 72,
        modelType: 'lstm',
        includeUncertainty: false
      })
    })

    it('should have properly structured prediction objects', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          include_uncertainty: true
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.predictions.forEach((prediction: any) => {
        // Verify required properties
        expect(prediction).toHaveProperty('target_time')
        expect(prediction).toHaveProperty('forecast_horizon_hours')
        expect(prediction).toHaveProperty('predicted_sst_c')
        expect(prediction).toHaveProperty('uncertainty')
        expect(prediction).toHaveProperty('skill_metrics')

        // Verify data types
        expect(typeof prediction.target_time).toBe('string')
        expect(typeof prediction.forecast_horizon_hours).toBe('number')
        expect(typeof prediction.predicted_sst_c).toBe('number')

        // Verify timestamp format
        expect(prediction.target_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

        // Verify temperature precision (2 decimal places)
        expect(prediction.predicted_sst_c).toBe(Math.round(prediction.predicted_sst_c * 100) / 100)

        // Verify uncertainty structure when included
        if (prediction.uncertainty) {
          expect(prediction.uncertainty).toHaveProperty('standard_deviation')
          expect(prediction.uncertainty).toHaveProperty('confidence_95')
          expect(prediction.uncertainty).toHaveProperty('confidence_68')

          expect(prediction.uncertainty.confidence_95).toHaveProperty('lower')
          expect(prediction.uncertainty.confidence_95).toHaveProperty('upper')
          expect(prediction.uncertainty.confidence_68).toHaveProperty('lower')
          expect(prediction.uncertainty.confidence_68).toHaveProperty('upper')

          // Verify confidence intervals are logical
          expect(prediction.uncertainty.confidence_95.lower)
            .toBeLessThan(prediction.uncertainty.confidence_95.upper)
          expect(prediction.uncertainty.confidence_68.lower)
            .toBeLessThan(prediction.uncertainty.confidence_68.upper)

          // 95% interval should be wider than 68% interval
          expect(prediction.uncertainty.confidence_95.lower)
            .toBeLessThanOrEqual(prediction.uncertainty.confidence_68.lower)
          expect(prediction.uncertainty.confidence_95.upper)
            .toBeGreaterThanOrEqual(prediction.uncertainty.confidence_68.upper)
        }

        // Verify skill metrics
        expect(prediction.skill_metrics).toHaveProperty('expected_error')
        expect(prediction.skill_metrics).toHaveProperty('reliability')

        expect(typeof prediction.skill_metrics.expected_error).toBe('number')
        expect(typeof prediction.skill_metrics.reliability).toBe('number')

        expect(prediction.skill_metrics.expected_error).toBeGreaterThanOrEqual(0)
        expect(prediction.skill_metrics.reliability).toBeGreaterThanOrEqual(0)
        expect(prediction.skill_metrics.reliability).toBeLessThanOrEqual(1)
      })
    })

    it('should exclude uncertainty when include_uncertainty is false', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          include_uncertainty: false
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.predictions.forEach((prediction: any) => {
        expect(prediction.uncertainty).toBeUndefined()
      })
    })

    it('should calculate forecast summary correctly', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const summary = response.forecast_summary

      // Verify temperature range calculations
      const temps = mockPredictionData.map(p => p.predictedSST)
      expect(summary.temperature_range.min_predicted).toBe(Math.min(...temps))
      expect(summary.temperature_range.max_predicted).toBe(Math.max(...temps))
      expect(summary.temperature_range.mean_predicted)
        .toBeCloseTo(temps.reduce((sum, t) => sum + t, 0) / temps.length, 2)

      // Verify uncertainty metrics
      const uncertainties = mockPredictionData.map(p => p.uncertainty.std)
      expect(summary.uncertainty_metrics.mean_uncertainty)
        .toBeCloseTo(uncertainties.reduce((sum, u) => sum + u, 0) / uncertainties.length, 2)
      expect(summary.uncertainty_metrics.max_uncertainty).toBe(Math.max(...uncertainties))

      // Verify anomaly alerts count
      const anomalies = mockPredictionData.filter(p => Math.abs(p.predictedSST - 22) > 3)
      expect(summary.anomaly_alerts).toBe(anomalies.length)
    })

    it('should include model information in metadata', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const modelInfo = response.metadata.model_info

      expect(modelInfo).toHaveProperty('primary_model', 'ARIMA Short-term')
      expect(modelInfo).toHaveProperty('model_version', '1.2.0')
      expect(modelInfo).toHaveProperty('features_used', 3)
    })

    it('should include performance and API information', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Verify performance info
      expect(response.performance_info).toHaveProperty('computation_time_ms')
      expect(response.performance_info).toHaveProperty('cache_status', 'miss')
      expect(response.performance_info).toHaveProperty('model_last_updated')

      expect(typeof response.performance_info.computation_time_ms).toBe('number')
      expect(response.performance_info.computation_time_ms).toBeGreaterThanOrEqual(100)
      expect(response.performance_info.computation_time_ms).toBeLessThanOrEqual(600)

      // Verify API info
      expect(response.api_info).toHaveProperty('version', '1.0.0')
      expect(response.api_info).toHaveProperty('documentation', '/api/docs/predictions')
      expect(response.api_info).toHaveProperty('rate_limit', '100 requests per hour')
      expect(response.api_info).toHaveProperty('data_sources')
      expect(response.api_info).toHaveProperty('disclaimer')

      expect(Array.isArray(response.api_info.data_sources)).toBe(true)
    })
  })

  describe('Input validation', () => {
    it('should require station_id', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBe('station_id is required')
    })

    it('should validate forecast_horizon_hours range', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          forecast_horizon_hours: 500 // Exceeds max of 336
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toContain('forecast_horizon_hours must be between 1 and 336')
    })

    it('should validate minimum forecast_horizon_hours', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          forecast_horizon_hours: 0
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toContain('forecast_horizon_hours must be between 1 and 336')
    })

    it('should handle negative forecast_horizon_hours', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          forecast_horizon_hours: -10
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toContain('forecast_horizon_hours must be between 1 and 336')
    })

    it('should use default values for optional parameters', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station'
        }
      })

      await handler(req, res)

      expect(predictionService.generatePrediction).toHaveBeenCalledWith({
        stationId: 'test_station',
        baseTime: expect.any(String),
        forecastHorizon: 168, // Default
        modelType: undefined,
        includeUncertainty: true // Default
      })
    })

    it('should handle invalid station_id formats', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const invalidStationIds = [
        '',
        null,
        undefined,
        123,
        {},
        []
      ]

      for (const stationId of invalidStationIds) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            station_id: stationId
          }
        })

        await handler(req, res)

        if (stationId === '' || stationId === null || stationId === undefined) {
          expect(res._getStatusCode()).toBe(400)
        } else {
          // Other invalid types should still be passed through
          expect(res._getStatusCode()).toBe(200)
        }
      }
    })
  })

  describe('HTTP method validation', () => {
    it('should reject GET requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: { station_id: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject DELETE requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })
  })

  describe('Error handling', () => {
    it('should handle prediction service errors', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockRejectedValue(
        new Error('Model unavailable')
      )

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error', 'Failed to generate predictions')
      expect(response).toHaveProperty('details', 'Model unavailable')
      expect(response).toHaveProperty('timestamp')

      expect(console.error).toHaveBeenCalledWith(
        'Prediction generation error:',
        expect.any(Error)
      )
    })

    it('should handle non-Error exceptions', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockRejectedValue('String error')

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response.details).toBe('String error')
    })

    it('should handle empty prediction results', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.predictions).toEqual([])
      expect(response.metadata.total_predictions).toBe(0)
    })

    it('should handle malformed prediction data', async () => {
      const malformedData = [
        {
          // Missing required fields
          targetTime: '2023-01-01T12:00:00.000Z'
        }
      ]

      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(malformedData)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station'
        }
      })

      // Should not crash but may produce unexpected results
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Logging and monitoring', () => {
    it('should log forecast generation', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          forecast_horizon_hours: 72
        }
      })

      await handler(req, res)

      expect(console.log).toHaveBeenCalledWith(
        'Generating forecast for station test_station, horizon: 72 hours'
      )
    })
  })

  describe('Response format validation', () => {
    it('should return valid JSON', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const responseData = res._getData()
      expect(() => JSON.parse(responseData)).not.toThrow()
    })

    it('should have consistent success response structure', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('metadata')
      expect(response).toHaveProperty('forecast_summary')
      expect(response).toHaveProperty('predictions')
      expect(response).toHaveProperty('performance_info')
      expect(response).toHaveProperty('api_info')

      expect(typeof response.metadata).toBe('object')
      expect(typeof response.forecast_summary).toBe('object')
      expect(Array.isArray(response.predictions)).toBe(true)
      expect(typeof response.performance_info).toBe('object')
      expect(typeof response.api_info).toBe('object')
    })

    it('should have consistent error response structure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error')
      expect(typeof response.error).toBe('string')
    })
  })

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should respond within 5 seconds
      expect(res._getStatusCode()).toBe(200)
    })

    it('should include realistic computation time', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const computationTime = response.performance_info.computation_time_ms

      expect(computationTime).toBeGreaterThan(0)
      expect(computationTime).toBeLessThan(1000) // Reasonable upper bound
    })
  })

  describe('Data consistency', () => {
    it('should return consistent metadata across requests', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const requestBody = {
        station_id: 'consistent_station',
        forecast_horizon_hours: 48
      }

      const responses = []
      for (let i = 0; i < 3; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: requestBody
        })

        await handler(req, res)
        responses.push(JSON.parse(res._getData()))
      }

      responses.forEach(response => {
        expect(response.metadata.station_id).toBe('consistent_station')
        expect(response.metadata.forecast_horizon_hours).toBe(48)
        expect(response.api_info.version).toBe('1.0.0')
        expect(response.api_info.rate_limit).toBe('100 requests per hour')
      })
    })

    it('should have logical forecast horizons in predictions', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.predictions.forEach((prediction: any) => {
        expect(prediction.forecast_horizon_hours).toBeGreaterThan(0)
        expect(prediction.forecast_horizon_hours).toBeLessThanOrEqual(
          response.metadata.forecast_horizon_hours
        )
      })
    })

    it('should have chronological target times', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: { station_id: 'test_station' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      for (let i = 1; i < response.predictions.length; i++) {
        const prevTime = new Date(response.predictions[i - 1].target_time).getTime()
        const currTime = new Date(response.predictions[i].target_time).getTime()
        expect(currTime).toBeGreaterThan(prevTime)
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle maximum forecast horizon', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          forecast_horizon_hours: 336 // Maximum 14 days
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.metadata.forecast_horizon_hours).toBe(336)
    })

    it('should handle minimum forecast horizon', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: 'test_station',
          forecast_horizon_hours: 1 // Minimum
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.metadata.forecast_horizon_hours).toBe(1)
    })

    it('should handle very long station IDs', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const longStationId = 'a'.repeat(100)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: longStationId
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.metadata.station_id).toBe(longStationId)
    })

    it('should handle special characters in station ID', async () => {
      ;(predictionService.generatePrediction as jest.Mock).mockResolvedValue(mockPredictionData)

      const specialStationId = 'station-with_special.chars@123'

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          station_id: specialStationId
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.metadata.station_id).toBe(specialStationId)
    })
  })
})