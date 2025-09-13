import React, { useState, useEffect } from 'react';
import { SignalIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/outline';
import { websocketManager, WebSocketMessage, TemperatureUpdate, AlertUpdate } from '../lib/websocket';

interface RealTimeStatusProps {
  isDarkMode: boolean;
  showCompact?: boolean;
}

interface RealtimeData {
  temperature: TemperatureUpdate[];
  alerts: AlertUpdate[];
  predictions: any[];
  connectionStatus: string;
  lastUpdate: string;
}

const RealTimeStatus: React.FC<RealTimeStatusProps> = ({ 
  isDarkMode, 
  showCompact = false 
}) => {
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    temperature: [],
    alerts: [],
    predictions: [],
    connectionStatus: 'connecting',
    lastUpdate: new Date().toISOString()
  });

  const [messageCount, setMessageCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(!showCompact);

  useEffect(() => {
    // Subscribe to all WebSocket messages
    const unsubscribe = websocketManager.subscribe('*', handleWebSocketMessage);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    setMessageCount(prev => prev + 1);
    setRealtimeData(prev => ({
      ...prev,
      lastUpdate: new Date().toISOString()
    }));

    switch (message.type) {
      case 'temperature_update':
        setRealtimeData(prev => ({
          ...prev,
          temperature: [
            message.data as TemperatureUpdate,
            ...prev.temperature.slice(0, 9) // Keep only last 10 updates
          ]
        }));
        break;

      case 'alert_triggered':
        setRealtimeData(prev => ({
          ...prev,
          alerts: [
            message.data as AlertUpdate,
            ...prev.alerts.slice(0, 4) // Keep only last 5 alerts
          ]
        }));
        break;

      case 'prediction_update':
        setRealtimeData(prev => ({
          ...prev,
          predictions: [
            message.data,
            ...prev.predictions.slice(0, 4) // Keep only last 5 predictions
          ]
        }));
        break;

      case 'connection_status':
        setRealtimeData(prev => ({
          ...prev,
          connectionStatus: message.data.status
        }));
        break;
    }
  };

  const getConnectionStatusColor = () => {
    switch (realtimeData.connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'reconnecting': return 'text-orange-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return time.toLocaleDateString();
  };

  const containerClass = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  if (showCompact && !isExpanded) {
    return (
      <div className={`rounded-lg border ${containerClass} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SignalIcon className={`h-5 w-5 ${getConnectionStatusColor()}`} />
            <span className={`text-sm font-medium ${textClass}`}>
              Real-time Updates
            </span>
            <span className={`text-xs ${secondaryTextClass}`}>
              {messageCount} messages
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className={`text-sm ${secondaryTextClass} hover:${textClass} transition-colors`}
          >
            Expand
          </button>
        </div>
        
        {realtimeData.temperature.length > 0 && (
          <div className="mt-2 flex items-center space-x-4">
            <span className={`text-xs ${secondaryTextClass}`}>Latest:</span>
            <span className={`text-sm font-medium ${textClass}`}>
              {realtimeData.temperature[0].region}: {realtimeData.temperature[0].temperature}°C
            </span>
            <span className={`text-xs ${secondaryTextClass}`}>
              {formatTimeAgo(realtimeData.temperature[0].timestamp)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${containerClass} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SignalIcon className={`h-6 w-6 ${getConnectionStatusColor()}`} />
          <h2 className={`text-xl font-semibold ${textClass}`}>
            Real-Time Ocean Monitor
          </h2>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            realtimeData.connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {realtimeData.connectionStatus.toUpperCase()}
          </span>
        </div>
        
        {showCompact && (
          <button
            onClick={() => setIsExpanded(false)}
            className={`text-sm ${secondaryTextClass} hover:${textClass} transition-colors`}
          >
            Collapse
          </button>
        )}
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-blue-600">{messageCount}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Total Messages</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-green-600">{realtimeData.temperature.length}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Temperature Updates</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-red-600">{realtimeData.alerts.length}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Active Alerts</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-purple-600">{realtimeData.predictions.length}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Prediction Updates</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Temperature Updates */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${textClass}`}>
            Latest Temperature Updates
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {realtimeData.temperature.length === 0 && (
              <div className={`text-center py-4 ${secondaryTextClass}`}>
                Waiting for temperature data...
              </div>
            )}
            
            {realtimeData.temperature.map((update, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${textClass}`}>
                      {update.region}
                    </div>
                    <div className={`text-sm ${secondaryTextClass}`}>
                      {update.coordinates.lat.toFixed(1)}°, {update.coordinates.lon.toFixed(1)}°
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${textClass}`}>
                      {update.temperature}°C
                    </div>
                    <div className={`text-sm ${update.anomaly > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {update.anomaly > 0 ? '+' : ''}{update.anomaly.toFixed(1)}°C
                    </div>
                  </div>
                </div>
                <div className={`text-xs ${secondaryTextClass} mt-2 flex items-center`}>
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {formatTimeAgo(update.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts & Predictions */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${textClass}`}>
            Recent Alerts & Updates
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {realtimeData.alerts.length === 0 && realtimeData.predictions.length === 0 && (
              <div className={`text-center py-4 ${secondaryTextClass}`}>
                No alerts or predictions yet...
              </div>
            )}

            {/* Alerts */}
            {realtimeData.alerts.map((alert, index) => (
              <div
                key={`alert-${index}`}
                className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                    <span className={`font-medium ${textClass}`}>Alert</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <div className={`text-sm ${textClass} mb-1`}>
                  {alert.region}: {alert.temperature}°C
                </div>
                <div className={`text-xs ${secondaryTextClass}`}>
                  {alert.type.replace('_', ' ')} - Threshold: {alert.threshold}°C
                </div>
              </div>
            ))}

            {/* Predictions */}
            {realtimeData.predictions.map((prediction, index) => (
              <div
                key={`prediction-${index}`}
                className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-purple-600 rounded-full"></div>
                    <span className={`font-medium ${textClass}`}>Prediction</span>
                  </div>
                  <span className={`text-xs ${secondaryTextClass}`}>
                    {prediction.confidence}% confidence
                  </span>
                </div>
                <div className={`text-sm ${textClass} mb-1`}>
                  {prediction.region}: {prediction.predictedTemp}°C
                </div>
                <div className={`text-xs ${secondaryTextClass}`}>
                  {prediction.timeframe} forecast - Risk: {prediction.riskLevel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Update Info */}
      <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} text-xs ${secondaryTextClass}`}>
        <div className="flex items-center justify-between">
          <span>Last update: {formatTimeAgo(realtimeData.lastUpdate)}</span>
          <span>Connection: {realtimeData.connectionStatus}</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStatus;