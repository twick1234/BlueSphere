import { useState, useEffect } from 'react'

interface Alert {
  id: string
  type: 'marine_heatwave' | 'temperature_spike' | 'anomaly_detected' | 'coral_bleaching_risk'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: {
    name: string
    lat: number
    lon: number
    stationId?: string
  }
  data: {
    temperature: number
    threshold: number
    duration?: string
    trend: 'increasing' | 'decreasing' | 'stable'
  }
  impact: {
    ecosystemRisk: string
    affectedSpecies: string[]
    recommendations: string[]
  }
  isActive: boolean
  createdAt: string
  resolvedAt?: string
  lastUpdated: string
}

interface AlertSummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  lastUpdated: string
}

interface AlertDashboardProps {
  isDarkMode?: boolean
  showCompact?: boolean
}

export default function AlertDashboard({ isDarkMode = false, showCompact = false }: AlertDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      setError(null)
      const response = await fetch('/api/alerts/active')
      if (!response.ok) throw new Error('Failed to fetch alerts')
      
      const data = await response.json()
      setAlerts(data.alerts)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '🔶'
      case 'low': return 'ℹ️'
      default: return '📊'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#2563eb'
      default: return '#6b7280'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'marine_heatwave': return '🌡️'
      case 'temperature_spike': return '📈'
      case 'anomaly_detected': return '🔍'
      case 'coral_bleaching_risk': return '🪸'
      default: return '📊'
    }
  }

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(alert => alert.severity === filter)

  if (loading) {
    return (
      <div className={`alert-dashboard ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading active alerts...</p>
        </div>
        <style jsx>{`
          .alert-dashboard {
            padding: 1rem;
            border-radius: 8px;
            background: ${isDarkMode ? '#1f2937' : '#ffffff'};
            color: ${isDarkMode ? '#f3f4f6' : '#111827'};
            border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          }
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 2rem;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`alert-dashboard ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="error-state">
          <span className="error-icon">❌</span>
          <p>Error loading alerts: {error}</p>
          <button onClick={fetchAlerts} className="retry-button">
            Try Again
          </button>
        </div>
        <style jsx>{`
          .alert-dashboard {
            padding: 1rem;
            border-radius: 8px;
            background: ${isDarkMode ? '#1f2937' : '#ffffff'};
            color: ${isDarkMode ? '#f3f4f6' : '#111827'};
            border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          }
          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 2rem;
          }
          .error-icon {
            font-size: 2rem;
          }
          .retry-button {
            padding: 0.5rem 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .retry-button:hover {
            background: #2563eb;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className={`alert-dashboard ${isDarkMode ? 'dark' : 'light'} ${showCompact ? 'compact' : ''}`}>
      <div className="dashboard-header">
        <h3>🚨 Active Ocean Alerts</h3>
        {summary && (
          <div className="alert-summary">
            <div className="summary-stat critical">
              <span className="stat-number">{summary.critical}</span>
              <span className="stat-label">Critical</span>
            </div>
            <div className="summary-stat high">
              <span className="stat-number">{summary.high}</span>
              <span className="stat-label">High</span>
            </div>
            <div className="summary-stat medium">
              <span className="stat-number">{summary.medium}</span>
              <span className="stat-label">Medium</span>
            </div>
            <div className="summary-stat low">
              <span className="stat-number">{summary.low}</span>
              <span className="stat-label">Low</span>
            </div>
          </div>
        )}
      </div>

      <div className="filter-controls">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button 
          className={filter === 'critical' ? 'active' : ''}
          onClick={() => setFilter('critical')}
        >
          🚨 Critical ({alerts.filter(a => a.severity === 'critical').length})
        </button>
        <button 
          className={filter === 'high' ? 'active' : ''}
          onClick={() => setFilter('high')}
        >
          ⚠️ High ({alerts.filter(a => a.severity === 'high').length})
        </button>
        <button 
          className={filter === 'medium' ? 'active' : ''}
          onClick={() => setFilter('medium')}
        >
          🔶 Medium ({alerts.filter(a => a.severity === 'medium').length})
        </button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <span className="no-alerts-icon">✅</span>
            <p>No {filter === 'all' ? '' : filter} alerts at this time</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id} 
              className="alert-card"
              onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
            >
              <div className="alert-header">
                <div className="alert-type">
                  <span className="type-icon">{getTypeIcon(alert.type)}</span>
                  <span className="severity-badge" style={{ backgroundColor: getSeverityColor(alert.severity) }}>
                    {getSeverityIcon(alert.severity)} {alert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="alert-time">
                  {new Date(alert.createdAt).toLocaleDateString()} • {alert.data.duration}
                </div>
              </div>
              
              <div className="alert-content">
                <h4 className="alert-title">{alert.title}</h4>
                <div className="alert-location">📍 {alert.location.name}</div>
                <div className="alert-data">
                  <span className="temperature">
                    🌡️ {alert.data.temperature}°C 
                    <span className="threshold">(threshold: {alert.data.threshold}°C)</span>
                  </span>
                  <span className="trend">
                    {alert.data.trend === 'increasing' ? '📈' : 
                     alert.data.trend === 'decreasing' ? '📉' : '→'} 
                    {alert.data.trend}
                  </span>
                </div>
              </div>

              {selectedAlert?.id === alert.id && (
                <div className="alert-details">
                  <div className="impact-section">
                    <h5>🔬 Ecosystem Impact</h5>
                    <p>{alert.impact.ecosystemRisk}</p>
                    
                    <h6>🐟 Affected Species</h6>
                    <div className="species-list">
                      {alert.impact.affectedSpecies.map(species => (
                        <span key={species} className="species-tag">{species}</span>
                      ))}
                    </div>
                    
                    <h6>💡 Recommendations</h6>
                    <ul className="recommendations">
                      {alert.impact.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .alert-dashboard {
          background: ${isDarkMode ? '#1f2937' : '#ffffff'};
          color: ${isDarkMode ? '#f3f4f6' : '#111827'};
          border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          border-radius: 12px;
          padding: 1.5rem;
          max-height: ${showCompact ? '400px' : '600px'};
          overflow-y: auto;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .dashboard-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .alert-summary {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .summary-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
          border-radius: 6px;
          min-width: 60px;
        }
        
        .summary-stat.critical {
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
        }
        
        .summary-stat.high {
          background: rgba(234, 88, 12, 0.1);
          color: #ea580c;
        }
        
        .summary-stat.medium {
          background: rgba(217, 119, 6, 0.1);
          color: #d97706;
        }
        
        .summary-stat.low {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
        }
        
        .stat-number {
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .stat-label {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        
        .filter-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        
        .filter-controls button {
          padding: 0.5rem 0.75rem;
          border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          background: ${isDarkMode ? '#374151' : '#f9fafb'};
          color: ${isDarkMode ? '#f3f4f6' : '#111827'};
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .filter-controls button:hover {
          background: ${isDarkMode ? '#4b5563' : '#f3f4f6'};
        }
        
        .filter-controls button.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .no-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          opacity: 0.7;
        }
        
        .no-alerts-icon {
          font-size: 3rem;
        }
        
        .alert-card {
          border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          background: ${isDarkMode ? '#374151' : '#f9fafb'};
        }
        
        .alert-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
        }
        
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .alert-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .type-icon {
          font-size: 1.25rem;
        }
        
        .severity-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }
        
        .alert-time {
          font-size: 0.875rem;
          opacity: 0.7;
        }
        
        .alert-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .alert-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .alert-location {
          font-size: 0.875rem;
          opacity: 0.8;
        }
        
        .alert-data {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .temperature {
          font-weight: 500;
        }
        
        .threshold {
          font-size: 0.875rem;
          opacity: 0.7;
          margin-left: 0.5rem;
        }
        
        .trend {
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .alert-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'};
        }
        
        .impact-section h5 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .impact-section h6 {
          margin: 1rem 0 0.5rem 0;
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0.8;
        }
        
        .impact-section p {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }
        
        .species-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .species-tag {
          padding: 0.25rem 0.5rem;
          background: ${isDarkMode ? '#4b5563' : '#e5e7eb'};
          border-radius: 4px;
          font-size: 0.75rem;
        }
        
        .recommendations {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.875rem;
          line-height: 1.4;
        }
        
        .recommendations li {
          margin-bottom: 0.25rem;
        }
        
        .compact {
          max-height: 300px;
        }
        
        @media (max-width: 768px) {
          .alert-dashboard {
            padding: 1rem;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .alert-summary {
            justify-content: space-around;
          }
          
          .alert-data {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}