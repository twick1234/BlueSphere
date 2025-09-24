import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/predictions/models'

// Mock the prediction service
jest.mock('../../../lib/ml/predictive-modeling', () => ({
  predictionService: {
    getModel: jest.fn(),
    getAvailableModels: jest.fn()
  }
}))

import { predictionService } from '../../../lib/ml/predictive-modeling'

describe('/api/predictions/models', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockModels = [
    {
      id: 'arima_short_term',
      name: 'ARIMA Short-term',
      type: 'arima',
      version: '1.2.0',
      description: 'Auto-regressive model optimized for 1-7 day forecasts',
      isActive: true,
      lastTrained: '2024-01-15T10:00:00.000Z',
      validationMetrics: {
        rmse: 0.85,
        r2: 0.82,
        mae: 0.65
      }
    },
    {
      id: 'lstm_deep',
      name: 'LSTM Deep Learning',
      type: 'lstm',
      version: '2.1.0',
      description: 'Deep learning model for complex pattern recognition',
      isActive: true,
      lastTrained: '2024-01-10T08:30:00.000Z',
      validationMetrics: {
        rmse: 0.75,
        r2: 0.88,
        mae: 0.58
      }
    },
    {
      id: 'gradient_boost',
      name: 'Gradient Boosting',
      type: 'gradient_boost',
      version: '1.5.0',
      description: 'Ensemble method for non-linear relationships',
      isActive: false,
      lastTrained: '2024-01-05T14:20:00.000Z',
      validationMetrics: {
        rmse: 0.92,
        r2: 0.75,
        mae: 0.72
      }
    },
    {
      id: 'ensemble_model',
      name: 'Ensemble Model',
      type: 'ensemble',
      version: '3.0.0',
      description: 'Combines multiple models for optimal accuracy',
      isActive: true,
      lastTrained: '2024-01-20T12:15:00.000Z',
      validationMetrics: {
        rmse: 0.68,
        r2: 0.91,
        mae: 0.52
      }
    }
  ]

  describe('GET requests - All models', () => {
    it('should return all models with basic information', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Verify top-level structure
      expect(response).toHaveProperty('total_models')
      expect(response).toHaveProperty('active_models')
      expect(response).toHaveProperty('model_registry')
      expect(response).toHaveProperty('system_info')
      expect(response).toHaveProperty('api_info')

      // Verify counts
      expect(response.total_models).toBe(4)
      expect(response.active_models).toBe(3) // 3 active models

      // Verify model registry structure
      expect(Array.isArray(response.model_registry)).toBe(true)
      expect(response.model_registry).toHaveLength(4)
    })

    it('should have properly structured model registry entries', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.model_registry.forEach((model: any) => {
        // Verify required properties
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('type')
        expect(model).toHaveProperty('version')
        expect(model).toHaveProperty('description')
        expect(model).toHaveProperty('is_active')
        expect(model).toHaveProperty('last_trained')
        expect(model).toHaveProperty('validation_metrics')
        expect(model).toHaveProperty('recommended_use')
        expect(model).toHaveProperty('performance_summary')

        // Verify data types
        expect(typeof model.id).toBe('string')
        expect(typeof model.name).toBe('string')
        expect(typeof model.type).toBe('string')
        expect(typeof model.version).toBe('string')
        expect(typeof model.description).toBe('string')
        expect(typeof model.is_active).toBe('boolean')
        expect(typeof model.last_trained).toBe('string')
        expect(typeof model.recommended_use).toBe('string')

        // Verify ISO timestamp format
        expect(model.last_trained).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

        // Verify valid model types
        const validTypes = ['arima', 'lstm', 'gradient_boost', 'ensemble']
        expect(validTypes).toContain(model.type)

        // Verify validation metrics structure
        expect(model.validation_metrics).toHaveProperty('rmse')
        expect(model.validation_metrics).toHaveProperty('r2')
        expect(model.validation_metrics).toHaveProperty('mae')

        expect(typeof model.validation_metrics.rmse).toBe('number')
        expect(typeof model.validation_metrics.r2).toBe('number')
        expect(typeof model.validation_metrics.mae).toBe('number')

        // Verify metric ranges
        expect(model.validation_metrics.rmse).toBeGreaterThan(0)
        expect(model.validation_metrics.r2).toBeGreaterThanOrEqual(0)
        expect(model.validation_metrics.r2).toBeLessThanOrEqual(1)
        expect(model.validation_metrics.mae).toBeGreaterThan(0)

        // Verify performance summary structure
        expect(model.performance_summary).toHaveProperty('accuracy_grade')
        expect(model.performance_summary).toHaveProperty('forecast_horizons')
        expect(model.performance_summary).toHaveProperty('computational_cost')
        expect(model.performance_summary).toHaveProperty('update_frequency')

        const validGrades = ['Excellent', 'Good', 'Fair', 'Poor']
        expect(validGrades).toContain(model.performance_summary.accuracy_grade)

        const validCosts = ['Low', 'Medium', 'High']
        expect(validCosts).toContain(model.performance_summary.computational_cost)
      })
    })

    it('should include system information', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const systemInfo = response.system_info

      expect(systemInfo).toHaveProperty('ml_framework_version', '1.0.0')
      expect(systemInfo).toHaveProperty('last_model_update')
      expect(systemInfo).toHaveProperty('next_retraining_scheduled')
      expect(systemInfo).toHaveProperty('training_data_period', '2020-01-01 to 2024-12-31')
      expect(systemInfo).toHaveProperty('validation_data_period', '2024-01-01 to 2024-12-31')

      expect(typeof systemInfo.last_model_update).toBe('number')
      expect(systemInfo.next_retraining_scheduled).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

      // Next retraining should be in the future
      const nextRetraining = new Date(systemInfo.next_retraining_scheduled)
      expect(nextRetraining.getTime()).toBeGreaterThan(Date.now())
    })

    it('should include API information', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const apiInfo = response.api_info

      expect(apiInfo).toHaveProperty('endpoints')
      expect(apiInfo).toHaveProperty('rate_limits')
      expect(apiInfo).toHaveProperty('data_freshness')

      // Verify endpoints
      expect(apiInfo.endpoints).toHaveProperty('forecast', 'POST /api/predictions/forecast')
      expect(apiInfo.endpoints).toHaveProperty('models', 'GET /api/predictions/models')
      expect(apiInfo.endpoints).toHaveProperty('model_detail')
      expect(apiInfo.endpoints).toHaveProperty('performance')

      // Verify rate limits
      expect(apiInfo.rate_limits).toHaveProperty('forecast_requests', '100 per hour')
      expect(apiInfo.rate_limits).toHaveProperty('model_queries', '500 per hour')

      // Verify data freshness
      expect(apiInfo.data_freshness).toHaveProperty('models_updated', 'Weekly')
      expect(apiInfo.data_freshness).toHaveProperty('training_data_lag', '1-7 days')
      expect(apiInfo.data_freshness).toHaveProperty('prediction_generation', 'Real-time')
    })

    it('should not include detailed information by default', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).not.toHaveProperty('model_comparison')
    })

    it('should include detailed information when requested', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          detailed: 'true'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('model_comparison')
      expect(response.model_comparison).toHaveProperty('accuracy_ranking')
      expect(response.model_comparison).toHaveProperty('best_for_horizons')

      // Verify accuracy ranking
      const ranking = response.model_comparison.accuracy_ranking
      expect(Array.isArray(ranking)).toBe(true)
      expect(ranking).toHaveLength(4)

      ranking.forEach((entry: any, index: number) => {
        expect(entry).toHaveProperty('rank', index + 1)
        expect(entry).toHaveProperty('model_id')
        expect(entry).toHaveProperty('model_name')
        expect(entry).toHaveProperty('r2_score')
        expect(entry).toHaveProperty('rmse')

        expect(typeof entry.model_id).toBe('string')
        expect(typeof entry.model_name).toBe('string')
        expect(typeof entry.r2_score).toBe('number')
        expect(typeof entry.rmse).toBe('number')
      })

      // Verify ranking is sorted by R² score (descending)
      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1].r2_score).toBeGreaterThanOrEqual(ranking[i].r2_score)
      }

      // Verify best for horizons
      const bestFor = response.model_comparison.best_for_horizons
      expect(bestFor).toHaveProperty('short_term')
      expect(bestFor).toHaveProperty('medium_term')
      expect(bestFor).toHaveProperty('long_term')

      expect(typeof bestFor.short_term).toBe('string')
      expect(typeof bestFor.medium_term).toBe('string')
      expect(typeof bestFor.long_term).toBe('string')
    })
  })

  describe('GET requests - Specific model', () => {
    it('should return specific model information', async () => {
      const targetModel = mockModels[0]
      ;(predictionService.getModel as jest.Mock).mockReturnValue(targetModel)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          model_id: 'arima_short_term'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('model')
      expect(response.model.id).toBe('arima_short_term')
      expect(response.model.name).toBe('ARIMA Short-term')

      expect(predictionService.getModel).toHaveBeenCalledWith('arima_short_term')
    })

    it('should return 404 for non-existent model', async () => {
      ;(predictionService.getModel as jest.Mock).mockReturnValue(null)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          model_id: 'non_existent_model'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      const response = JSON.parse(res._getData())
      expect(response.error).toBe('Model non_existent_model not found')
    })

    it('should include detailed performance analysis when requested', async () => {
      const targetModel = mockModels[0]
      ;(predictionService.getModel as jest.Mock).mockReturnValue(targetModel)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          model_id: 'arima_short_term',
          detailed: 'true'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.model).toHaveProperty('performance_analysis')
      const analysis = response.model.performance_analysis

      expect(analysis).toHaveProperty('accuracy_by_horizon')
      expect(analysis).toHaveProperty('seasonal_performance')
      expect(analysis).toHaveProperty('regional_performance')

      // Verify accuracy by horizon
      const horizonAnalysis = analysis.accuracy_by_horizon
      expect(horizonAnalysis).toHaveProperty('1-24h')
      expect(horizonAnalysis).toHaveProperty('1-3d')
      expect(horizonAnalysis).toHaveProperty('3-7d')
      expect(horizonAnalysis).toHaveProperty('7-14d')

      Object.values(horizonAnalysis).forEach((horizon: any) => {
        expect(horizon).toHaveProperty('rmse')
        expect(horizon).toHaveProperty('skill_score')
        expect(typeof horizon.rmse).toBe('number')
        expect(typeof horizon.skill_score).toBe('number')
        expect(horizon.skill_score).toBeGreaterThanOrEqual(0)
        expect(horizon.skill_score).toBeLessThanOrEqual(1)
      })

      // Verify seasonal performance
      const seasonalAnalysis = analysis.seasonal_performance
      expect(seasonalAnalysis).toHaveProperty('spring')
      expect(seasonalAnalysis).toHaveProperty('summer')
      expect(seasonalAnalysis).toHaveProperty('autumn')
      expect(seasonalAnalysis).toHaveProperty('winter')

      Object.values(seasonalAnalysis).forEach((season: any) => {
        expect(season).toHaveProperty('bias')
        expect(season).toHaveProperty('rmse')
        expect(typeof season.bias).toBe('number')
        expect(typeof season.rmse).toBe('number')
      })

      // Verify regional performance
      const regionalAnalysis = analysis.regional_performance
      expect(regionalAnalysis).toHaveProperty('tropical')
      expect(regionalAnalysis).toHaveProperty('temperate')
      expect(regionalAnalysis).toHaveProperty('polar')

      Object.values(regionalAnalysis).forEach((region: any) => {
        expect(region).toHaveProperty('rmse')
        expect(region).toHaveProperty('r2')
        expect(typeof region.rmse).toBe('number')
        expect(typeof region.r2).toBe('number')
      })
    })

    it('should include usage statistics when detailed', async () => {
      const targetModel = mockModels[0]
      ;(predictionService.getModel as jest.Mock).mockReturnValue(targetModel)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          model_id: 'arima_short_term',
          detailed: 'true'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('usage_stats')
      const stats = response.usage_stats

      expect(stats).toHaveProperty('total_predictions_generated')
      expect(stats).toHaveProperty('average_computation_time_ms')
      expect(stats).toHaveProperty('last_used')
      expect(stats).toHaveProperty('success_rate')

      expect(typeof stats.total_predictions_generated).toBe('number')
      expect(typeof stats.average_computation_time_ms).toBe('number')
      expect(typeof stats.last_used).toBe('string')
      expect(typeof stats.success_rate).toBe('number')

      expect(stats.total_predictions_generated).toBeGreaterThan(5000)
      expect(stats.average_computation_time_ms).toBeGreaterThanOrEqual(100)
      expect(stats.success_rate).toBeGreaterThanOrEqual(0.9)
      expect(stats.success_rate).toBeLessThanOrEqual(1.0)

      expect(stats.last_used).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should not include detailed information by default for specific model', async () => {
      const targetModel = mockModels[0]
      ;(predictionService.getModel as jest.Mock).mockReturnValue(targetModel)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          model_id: 'arima_short_term'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.model).not.toHaveProperty('performance_analysis')
      expect(response).not.toHaveProperty('usage_stats')
    })
  })

  describe('Helper function behavior', () => {
    it('should generate correct recommended use descriptions', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const models = response.model_registry

      const arimaModel = models.find((m: any) => m.type === 'arima')
      const lstmModel = models.find((m: any) => m.type === 'lstm')
      const gradientModel = models.find((m: any) => m.type === 'gradient_boost')
      const ensembleModel = models.find((m: any) => m.type === 'ensemble')

      expect(arimaModel.recommended_use).toContain('day forecasts')
      expect(lstmModel.recommended_use).toBe('Complex pattern recognition, 1-10 day forecasts')
      expect(gradientModel.recommended_use).toBe('Non-linear relationships, 1-5 day forecasts')
      expect(ensembleModel.recommended_use).toBe('High accuracy requirements, 1-14 day forecasts')
    })

    it('should generate correct accuracy grades', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const models = response.model_registry

      models.forEach((model: any) => {
        const r2 = model.validation_metrics.r2
        const grade = model.performance_summary.accuracy_grade

        if (r2 >= 0.8) {
          expect(grade).toBe('Excellent')
        } else if (r2 >= 0.7) {
          expect(grade).toBe('Good')
        } else if (r2 >= 0.6) {
          expect(grade).toBe('Fair')
        } else {
          expect(grade).toBe('Poor')
        }
      })
    })

    it('should assign correct computational costs', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const models = response.model_registry

      const arimaModel = models.find((m: any) => m.type === 'arima')
      const lstmModel = models.find((m: any) => m.type === 'lstm')
      const gradientModel = models.find((m: any) => m.type === 'gradient_boost')
      const ensembleModel = models.find((m: any) => m.type === 'ensemble')

      expect(arimaModel.performance_summary.computational_cost).toBe('Low')
      expect(lstmModel.performance_summary.computational_cost).toBe('High')
      expect(gradientModel.performance_summary.computational_cost).toBe('Medium')
      expect(ensembleModel.performance_summary.computational_cost).toBe('High')
    })
  })

  describe('HTTP method validation', () => {
    it('should reject POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { test: 'data' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: { test: 'data' },
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
      ;(predictionService.getAvailableModels as jest.Mock).mockImplementation(() => {
        throw new Error('Service unavailable')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error', 'Failed to retrieve model information')
      expect(response).toHaveProperty('details', 'Service unavailable')
      expect(response).toHaveProperty('timestamp')

      expect(console.error).toHaveBeenCalledWith(
        'Models API error:',
        expect.any(Error)
      )
    })

    it('should handle non-Error exceptions', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockImplementation(() => {
        throw 'String error'
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response.details).toBe('String error')
    })

    it('should handle empty model list', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.total_models).toBe(0)
      expect(response.active_models).toBe(0)
      expect(response.model_registry).toEqual([])
    })

    it('should handle malformed model data', async () => {
      const malformedModels = [
        {
          id: 'broken_model',
          // Missing required fields
          validationMetrics: {}
        }
      ]

      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(malformedModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      // Should not crash but may produce unexpected results
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Query parameter handling', () => {
    it('should handle case-insensitive detailed parameter', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const queries = ['true', 'TRUE', 'True', 'false', 'FALSE', 'False', 'invalid']

      for (const detailed of queries) {
        const { req, res } = createMocks({
          method: 'GET',
          query: { detailed }
        })

        await handler(req, res)

        const response = JSON.parse(res._getData())

        if (detailed.toLowerCase() === 'true') {
          expect(response).toHaveProperty('model_comparison')
        } else {
          expect(response).not.toHaveProperty('model_comparison')
        }
      }
    })

    it('should handle array query parameters', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          detailed: ['true', 'false']
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Should use first value in array
      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty('model_comparison')
    })

    it('should handle special characters in model_id', async () => {
      ;(predictionService.getModel as jest.Mock).mockReturnValue(null)

      const specialIds = [
        'model-with-dashes',
        'model_with_underscores',
        'model.with.dots',
        'model@special',
        'model with spaces'
      ]

      for (const modelId of specialIds) {
        const { req, res } = createMocks({
          method: 'GET',
          query: { model_id: modelId }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(404)
        expect(predictionService.getModel).toHaveBeenCalledWith(modelId)
      }
    })
  })

  describe('Response format validation', () => {
    it('should return valid JSON', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = res._getData()
      expect(() => JSON.parse(responseData)).not.toThrow()
    })

    it('should have consistent success response structure', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('total_models')
      expect(response).toHaveProperty('active_models')
      expect(response).toHaveProperty('model_registry')
      expect(response).toHaveProperty('system_info')
      expect(response).toHaveProperty('api_info')

      expect(typeof response.total_models).toBe('number')
      expect(typeof response.active_models).toBe('number')
      expect(Array.isArray(response.model_registry)).toBe(true)
      expect(typeof response.system_info).toBe('object')
      expect(typeof response.api_info).toBe('object')
    })

    it('should have consistent error response structure', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockImplementation(() => {
        throw new Error('Test error')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error')
      expect(response).toHaveProperty('details')
      expect(response).toHaveProperty('timestamp')

      expect(typeof response.error).toBe('string')
      expect(typeof response.details).toBe('string')
      expect(typeof response.timestamp).toBe('string')
    })
  })

  describe('Performance', () => {
    it('should respond quickly', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100) // Should respond within 100ms
      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle large model lists efficiently', async () => {
      // Create a large number of models
      const manyModels = Array.from({ length: 100 }, (_, i) => ({
        ...mockModels[0],
        id: `model_${i}`,
        name: `Model ${i}`,
        validationMetrics: {
          rmse: Math.random(),
          r2: Math.random(),
          mae: Math.random()
        }
      }))

      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(manyModels)

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
        query: { detailed: 'true' }
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should respond within 1 second
      expect(res._getStatusCode()).toBe(200)

      const response = JSON.parse(res._getData())
      expect(response.model_registry).toHaveLength(100)
    })
  })

  describe('Data consistency', () => {
    it('should return consistent data across multiple requests', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const responses = []

      for (let i = 0; i < 3; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        responses.push(JSON.parse(res._getData()))
      }

      // All responses should have the same structure and static data
      responses.forEach((response, index) => {
        expect(response.total_models).toBe(4)
        expect(response.active_models).toBe(3)
        expect(response.system_info.ml_framework_version).toBe('1.0.0')

        if (index > 0) {
          expect(response.model_registry.length).toBe(responses[0].model_registry.length)
        }
      })
    })

    it('should have logical last model update timestamp', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const lastUpdate = response.system_info.last_model_update

      // Should be the maximum timestamp from all models
      const modelTimestamps = mockModels.map(m => new Date(m.lastTrained).getTime())
      const expectedMax = Math.max(...modelTimestamps)

      expect(lastUpdate).toBe(expectedMax)
    })

    it('should maintain model order consistency', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
        query: { detailed: 'true' }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const ranking = response.model_comparison.accuracy_ranking

      // Ranking should be sorted by R² score
      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1].r2_score).toBeGreaterThanOrEqual(ranking[i].r2_score)
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle very long model IDs', async () => {
      const longModelId = 'a'.repeat(100)
      ;(predictionService.getModel as jest.Mock).mockReturnValue(null)

      const { req, res } = createMocks({
        method: 'GET',
        query: { model_id: longModelId }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(predictionService.getModel).toHaveBeenCalledWith(longModelId)
    })

    it('should handle empty model ID', async () => {
      ;(predictionService.getModel as jest.Mock).mockReturnValue(null)

      const { req, res } = createMocks({
        method: 'GET',
        query: { model_id: '' }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(predictionService.getModel).toHaveBeenCalledWith('')
    })

    it('should handle null/undefined query parameters', async () => {
      ;(predictionService.getAvailableModels as jest.Mock).mockReturnValue(mockModels)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          model_id: undefined,
          detailed: null
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Should return all models since model_id is undefined
      const response = JSON.parse(res._getData())
      expect(response.model_registry).toHaveLength(4)
    })
  })
})