/**
 * Comprehensive WebSocket functionality tests
 * Tests real-time communication for marine data
 */

import { WebSocketManager } from '../../lib/websocket'

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: WebSocket.OPEN,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
})) as any

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager
  let mockWs: any

  beforeEach(() => {
    mockWs = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: 1, // OPEN
    }
    ;(global.WebSocket as any).mockImplementation(() => mockWs)

    wsManager = new WebSocketManager('ws://localhost:8080')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Connection Management', () => {
    it('should establish connection', () => {
      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8080')
      expect(mockWs.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockWs.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockWs.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
      expect(mockWs.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should handle connection open', () => {
      const onOpen = jest.fn()
      wsManager.onOpen(onOpen)

      // Simulate connection open
      const openHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')[1]
      openHandler()

      expect(onOpen).toHaveBeenCalled()
    })

    it('should handle connection close', () => {
      const onClose = jest.fn()
      wsManager.onClose(onClose)

      // Simulate connection close
      const closeHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'close')[1]
      closeHandler({ code: 1000, reason: 'Normal closure' })

      expect(onClose).toHaveBeenCalledWith({ code: 1000, reason: 'Normal closure' })
    })

    it('should handle connection error', () => {
      const onError = jest.fn()
      wsManager.onError(onError)

      // Simulate connection error
      const errorHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'error')[1]
      const error = new Error('Connection failed')
      errorHandler(error)

      expect(onError).toHaveBeenCalledWith(error)
    })

    it('should close connection', () => {
      wsManager.close()
      expect(mockWs.close).toHaveBeenCalled()
    })
  })

  describe('Message Handling', () => {
    it('should send messages when connected', () => {
      const message = { type: 'shark-update', sharkId: 'SHK-2024-ABC123' }

      wsManager.send(message)
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should queue messages when disconnected', () => {
      mockWs.readyState = 0 // CONNECTING
      const message = { type: 'shark-update', sharkId: 'SHK-2024-ABC123' }

      wsManager.send(message)
      expect(mockWs.send).not.toHaveBeenCalled()

      // Simulate connection open
      mockWs.readyState = 1 // OPEN
      const openHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')[1]
      openHandler()

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should handle incoming messages', () => {
      const onMessage = jest.fn()
      wsManager.onMessage(onMessage)

      // Simulate incoming message
      const messageHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')[1]
      const messageData = { type: 'temperature-update', temperature: 28.5, location: { lat: 25.7617, lon: -80.1918 } }
      messageHandler({ data: JSON.stringify(messageData) })

      expect(onMessage).toHaveBeenCalledWith(messageData)
    })

    it('should handle malformed messages gracefully', () => {
      const onMessage = jest.fn()
      const onError = jest.fn()
      wsManager.onMessage(onMessage)
      wsManager.onError(onError)

      // Simulate malformed message
      const messageHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')[1]
      messageHandler({ data: 'invalid json' })

      expect(onMessage).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('Subscription Management', () => {
    it('should subscribe to shark tracking updates', () => {
      wsManager.subscribeToSharkUpdates('SHK-2024-ABC123')

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'subscribe',
        channel: 'shark-tracking',
        sharkId: 'SHK-2024-ABC123'
      }))
    })

    it('should unsubscribe from shark tracking updates', () => {
      wsManager.unsubscribeFromSharkUpdates('SHK-2024-ABC123')

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'unsubscribe',
        channel: 'shark-tracking',
        sharkId: 'SHK-2024-ABC123'
      }))
    })

    it('should subscribe to temperature alerts', () => {
      wsManager.subscribeToTemperatureAlerts({ lat: 25.7617, lon: -80.1918 }, 100)

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'subscribe',
        channel: 'temperature-alerts',
        location: { lat: 25.7617, lon: -80.1918 },
        radius: 100
      }))
    })

    it('should subscribe to marine heatwave alerts', () => {
      wsManager.subscribeToMarineHeatwaves(['atlantic', 'pacific'])

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'subscribe',
        channel: 'marine-heatwaves',
        regions: ['atlantic', 'pacific']
      }))
    })
  })

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on close', (done) => {
      const originalWebSocket = global.WebSocket
      let reconnectCount = 0

      global.WebSocket = jest.fn(() => {
        reconnectCount++
        return mockWs
      }) as any

      wsManager.enableAutoReconnect(100) // 100ms interval for testing

      // Simulate connection close
      const closeHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'close')[1]
      closeHandler({ code: 1006, reason: 'Abnormal closure' })

      setTimeout(() => {
        expect(reconnectCount).toBeGreaterThan(1)
        global.WebSocket = originalWebSocket
        done()
      }, 250)
    })

    it('should not reconnect on normal closure', (done) => {
      const originalWebSocket = global.WebSocket
      let reconnectCount = 0

      global.WebSocket = jest.fn(() => {
        reconnectCount++
        return mockWs
      }) as any

      wsManager.enableAutoReconnect(100)

      // Simulate normal closure
      const closeHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'close')[1]
      closeHandler({ code: 1000, reason: 'Normal closure' })

      setTimeout(() => {
        expect(reconnectCount).toBe(1) // Only initial connection
        global.WebSocket = originalWebSocket
        done()
      }, 250)
    })

    it('should disable auto reconnect', () => {
      wsManager.disableAutoReconnect()

      // Simulate connection close
      const closeHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'close')[1]
      closeHandler({ code: 1006, reason: 'Abnormal closure' })

      // Should not attempt reconnection
      expect(WebSocket).toHaveBeenCalledTimes(1)
    })
  })

  describe('Connection Status', () => {
    it('should report connection status correctly', () => {
      expect(wsManager.isConnected()).toBe(true)

      mockWs.readyState = 0 // CONNECTING
      expect(wsManager.isConnected()).toBe(false)

      mockWs.readyState = 2 // CLOSING
      expect(wsManager.isConnected()).toBe(false)

      mockWs.readyState = 3 // CLOSED
      expect(wsManager.isConnected()).toBe(false)
    })

    it('should return connection state', () => {
      mockWs.readyState = 0
      expect(wsManager.getReadyState()).toBe('CONNECTING')

      mockWs.readyState = 1
      expect(wsManager.getReadyState()).toBe('OPEN')

      mockWs.readyState = 2
      expect(wsManager.getReadyState()).toBe('CLOSING')

      mockWs.readyState = 3
      expect(wsManager.getReadyState()).toBe('CLOSED')
    })
  })
})