// Enhanced Layer Controls Component
// Matches PRD specification for layer management: SST, Anomaly, Currents toggle
import React, { useState, useCallback } from 'react'

export interface LayerState {
  sst: boolean
  anomaly: boolean  
  currents: boolean
  stations: boolean
  heatwaves: boolean
}

export interface LayerOptions {
  sstOpacity: number
  currentsDensity: number
  animationSpeed: number
  colorScheme: 'temperature' | 'anomaly' | 'scientific'
}

interface LayerControlsProps {
  layers: LayerState
  options: LayerOptions
  onLayerToggle: (layer: keyof LayerState, enabled: boolean) => void
  onOptionChange: (option: keyof LayerOptions, value: number | string) => void
  isDarkMode: boolean
  className?: string
}

const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  options,
  onLayerToggle,
  onOptionChange,
  isDarkMode,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'layers' | 'style' | 'animation'>('layers')

  // Layer definitions with metadata
  const layerDefinitions = {
    sst: {
      title: 'Sea Surface Temperature',
      description: 'Real-time temperature data from global monitoring stations',
      icon: '🌡️',
      color: '#ff6b35',
      dataSource: 'NDBC + International Networks'
    },
    anomaly: {
      title: 'Temperature Anomalies',
      description: 'Deviation from long-term climatological averages',
      icon: '📊',
      color: '#ff3366',
      dataSource: 'Calculated from ERSST v5 climatology'
    },
    currents: {
      title: 'Ocean Currents',
      description: 'Surface current velocities and directions',
      icon: '🌊',
      color: '#0066cc',
      dataSource: 'Global Ocean Observing System'
    },
    stations: {
      title: 'Monitoring Stations',
      description: 'Active buoy and platform locations',
      icon: '📍',
      color: '#00aa44',
      dataSource: '300+ global monitoring stations'
    },
    heatwaves: {
      title: 'Marine Heatwaves',
      description: 'Active extreme temperature events',
      icon: '🚨',
      color: '#cc0000',
      dataSource: 'Real-time anomaly detection'
    }
  }

  const toggleLayer = useCallback((layerKey: keyof LayerState) => {
    onLayerToggle(layerKey, !layers[layerKey])
  }, [layers, onLayerToggle])

  const renderLayerControl = (layerKey: keyof LayerState) => {
    const layer = layerDefinitions[layerKey]
    const isActive = layers[layerKey]
    
    return (
      <div key={layerKey} className={`layer-control-item ${isActive ? 'active' : 'inactive'}`}>
        <div className="layer-header" onClick={() => toggleLayer(layerKey)}>
          <div className="layer-info">
            <div className="layer-icon-title">
              <span className="layer-icon" style={{ color: layer.color }}>{layer.icon}</span>
              <span className="layer-title">{layer.title}</span>
            </div>
            <div className="layer-description">{layer.description}</div>
          </div>
          <div className="layer-toggle">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => toggleLayer(layerKey)}
              className="layer-checkbox"
            />
            <div className={`toggle-switch ${isActive ? 'on' : 'off'}`}>
              <div className="toggle-handle" />
            </div>
          </div>
        </div>
        
        {isActive && (
          <div className="layer-details">
            <div className="layer-metadata">
              <span className="data-source">Data: {layer.dataSource}</span>
              <span className="layer-status">● Live</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`layer-controls ${isDarkMode ? 'dark' : 'light'} ${className} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Control Header */}
      <div className="controls-header">
        <div className="header-content">
          <div className="header-title">
            <span className="controls-icon">🗺️</span>
            <span>Data Layers</span>
          </div>
          <button
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>
        
        {!isExpanded && (
          <div className="layer-indicators">
            {Object.entries(layers).map(([key, enabled]) => {
              if (!enabled) return null
              const layer = layerDefinitions[key as keyof LayerState]
              return (
                <span key={key} className="layer-indicator" style={{ color: layer.color }}>
                  {layer.icon}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="controls-content">
          {/* Tabs */}
          <div className="control-tabs">
            <button
              className={`tab ${activeTab === 'layers' ? 'active' : ''}`}
              onClick={() => setActiveTab('layers')}
            >
              Layers
            </button>
            <button
              className={`tab ${activeTab === 'style' ? 'active' : ''}`}
              onClick={() => setActiveTab('style')}
            >
              Style
            </button>
            <button
              className={`tab ${activeTab === 'animation' ? 'active' : ''}`}
              onClick={() => setActiveTab('animation')}
            >
              Animation
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'layers' && (
              <div className="layers-panel">
                {Object.keys(layerDefinitions).map((layerKey) =>
                  renderLayerControl(layerKey as keyof LayerState)
                )}
              </div>
            )}

            {activeTab === 'style' && (
              <div className="style-panel">
                <div className="style-control">
                  <label>Color Scheme</label>
                  <select
                    value={options.colorScheme}
                    onChange={(e) => onOptionChange('colorScheme', e.target.value)}
                    className="style-select"
                  >
                    <option value="temperature">Temperature Scale</option>
                    <option value="anomaly">Anomaly Scale</option>
                    <option value="scientific">Scientific Palette</option>
                  </select>
                </div>

                <div className="style-control">
                  <label>SST Layer Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={options.sstOpacity}
                    onChange={(e) => onOptionChange('sstOpacity', parseInt(e.target.value))}
                    className="style-slider"
                  />
                  <span className="slider-value">{options.sstOpacity}%</span>
                </div>

                <div className="style-control">
                  <label>Current Vector Density</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={options.currentsDensity}
                    onChange={(e) => onOptionChange('currentsDensity', parseInt(e.target.value))}
                    className="style-slider"
                  />
                  <span className="slider-value">Level {options.currentsDensity}</span>
                </div>
              </div>
            )}

            {activeTab === 'animation' && (
              <div className="animation-panel">
                <div className="animation-control">
                  <label>Animation Speed</label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={options.animationSpeed}
                    onChange={(e) => onOptionChange('animationSpeed', parseFloat(e.target.value))}
                    className="style-slider"
                  />
                  <span className="slider-value">{options.animationSpeed}x</span>
                </div>

                <div className="animation-info">
                  <p>🎬 Animation controls ocean current flow and temperature transitions</p>
                  <p>⚡ Higher speeds show more dynamic patterns</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button
              className="quick-action-btn"
              onClick={() => {
                onLayerToggle('sst', true)
                onLayerToggle('stations', true)
                onLayerToggle('anomaly', false)
                onLayerToggle('currents', false)
                onLayerToggle('heatwaves', false)
              }}
            >
              🌡️ Temperature View
            </button>
            <button
              className="quick-action-btn"
              onClick={() => {
                onLayerToggle('sst', true)
                onLayerToggle('anomaly', true)
                onLayerToggle('heatwaves', true)
                onLayerToggle('stations', true)
                onLayerToggle('currents', false)
              }}
            >
              🚨 Climate Alert View
            </button>
            <button
              className="quick-action-btn"
              onClick={() => {
                Object.keys(layers).forEach(key => {
                  onLayerToggle(key as keyof LayerState, true)
                })
              }}
            >
              📊 All Layers
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .layer-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(16px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          transition: all 0.3s ease;
          z-index: 1000;
          max-height: 80vh;
          overflow-y: auto;
        }

        .layer-controls.collapsed {
          width: 200px;
        }

        .layer-controls.expanded {
          width: 350px;
        }

        .controls-header {
          padding: 16px;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        }

        .expand-button {
          background: none;
          border: none;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .expand-button:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .layer-indicators {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .layer-indicator {
          font-size: 14px;
          opacity: 0.8;
        }

        .controls-content {
          padding: 16px;
        }

        .control-tabs {
          display: flex;
          margin-bottom: 16px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 8px;
          padding: 4px;
        }

        .tab {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: none;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .tab.active {
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
          color: ${isDarkMode ? '#60a5fa' : '#3b82f6'};
        }

        .layer-control-item {
          margin-bottom: 12px;
          border-radius: 8px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          transition: all 0.2s;
        }

        .layer-control-item:hover {
          border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .layer-control-item.active {
          background: ${isDarkMode ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.02)'};
          border-color: ${isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'};
        }

        .layer-header {
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }

        .layer-info {
          flex: 1;
        }

        .layer-icon-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .layer-title {
          font-weight: 500;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
        }

        .layer-description {
          font-size: 12px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          line-height: 1.4;
        }

        .layer-toggle {
          position: relative;
        }

        .layer-checkbox {
          opacity: 0;
          position: absolute;
        }

        .toggle-switch {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          background: ${isDarkMode ? '#374151' : '#e5e7eb'};
          transition: all 0.2s;
          position: relative;
          cursor: pointer;
        }

        .toggle-switch.on {
          background: #22c55e;
        }

        .toggle-handle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.on .toggle-handle {
          transform: translateX(20px);
        }

        .layer-details {
          padding: 0 12px 12px;
        }

        .layer-metadata {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
        }

        .layer-status {
          color: #22c55e;
        }

        .style-control {
          margin-bottom: 16px;
        }

        .style-control label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        }

        .style-select,
        .style-slider {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        }

        .slider-value {
          font-size: 12px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          margin-left: 8px;
        }

        .animation-info {
          margin-top: 16px;
          padding: 12px;
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)'};
          border-radius: 6px;
          border: 1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
        }

        .animation-info p {
          margin: 4px 0;
          font-size: 12px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .quick-action-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
          color: ${isDarkMode ? '#60a5fa' : '#3b82f6'};
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
          text-align: left;
        }

        .quick-action-btn:hover {
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
        }
      `}</style>
    </div>
  )
}

export default LayerControls