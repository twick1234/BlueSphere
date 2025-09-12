export interface WebSocketMessage {
  type: 'temperature_update' | 'alert_triggered' | 'prediction_update' | 'connection_status';
  data: any;
  timestamp: string;
  region?: string;
}

export interface TemperatureUpdate {
  region: string;
  temperature: number;
  anomaly: number;
  coordinates: { lat: number; lon: number };
  timestamp: string;
}

export interface AlertUpdate {
  id: string;
  type: 'marine_heatwave' | 'temperature_spike' | 'anomaly_detected' | 'coral_bleaching_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  temperature: number;
  threshold: number;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: { [key: string]: ((message: WebSocketMessage) => void)[] } = {};
  private isConnecting = false;

  constructor() {
    // Auto-connect in browser environment
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    try {
      // In a real implementation, this would connect to a WebSocket server
      // For demo purposes, we'll simulate with a mock connection
      this.simulateWebSocketConnection();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private simulateWebSocketConnection() {
    // Simulate WebSocket connection for demo purposes
    setTimeout(() => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Notify listeners of successful connection
      this.notifyListeners({
        type: 'connection_status',
        data: { status: 'connected' },
        timestamp: new Date().toISOString()
      });

      // Start sending simulated real-time updates
      this.startSimulatedUpdates();
    }, 1000);
  }

  private startSimulatedUpdates() {
    const regions = [
      { name: 'Great Barrier Reef', lat: -16.3, lon: 145.8 },
      { name: 'Caribbean Sea', lat: 15.0, lon: -75.0 },
      { name: 'Mediterranean Sea', lat: 40.0, lon: 15.0 },
      { name: 'Red Sea', lat: 22.0, lon: 38.0 },
      { name: 'Gulf of Mexico', lat: 25.0, lon: -90.0 }
    ];

    // Send temperature updates every 30 seconds
    setInterval(() => {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const baseTemp = 26.5 + (Math.random() - 0.5) * 4;
      const anomaly = (Math.random() - 0.5) * 3;

      const temperatureUpdate: TemperatureUpdate = {
        region: region.name,
        temperature: Math.round((baseTemp + anomaly) * 10) / 10,
        anomaly: Math.round(anomaly * 10) / 10,
        coordinates: { lat: region.lat, lon: region.lon },
        timestamp: new Date().toISOString()
      };

      this.notifyListeners({
        type: 'temperature_update',
        data: temperatureUpdate,
        timestamp: new Date().toISOString(),
        region: region.name
      });

      // Occasionally trigger alerts for high temperatures
      if (temperatureUpdate.temperature > 28.5 && Math.random() < 0.3) {
        const alertUpdate: AlertUpdate = {
          id: `alert_${Date.now()}`,
          type: temperatureUpdate.temperature > 29.5 ? 'marine_heatwave' : 'temperature_spike',
          severity: temperatureUpdate.temperature > 29.5 ? 'critical' : 'high',
          region: region.name,
          temperature: temperatureUpdate.temperature,
          threshold: 27.5
        };

        this.notifyListeners({
          type: 'alert_triggered',
          data: alertUpdate,
          timestamp: new Date().toISOString(),
          region: region.name
        });
      }
    }, 30000); // Every 30 seconds

    // Send prediction updates every 5 minutes
    setInterval(() => {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const predictionUpdate = {
        region: region.name,
        predictedTemp: Math.round((27.5 + Math.random() * 3) * 10) / 10,
        confidence: Math.round((0.8 + Math.random() * 0.2) * 100),
        timeframe: '7days',
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      };

      this.notifyListeners({
        type: 'prediction_update',
        data: predictionUpdate,
        timestamp: new Date().toISOString(),
        region: region.name
      });
    }, 300000); // Every 5 minutes
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyListeners({
        type: 'connection_status',
        data: { status: 'failed', message: 'Max reconnection attempts reached' },
        timestamp: new Date().toISOString()
      });
    }
  }

  private notifyListeners(message: WebSocketMessage) {
    const typeListeners = this.listeners[message.type] || [];
    const allListeners = this.listeners['*'] || [];
    
    [...typeListeners, ...allListeners].forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('WebSocket listener error:', error);
      }
    });
  }

  subscribe(messageType: string | '*', callback: (message: WebSocketMessage) => void) {
    if (!this.listeners[messageType]) {
      this.listeners[messageType] = [];
    }
    
    this.listeners[messageType].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[messageType] = this.listeners[messageType].filter(
        listener => listener !== callback
      );
    };
  }

  unsubscribe(messageType: string, callback: (message: WebSocketMessage) => void) {
    if (this.listeners[messageType]) {
      this.listeners[messageType] = this.listeners[messageType].filter(
        listener => listener !== callback
      );
    }
  }

  send(message: WebSocketMessage) {
    // In a real implementation, this would send to the WebSocket server
    console.log('Sending WebSocket message:', message);
    
    // For demo, we can echo certain messages back
    if (message.type === 'connection_status') {
      setTimeout(() => {
        this.notifyListeners({
          type: 'connection_status',
          data: { status: 'pong', echo: message.data },
          timestamp: new Date().toISOString()
        });
      }, 100);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.notifyListeners({
      type: 'connection_status',
      data: { status: 'disconnected' },
      timestamp: new Date().toISOString()
    });
  }

  isConnected(): boolean {
    // In demo mode, we're always "connected" after initial connection
    return this.reconnectAttempts === 0 && !this.isConnecting;
  }

  getConnectionStatus(): string {
    if (this.isConnecting) return 'connecting';
    if (this.isConnected()) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }
}

// Create a singleton instance
export const websocketManager = new WebSocketManager();

// React hook for WebSocket subscriptions
export function useWebSocket(messageType: string | '*', callback: (message: WebSocketMessage) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const unsubscribe = websocketManager.subscribe(messageType, callback);
  
  // Auto-cleanup (in a real React hook, this would use useEffect)
  return unsubscribe;
}