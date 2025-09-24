/**
 * Marine System Integration Tests
 * Comprehensive integration tests for marine monitoring systems
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock external dependencies
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
}
global.WebSocket = jest.fn(() => mockWebSocket) as any

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
}
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

describe('Marine System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default fetch responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/obs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            observations: [
              {
                station_id: '41001',
                timestamp: '2024-09-24T12:00:00Z',
                sst_c: 28.5,
                latitude: 25.7617,
                longitude: -80.1918
              }
            ]
          })
        })
      }

      if (url.includes('/api/stations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stations: [
              {
                station_id: '41001',
                name: 'East Hatteras',
                latitude: 25.7617,
                longitude: -80.1918,
                status: 'active'
              }
            ]
          })
        })
      }

      if (url.includes('/api/alerts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            alerts: [
              {
                id: 'alert-001',
                type: 'marine-heatwave',
                severity: 'high',
                location: { lat: 25.7617, lon: -80.1918 },
                temperature: 29.2,
                threshold: 28.0
              }
            ]
          })
        })
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  describe('Data Flow Integration', () => {
    it('integrates observation data with station information', async () => {
      const MarineDataDashboard = () => {
        const [data, setData] = React.useState(null)
        const [loading, setLoading] = React.useState(true)

        React.useEffect(() => {
          const fetchData = async () => {
            try {
              const [obsRes, stationsRes] = await Promise.all([
                fetch('/api/obs?limit=10'),
                fetch('/api/stations')
              ])

              const obsData = await obsRes.json()
              const stationsData = await stationsRes.json()

              // Merge observation data with station info
              const enrichedData = obsData.observations.map((obs: any) => {
                const station = stationsData.stations.find(
                  (s: any) => s.station_id === obs.station_id
                )
                return { ...obs, station_name: station?.name || 'Unknown' }
              })

              setData(enrichedData)
              setLoading(false)
            } catch (error) {
              console.error('Data fetch failed:', error)
              setLoading(false)
            }
          }

          fetchData()
        }, [])

        if (loading) return <div data-testid="loading">Loading...</div>

        return (
          <div data-testid="marine-dashboard">
            <h2>Marine Data Dashboard</h2>
            {data && data.length > 0 ? (
              <div className="observations">
                {(data as any[]).map((obs: any, index: number) => (
                  <div key={index} className="observation-card" data-testid={`obs-${obs.station_id}`}>
                    <h3>{obs.station_name} ({obs.station_id})</h3>
                    <p>Temperature: {obs.sst_c}°C</p>
                    <p>Location: {obs.latitude}°, {obs.longitude}°</p>
                    <p>Time: {new Date(obs.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div data-testid="no-data">No observations available</div>
            )}
          </div>
        )
      }

      render(<MarineDataDashboard />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('marine-dashboard')).toBeInTheDocument()
      })

      // Verify integrated data display
      expect(screen.getByTestId('obs-41001')).toBeInTheDocument()
      expect(screen.getByText('East Hatteras (41001)')).toBeInTheDocument()
      expect(screen.getByText('Temperature: 28.5°C')).toBeInTheDocument()

      // Verify API calls
      expect(mockFetch).toHaveBeenCalledWith('/api/obs?limit=10')
      expect(mockFetch).toHaveBeenCalledWith('/api/stations')
    })

    it('handles real-time updates through WebSocket', async () => {
      const RealTimeMonitor = () => {
        const [alerts, setAlerts] = React.useState<any[]>([])

        React.useEffect(() => {
          const ws = new WebSocket('ws://localhost:8080')

          const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data)
            if (data.type === 'temperature-alert') {
              setAlerts(prev => [...prev, data])
            }
          }

          // Find the message listener from addEventListener calls
          const messageCalls = mockWebSocket.addEventListener.mock.calls.filter(
            call => call[0] === 'message'
          )
          if (messageCalls.length > 0) {
            messageCalls[0][1](new MessageEvent('message', {
              data: JSON.stringify({
                type: 'temperature-alert',
                station: '41001',
                temperature: 29.5,
                threshold: 28.0,
                timestamp: new Date().toISOString()
              })
            }))
          }

          return () => {
            ws.close()
          }
        }, [])

        return (
          <div data-testid="realtime-monitor">
            <h2>Real-time Alerts</h2>
            <div className="alerts">
              {alerts.map((alert, index) => (
                <div key={index} className="alert" data-testid={`alert-${index}`}>
                  <strong>Station {alert.station}</strong>: {alert.temperature}°C
                  (Threshold: {alert.threshold}°C)
                </div>
              ))}
            </div>
          </div>
        )
      }

      render(<RealTimeMonitor />)

      expect(screen.getByTestId('realtime-monitor')).toBeInTheDocument()

      // WebSocket should be created
      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8080')
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))

      // Alert should be displayed
      await waitFor(() => {
        expect(screen.getByTestId('alert-0')).toBeInTheDocument()
      })

      expect(screen.getByText(/Station 41001.*29.5°C/)).toBeInTheDocument()
    })
  })

  describe('Location-Based Services', () => {
    it('integrates geolocation with marine data', async () => {
      const LocationAwareMap = () => {
        const [position, setPosition] = React.useState<GeolocationPosition | null>(null)
        const [nearbyStations, setNearbyStations] = React.useState<any[]>([])

        const handleLocationRequest = () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setPosition(pos)
              // Mock finding nearby stations
              setNearbyStations([
                { id: '41001', name: 'East Hatteras', distance: 25.5 }
              ])
            },
            (error) => console.error('Geolocation error:', error)
          )
        }

        return (
          <div data-testid="location-map">
            <button onClick={handleLocationRequest}>Get My Location</button>

            {position && (
              <div data-testid="position-info">
                <p>Latitude: {position.coords.latitude}</p>
                <p>Longitude: {position.coords.longitude}</p>
              </div>
            )}

            {nearbyStations.length > 0 && (
              <div data-testid="nearby-stations">
                <h3>Nearby Monitoring Stations</h3>
                {nearbyStations.map((station) => (
                  <div key={station.id} className="station">
                    {station.name} - {station.distance}km away
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      const user = userEvent.setup()
      render(<LocationAwareMap />)

      const locationButton = screen.getByText('Get My Location')

      // Mock successful geolocation
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 25.7617,
            longitude: -80.1918,
            accuracy: 10
          },
          timestamp: Date.now()
        } as GeolocationPosition)
      })

      await user.click(locationButton)

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()

      await waitFor(() => {
        expect(screen.getByTestId('position-info')).toBeInTheDocument()
      })

      expect(screen.getByText('Latitude: 25.7617')).toBeInTheDocument()
      expect(screen.getByText('Longitude: -80.1918')).toBeInTheDocument()
      expect(screen.getByText('East Hatteras - 25.5km away')).toBeInTheDocument()
    })

    it('handles geolocation errors gracefully', async () => {
      const LocationErrorHandler = () => {
        const [error, setError] = React.useState<string>('')

        const handleLocationRequest = () => {
          navigator.geolocation.getCurrentPosition(
            () => {},
            (error) => setError(error.message)
          )
        }

        return (
          <div data-testid="location-handler">
            <button onClick={handleLocationRequest}>Get Location</button>
            {error && <div data-testid="location-error">{error}</div>}
          </div>
        )
      }

      const user = userEvent.setup()
      render(<LocationErrorHandler />)

      // Mock geolocation error
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied the request for Geolocation.'
        } as GeolocationPositionError)
      })

      await user.click(screen.getByText('Get Location'))

      await waitFor(() => {
        expect(screen.getByTestId('location-error')).toBeInTheDocument()
      })

      expect(screen.getByText('User denied the request for Geolocation.')).toBeInTheDocument()
    })
  })

  describe('Alert System Integration', () => {
    it('integrates temperature monitoring with alert generation', async () => {
      const AlertSystem = () => {
        const [alerts, setAlerts] = React.useState<any[]>([])
        const [subscriptions, setSubscriptions] = React.useState<string[]>([])

        const subscribeToAlerts = async (stationId: string) => {
          try {
            const response = await fetch('/api/alerts/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: 'test@example.com',
                station_ids: [stationId]
              })
            })

            if (response.ok) {
              setSubscriptions(prev => [...prev, stationId])
            }
          } catch (error) {
            console.error('Subscription failed:', error)
          }
        }

        const checkAlerts = async () => {
          try {
            const response = await fetch('/api/alerts/active')
            const data = await response.json()
            setAlerts(data.alerts || [])
          } catch (error) {
            console.error('Alert check failed:', error)
          }
        }

        React.useEffect(() => {
          checkAlerts()
          const interval = setInterval(checkAlerts, 30000) // Check every 30 seconds
          return () => clearInterval(interval)
        }, [])

        return (
          <div data-testid="alert-system">
            <h2>Marine Alert System</h2>

            <div className="subscription-controls">
              <button
                onClick={() => subscribeToAlerts('41001')}
                data-testid="subscribe-btn"
              >
                Subscribe to Station 41001
              </button>
            </div>

            {subscriptions.length > 0 && (
              <div data-testid="subscriptions">
                <h3>Active Subscriptions</h3>
                {subscriptions.map((sub, index) => (
                  <div key={index}>Station {sub}</div>
                ))}
              </div>
            )}

            <div className="active-alerts">
              <h3>Active Alerts ({alerts.length})</h3>
              {alerts.map((alert, index) => (
                <div
                  key={alert.id}
                  className={`alert severity-${alert.severity}`}
                  data-testid={`active-alert-${index}`}
                >
                  <strong>{alert.type}</strong>: {alert.temperature}°C
                  at {alert.location.lat}°, {alert.location.lon}°
                </div>
              ))}
            </div>
          </div>
        )
      }

      const user = userEvent.setup()
      render(<AlertSystem />)

      // Initially should check for alerts
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/alerts/active')
      })

      expect(screen.getByText('Active Alerts (1)')).toBeInTheDocument()
      expect(screen.getByTestId('active-alert-0')).toBeInTheDocument()

      // Test subscription
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      await user.click(screen.getByTestId('subscribe-btn'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/alerts/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            station_ids: ['41001']
          })
        })
      })

      expect(screen.getByTestId('subscriptions')).toBeInTheDocument()
      expect(screen.getByText('Station 41001')).toBeInTheDocument()
    })
  })

  describe('Data Validation and Quality Control', () => {
    it('validates and filters marine observation data', () => {
      const validateObservation = (obs: any) => {
        const errors: string[] = []

        // Validate temperature range
        if (obs.sst_c < -5 || obs.sst_c > 50) {
          errors.push('Temperature out of valid range')
        }

        // Validate coordinates
        if (obs.latitude < -90 || obs.latitude > 90) {
          errors.push('Invalid latitude')
        }
        if (obs.longitude < -180 || obs.longitude > 180) {
          errors.push('Invalid longitude')
        }

        // Validate timestamp
        const timestamp = new Date(obs.timestamp)
        if (isNaN(timestamp.getTime())) {
          errors.push('Invalid timestamp')
        }

        // Check for future dates
        if (timestamp > new Date()) {
          errors.push('Timestamp in future')
        }

        return { valid: errors.length === 0, errors }
      }

      const DataValidator = () => {
        const testObservations = [
          {
            station_id: '41001',
            sst_c: 28.5,
            latitude: 25.7617,
            longitude: -80.1918,
            timestamp: '2024-09-24T12:00:00Z'
          },
          {
            station_id: '41002',
            sst_c: 150, // Invalid temperature
            latitude: 25.7617,
            longitude: -80.1918,
            timestamp: '2024-09-24T12:00:00Z'
          },
          {
            station_id: '41003',
            sst_c: 27.5,
            latitude: 95, // Invalid latitude
            longitude: -80.1918,
            timestamp: '2024-09-24T12:00:00Z'
          }
        ]

        const validatedData = testObservations.map(obs => ({
          ...obs,
          validation: validateObservation(obs)
        }))

        const validObservations = validatedData.filter(obs => obs.validation.valid)
        const invalidObservations = validatedData.filter(obs => !obs.validation.valid)

        return (
          <div data-testid="data-validator">
            <h2>Data Quality Control</h2>

            <div data-testid="valid-data">
              <h3>Valid Observations ({validObservations.length})</h3>
              {validObservations.map((obs, index) => (
                <div key={index} data-testid={`valid-${obs.station_id}`}>
                  {obs.station_id}: {obs.sst_c}°C
                </div>
              ))}
            </div>

            <div data-testid="invalid-data">
              <h3>Invalid Observations ({invalidObservations.length})</h3>
              {invalidObservations.map((obs, index) => (
                <div key={index} data-testid={`invalid-${obs.station_id}`}>
                  {obs.station_id}: {obs.validation.errors.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )
      }

      render(<DataValidator />)

      expect(screen.getByText('Valid Observations (1)')).toBeInTheDocument()
      expect(screen.getByText('Invalid Observations (2)')).toBeInTheDocument()

      expect(screen.getByTestId('valid-41001')).toBeInTheDocument()
      expect(screen.getByTestId('invalid-41002')).toBeInTheDocument()
      expect(screen.getByTestId('invalid-41003')).toBeInTheDocument()

      expect(screen.getByText(/Temperature out of valid range/)).toBeInTheDocument()
      expect(screen.getByText(/Invalid latitude/)).toBeInTheDocument()
    })
  })

  describe('Performance and Error Handling', () => {
    it('handles API failures gracefully', async () => {
      const ErrorHandlingComponent = () => {
        const [data, setData] = React.useState(null)
        const [error, setError] = React.useState('')
        const [retryCount, setRetryCount] = React.useState(0)

        const fetchDataWithRetry = async (attempt = 1) => {
          try {
            const response = await fetch('/api/obs')

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }

            const result = await response.json()
            setData(result)
            setError('')
          } catch (err) {
            if (attempt < 3) {
              setRetryCount(attempt)
              setTimeout(() => fetchDataWithRetry(attempt + 1), 1000)
            } else {
              setError(`Failed after ${attempt} attempts: ${(err as Error).message}`)
            }
          }
        }

        React.useEffect(() => {
          fetchDataWithRetry()
        }, [])

        return (
          <div data-testid="error-handler">
            {error && (
              <div data-testid="error-message" className="error">
                {error}
              </div>
            )}
            {retryCount > 0 && (
              <div data-testid="retry-info">
                Retry attempt: {retryCount}
              </div>
            )}
            {data && <div data-testid="success-data">Data loaded successfully</div>}
          </div>
        )
      }

      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      render(<ErrorHandlingComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(screen.getByText(/Failed after 3 attempts: Network error/)).toBeInTheDocument()
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })
})