import { test, expect } from '@playwright/test'

/**
 * API Coverage Tests using Playwright's Request Context
 * These tests directly test API endpoints to improve code coverage
 */

test.describe('API Endpoint Coverage Tests', () => {
  test('comprehensive metrics API testing', async ({ request }) => {
    console.log('🔍 Testing Metrics API Coverage')

    // Test GET request
    const response = await request.get('/api/metrics')
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('status', 'success')

    // Verify data structure
    expect(data.data).toHaveProperty('coverage')
    expect(data.data).toHaveProperty('performance')
    expect(data.data).toHaveProperty('system')
    expect(data.data).toHaveProperty('tests')
    expect(data.data).toHaveProperty('build')

    // Test OPTIONS request (CORS)
    const optionsResponse = await request.fetch('/api/metrics', { method: 'OPTIONS' })
    expect(optionsResponse.status()).toBe(200)
    expect(optionsResponse.headers()['access-control-allow-origin']).toBe('*')

    // Test unsupported method
    const postResponse = await request.fetch('/api/metrics', { method: 'POST' })
    expect(postResponse.status()).toBe(405)

    console.log('✅ Metrics API coverage completed')
  })

  test('marine observations API comprehensive testing', async ({ request }) => {
    console.log('🌊 Testing Marine Observations API Coverage')

    // Test basic GET request
    const basicResponse = await request.get('/api/obs')
    expect(basicResponse.ok()).toBeTruthy()

    const basicData = await basicResponse.json()
    expect(basicData).toHaveProperty('observations')
    expect(Array.isArray(basicData.observations)).toBeTruthy()

    // Test with limit parameter
    const limitResponse = await request.get('/api/obs?limit=5')
    expect(limitResponse.ok()).toBeTruthy()

    // Test with station parameter
    const stationResponse = await request.get('/api/obs?station=41001&limit=3')
    expect(stationResponse.ok()).toBeTruthy()

    // Test date range filtering
    const dateResponse = await request.get('/api/obs?start_date=2024-09-22T00:00:00Z&end_date=2024-09-22T23:59:59Z')
    expect(dateResponse.ok()).toBeTruthy()

    // Test temperature range
    const tempResponse = await request.get('/api/obs?min_temp=20&max_temp=30')
    expect(tempResponse.ok()).toBeTruthy()

    // Test quality control flag
    const qcResponse = await request.get('/api/obs?qc_flag=1')
    expect(qcResponse.ok()).toBeTruthy()

    // Test coordinate-based queries
    const coordResponse = await request.get('/api/obs?lat=35.0&lon=-75.0&radius=100')
    expect(coordResponse.ok()).toBeTruthy()

    // Test pagination
    const paginationResponse = await request.get('/api/obs?limit=5&offset=10')
    expect(paginationResponse.ok()).toBeTruthy()
    const paginationData = await paginationResponse.json()
    expect(paginationData.observations.length).toBeLessThanOrEqual(5)

    // Test anomaly threshold
    const anomalyResponse = await request.get('/api/obs?anomaly_threshold=2.0')
    expect(anomalyResponse.ok()).toBeTruthy()

    // Test invalid limit parameter
    const invalidLimitResponse = await request.get('/api/obs?limit=invalid')
    expect(invalidLimitResponse.status()).toBe(400)

    // Test invalid date format
    const invalidDateResponse = await request.get('/api/obs?start_date=invalid-date')
    expect(invalidDateResponse.status()).toBe(400)

    // Test large limit values
    const largeLimitResponse = await request.get('/api/obs?limit=10000')
    expect(largeLimitResponse.ok()).toBeTruthy()
    const largeLimitData = await largeLimitResponse.json()
    expect(largeLimitData.observations.length).toBeLessThanOrEqual(1000)

    // Test unsupported HTTP method
    const postResponse = await request.fetch('/api/obs', { method: 'POST' })
    expect(postResponse.status()).toBe(405)

    // Test CORS headers
    expect(basicResponse.headers()['access-control-allow-origin']).toBeDefined()

    console.log('✅ Marine Observations API coverage completed')
  })

  test('stations API comprehensive testing', async ({ request }) => {
    console.log('⚓ Testing Stations API Coverage')

    // Test basic GET request
    const basicResponse = await request.get('/api/stations')
    expect(basicResponse.ok()).toBeTruthy()

    const basicData = await basicResponse.json()
    expect(basicData).toHaveProperty('stations')
    expect(basicData).toHaveProperty('metadata')

    // Test active status filtering
    const activeResponse = await request.get('/api/stations?active=true')
    expect(activeResponse.ok()).toBeTruthy()
    const activeData = await activeResponse.json()
    activeData.stations.forEach((station: any) => {
      expect(station.status).toBe('active')
    })

    // Test region filtering
    const regionResponse = await request.get('/api/stations?region=atlantic')
    expect(regionResponse.ok()).toBeTruthy()

    // Test metadata
    const metadataData = await basicResponse.json()
    expect(metadataData.metadata).toBeDefined()
    expect(metadataData.metadata).toHaveProperty('total_count')

    console.log('✅ Stations API coverage completed')
  })

  test('chatbot API comprehensive testing', async ({ request }) => {
    console.log('🤖 Testing Chatbot API Coverage')

    // Test GET request (should be supported)
    const getResponse = await request.get('/api/chatbot')
    expect([200, 405].includes(getResponse.status())).toBeTruthy()

    // Test POST request (if supported)
    const postResponse = await request.post('/api/chatbot', {
      data: { message: 'Hello' }
    })
    expect([200, 405].includes(postResponse.status())).toBeTruthy()

    // Test PUT request
    const putResponse = await request.put('/api/chatbot')
    expect([200, 405].includes(putResponse.status())).toBeTruthy()

    // Test DELETE request
    const deleteResponse = await request.delete('/api/chatbot')
    expect([200, 405].includes(deleteResponse.status())).toBeTruthy()

    // Test OPTIONS request
    const optionsResponse = await request.fetch('/api/chatbot', { method: 'OPTIONS' })
    expect([200, 405].includes(optionsResponse.status())).toBeTruthy()

    console.log('✅ Chatbot API coverage completed')
  })

  test('faq API comprehensive testing', async ({ request }) => {
    console.log('❓ Testing FAQ API Coverage')

    // Test GET request
    const response = await request.get('/api/faq')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()

    // Each FAQ item should have expected structure
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('question')
      expect(data[0]).toHaveProperty('answer')
    }

    console.log('✅ FAQ API coverage completed')
  })

  test('status API comprehensive testing', async ({ request }) => {
    console.log('📊 Testing Status API Coverage')

    // Test GET request
    const response = await request.get('/api/status')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')

    console.log('✅ Status API coverage completed')
  })

  test('alert system APIs comprehensive testing', async ({ request }) => {
    console.log('🚨 Testing Alert System APIs Coverage')

    // Test marine heatwaves alerts
    const heatwaveResponse = await request.get('/api/alerts/marine-heatwaves')
    expect(heatwaveResponse.ok()).toBeTruthy()

    const heatwaveData = await heatwaveResponse.json()
    expect(heatwaveData).toHaveProperty('alerts')
    expect(Array.isArray(heatwaveData.alerts)).toBeTruthy()

    // Test active alerts
    const activeResponse = await request.get('/api/alerts/active')
    expect(activeResponse.ok()).toBeTruthy()

    // Test with severity filter
    const severityResponse = await request.get('/api/alerts/active?severity=high')
    expect(severityResponse.ok()).toBeTruthy()

    // Test with region filter
    const regionResponse = await request.get('/api/alerts/active?region=pacific')
    expect(regionResponse.ok()).toBeTruthy()

    // Test alert subscription
    const subscribeResponse = await request.post('/api/alerts/subscribe', {
      data: {
        email: 'test@example.com',
        regions: ['pacific'],
        severity: ['high', 'critical']
      }
    })
    expect([200, 201].includes(subscribeResponse.status())).toBeTruthy()

    // Test duplicate subscription
    const duplicateResponse = await request.post('/api/alerts/subscribe', {
      data: {
        email: 'test@example.com',
        regions: ['pacific']
      }
    })
    expect([200, 409].includes(duplicateResponse.status())).toBeTruthy()

    // Test invalid email
    const invalidEmailResponse = await request.post('/api/alerts/subscribe', {
      data: {
        email: 'invalid-email',
        regions: ['pacific']
      }
    })
    expect(invalidEmailResponse.status()).toBe(400)

    // Test alert processing
    const processResponse = await request.post('/api/alerts/process')
    expect([200, 202].includes(processResponse.status())).toBeTruthy()

    console.log('✅ Alert System APIs coverage completed')
  })

  test('notification system APIs comprehensive testing', async ({ request }) => {
    console.log('📧 Testing Notification System APIs Coverage')

    // Test notification send
    const sendResponse = await request.post('/api/notifications/send', {
      data: {
        recipients: ['test@example.com'],
        subject: 'Test Notification',
        message: 'This is a test notification'
      }
    })
    expect([200, 202].includes(sendResponse.status())).toBeTruthy()

    // Test rate limiting
    const rateLimitResponse = await request.post('/api/notifications/send', {
      data: {
        recipients: ['test@example.com'],
        subject: 'Rate Limit Test',
        message: 'Testing rate limits'
      }
    })
    expect([200, 202, 429].includes(rateLimitResponse.status())).toBeTruthy()

    // Test notification history
    const historyResponse = await request.get('/api/notifications/history')
    expect(historyResponse.ok()).toBeTruthy()

    const historyData = await historyResponse.json()
    expect(historyData).toHaveProperty('notifications')
    expect(Array.isArray(historyData.notifications)).toBeTruthy()

    // Test history with filters
    const filteredResponse = await request.get('/api/notifications/history?status=sent&limit=10')
    expect(filteredResponse.ok()).toBeTruthy()

    // Test history pagination
    const paginatedResponse = await request.get('/api/notifications/history?offset=5&limit=5')
    expect(paginatedResponse.ok()).toBeTruthy()

    console.log('✅ Notification System APIs coverage completed')
  })

  test('prediction system APIs comprehensive testing', async ({ request }) => {
    console.log('🔮 Testing Prediction System APIs Coverage')

    // Test forecast endpoint
    const forecastResponse = await request.get('/api/predictions/forecast')
    expect(forecastResponse.ok()).toBeTruthy()

    const forecastData = await forecastResponse.json()
    expect(forecastData).toHaveProperty('forecast')
    expect(forecastData).toHaveProperty('model_info')

    // Test with parameters
    const parameterizedResponse = await request.get('/api/predictions/forecast?region=pacific&days=7')
    expect(parameterizedResponse.ok()).toBeTruthy()

    // Test models endpoint
    const modelsResponse = await request.get('/api/predictions/models')
    expect(modelsResponse.ok()).toBeTruthy()

    const modelsData = await modelsResponse.json()
    expect(modelsData).toHaveProperty('models')
    expect(Array.isArray(modelsData.models)).toBeTruthy()

    // Test with model filter
    const filteredModelsResponse = await request.get('/api/predictions/models?type=temperature')
    expect(filteredModelsResponse.ok()).toBeTruthy()

    console.log('✅ Prediction System APIs coverage completed')
  })

  test('edge cases and error handling', async ({ request }) => {
    console.log('⚠️ Testing Edge Cases and Error Handling')

    // Test non-existent endpoint
    const notFoundResponse = await request.get('/api/nonexistent')
    expect(notFoundResponse.status()).toBe(404)

    // Test malformed JSON
    const malformedResponse = await request.post('/api/alerts/subscribe', {
      data: 'invalid json'
    })
    expect([400, 405].includes(malformedResponse.status())).toBeTruthy()

    // Test empty request body where required
    const emptyBodyResponse = await request.post('/api/notifications/send', {})
    expect([400, 405].includes(emptyBodyResponse.status())).toBeTruthy()

    // Test very long parameters
    const longParamResponse = await request.get('/api/obs?station=' + 'A'.repeat(1000))
    expect([400, 414].includes(longParamResponse.status())).toBeTruthy()

    console.log('✅ Edge cases and error handling coverage completed')
  })
})

test.describe('Concurrent API Testing', () => {
  test('concurrent requests performance', async ({ request }) => {
    console.log('⚡ Testing Concurrent API Performance')

    // Create multiple concurrent requests
    const requests = Array.from({ length: 10 }, () =>
      request.get('/api/metrics')
    )

    const startTime = Date.now()
    const responses = await Promise.all(requests)
    const endTime = Date.now()

    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy()
    })

    // Should handle concurrent requests efficiently
    expect(endTime - startTime).toBeLessThan(10000) // 10 seconds

    console.log(`✅ Concurrent requests completed in ${endTime - startTime}ms`)
  })
})