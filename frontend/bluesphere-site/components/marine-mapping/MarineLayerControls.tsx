/*
 * BlueSphere Marine Layer Controls
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Advanced Google Maps-style layer control panel with filtering and presets
 */

import React, { useState, useCallback } from 'react'
import { MarineMapLayer } from './MarineMapEngine'

interface MarineLayerControlsProps {
  layers: MarineMapLayer[]
  onLayerToggle: (layerId: string, enabled?: boolean) => void
  onLayerUpdate: (layerId: string, updates: Partial<MarineMapLayer>) => void
  onPresetApply: (preset: string) => void
  darkMode: boolean
  performanceMode: boolean
}

interface LayerPreset {
  id: string
  name: string
  description: string
  icon: string
  layers: string[]
}

const LAYER_PRESETS: LayerPreset[] = [
  {
    id: 'tracking',
    name: 'Tracking Focus',
    description: 'Shark movements and research stations',
    icon: '🎯',
    layers: ['shark-tracking', 'research-stations']
  },
  {
    id: 'conservation',
    name: 'Conservation View',
    description: 'Protected areas and critical habitats',
    icon: '🛡️',
    layers: ['marine-protected-areas', 'conservation-zones', 'shark-tracking']
  },
  {
    id: 'environmental',
    name: 'Environmental Data',
    description: 'Temperature and oceanographic conditions',
    icon: '🌊',
    layers: ['ocean-temperature', 'shark-tracking', 'research-stations']
  },
  {
    id: 'maritime',
    name: 'Maritime Activity',
    description: 'Shipping routes and infrastructure',
    icon: '🚢',
    layers: ['shipping-routes', 'research-stations']
  },
  {
    id: 'all',
    name: 'Complete View',
    description: 'All available data layers',
    icon: '📊',
    layers: ['shark-tracking', 'marine-protected-areas', 'ocean-temperature', 'conservation-zones', 'research-stations', 'shipping-routes']
  }
]

const MarineLayerControls: React.FC<MarineLayerControlsProps> = ({
  layers,
  onLayerToggle,
  onLayerUpdate,
  onPresetApply,
  darkMode,
  performanceMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'layers' | 'presets' | 'settings'>('layers')

  // Group layers by category
  const layersByCategory = layers.reduce((acc, layer) => {
    if (!acc[layer.category]) {
      acc[layer.category] = []
    }
    acc[layer.category].push(layer)
    return acc
  }, {} as Record<string, MarineMapLayer[]>)

  const categoryOrder = ['tracking', 'environmental', 'conservation', 'infrastructure']
  const categoryIcons = {
    tracking: '🎯',
    environmental: '🌊',
    conservation: '🛡️',
    infrastructure: '🏗️'
  }

  const categoryNames = {
    tracking: 'Tracking',
    environmental: 'Environmental',
    conservation: 'Conservation',
    infrastructure: 'Infrastructure'
  }

  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    onLayerUpdate(layerId, { opacity: opacity / 100 })
  }, [onLayerUpdate])

  const enabledLayersCount = layers.filter(layer => layer.enabled).length

  return (
    <div className={`marine-layer-controls ${darkMode ? 'dark' : 'light'} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Control Header */}
      <div className="controls-header">
        <div className="header-content">
          <div className="header-title">
            <span className="controls-icon">🗺️</span>
            <span>Data Layers</span>
            {enabledLayersCount > 0 && (
              <span className="layer-count">({enabledLayersCount})</span>
            )}
          </div>
          <button
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>

        {/* Active layer indicators when collapsed */}
        {!isExpanded && enabledLayersCount > 0 && (
          <div className="layer-indicators">
            {layers.filter(layer => layer.enabled).slice(0, 6).map(layer => (
              <span key={layer.id} className="layer-indicator" title={layer.name}>
                {layer.icon}
              </span>
            ))}
            {enabledLayersCount > 6 && (
              <span className="layer-indicator more">+{enabledLayersCount - 6}</span>
            )}
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
              <span>📋</span>
              Layers
            </button>
            <button
              className={`tab ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              <span>⚡</span>
              Presets
            </button>
            <button
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span>⚙️</span>
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Layers Tab */}
            {activeTab === 'layers' && (
              <div className="layers-panel">
                {categoryOrder.map(categoryKey => {
                  const categoryLayers = layersByCategory[categoryKey] || []
                  if (categoryLayers.length === 0) return null

                  return (
                    <div key={categoryKey} className="layer-category">
                      <div className="category-header">
                        <span className="category-icon">{categoryIcons[categoryKey]}</span>
                        <span className="category-name">{categoryNames[categoryKey]}</span>
                        <span className="category-count">
                          ({categoryLayers.filter(l => l.enabled).length}/{categoryLayers.length})
                        </span>
                      </div>

                      <div className="category-layers">
                        {categoryLayers.map(layer => (
                          <div key={layer.id} className={`layer-control-item ${layer.enabled ? 'enabled' : 'disabled'}`}>
                            <div className="layer-header" onClick={() => onLayerToggle(layer.id)}>
                              <div className="layer-info">
                                <div className="layer-icon-title">
                                  <span className="layer-icon">{layer.icon}</span>
                                  <span className="layer-title">{layer.name}</span>
                                </div>
                                <div className="layer-description">{layer.description}</div>
                              </div>
                              <div className="layer-toggle">
                                <div className={`toggle-switch ${layer.enabled ? 'on' : 'off'}`}>
                                  <div className="toggle-handle" />
                                </div>
                              </div>
                            </div>

                            {layer.enabled && (
                              <div className="layer-controls">
                                <div className="opacity-control">
                                  <label>
                                    <span>Opacity</span>
                                    <input
                                      type="range"
                                      min="10"
                                      max="100"
                                      value={Math.round(layer.opacity * 100)}
                                      onChange={(e) => handleOpacityChange(layer.id, parseInt(e.target.value))}
                                      className="opacity-slider"
                                    />
                                    <span className="opacity-value">{Math.round(layer.opacity * 100)}%</span>
                                  </label>
                                </div>

                                <div className="layer-metadata">
                                  <div className="metadata-item">
                                    <span className="metadata-label">Source:</span>
                                    <span className="metadata-value">{layer.dataSource}</span>
                                  </div>
                                  {layer.refreshInterval && (
                                    <div className="metadata-item">
                                      <span className="metadata-label">Updates:</span>
                                      <span className="metadata-value">
                                        Every {Math.round(layer.refreshInterval / 60000)}m
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Presets Tab */}
            {activeTab === 'presets' && (
              <div className="presets-panel">
                <div className="presets-description">
                  <p>Quick layer combinations for different use cases:</p>
                </div>

                <div className="presets-grid">
                  {LAYER_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      className="preset-card"
                      onClick={() => onPresetApply(preset.id)}
                    >
                      <div className="preset-icon">{preset.icon}</div>
                      <div className="preset-info">
                        <div className="preset-name">{preset.name}</div>
                        <div className="preset-description">{preset.description}</div>
                        <div className="preset-layers">
                          {preset.layers.length} layer{preset.layers.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="preset-actions">
                  <button
                    className="preset-action-btn clear"
                    onClick={() => onPresetApply('clear')}
                  >
                    🚫 Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="settings-panel">
                <div className="settings-group">
                  <h4>Performance</h4>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">Performance Mode</span>
                      <span className="setting-description">
                        {performanceMode ? 'Enabled - Reduced data for better performance' : 'Disabled - Full data quality'}
                      </span>
                    </div>
                    <div className="setting-status">
                      {performanceMode ? '⚡ ON' : '🔋 OFF'}
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Layer Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-value">{layers.length}</span>
                      <span className="stat-label">Total Layers</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{enabledLayersCount}</span>
                      <span className="stat-label">Active</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {layers.filter(l => l.refreshInterval).length}
                      </span>
                      <span className="stat-label">Real-time</span>
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Data Sources</h4>
                  <div className="data-sources">
                    {Array.from(new Set(layers.map(l => l.dataSource))).map((source, index) => (
                      <div key={index} className="data-source-item">
                        <span className="source-indicator">📊</span>
                        <span className="source-name">{source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .marine-layer-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          background: ${darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(16px);
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          transition: all 0.3s ease;
          z-index: 1000;
          max-height: 80vh;
          overflow-y: auto;
          max-width: 90vw;
        }

        .marine-layer-controls.collapsed {
          width: 250px;
        }

        .marine-layer-controls.expanded {
          width: 400px;
        }

        .controls-header {
          padding: 16px;
          border-bottom: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
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
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
        }

        .layer-count {
          font-size: 0.8rem;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
          font-weight: 400;
        }

        .expand-button {
          background: none;
          border: none;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          font-size: 16px;
        }

        .expand-button:hover {
          background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .layer-indicators {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .layer-indicator {
          font-size: 14px;
          opacity: 0.8;
          padding: 2px 4px;
          border-radius: 4px;
          background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .layer-indicator.more {
          font-size: 12px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .controls-content {
          padding: 16px;
        }

        .control-tabs {
          display: flex;
          margin-bottom: 16px;
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 8px;
          padding: 4px;
        }

        .tab {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: none;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: center;
        }

        .tab.active {
          background: ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
          color: ${darkMode ? '#60a5fa' : '#3b82f6'};
        }

        .layer-category {
          margin-bottom: 16px;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding: 8px;
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
          border-radius: 6px;
        }

        .category-name {
          font-weight: 600;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 0.9rem;
          flex: 1;
        }

        .category-count {
          font-size: 0.8rem;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .layer-control-item {
          margin-bottom: 8px;
          border-radius: 8px;
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          transition: all 0.2s;
        }

        .layer-control-item:hover {
          border-color: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .layer-control-item.enabled {
          background: ${darkMode ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.02)'};
          border-color: ${darkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'};
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
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
        }

        .layer-description {
          font-size: 12px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
          line-height: 1.4;
        }

        .toggle-switch {
          width: 40px;
          height: 20px;
          border-radius: 10px;
          background: ${darkMode ? '#374151' : '#e5e7eb'};
          transition: all 0.2s;
          position: relative;
          cursor: pointer;
        }

        .toggle-switch.on {
          background: #22c55e;
        }

        .toggle-handle {
          width: 16px;
          height: 16px;
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

        .layer-controls {
          padding: 0 12px 12px;
          border-top: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          margin-top: 8px;
          padding-top: 12px;
        }

        .opacity-control {
          margin-bottom: 12px;
        }

        .opacity-control label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .opacity-slider {
          flex: 1;
          margin: 0 8px;
        }

        .opacity-value {
          min-width: 35px;
          text-align: right;
          font-weight: 500;
        }

        .layer-metadata {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metadata-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .metadata-label {
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .metadata-value {
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          font-weight: 500;
        }

        .presets-description {
          margin-bottom: 16px;
        }

        .presets-description p {
          margin: 0;
          font-size: 14px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .presets-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .preset-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 8px;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .preset-card:hover {
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
          border-color: ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
        }

        .preset-icon {
          font-size: 24px;
          min-width: 32px;
          text-align: center;
        }

        .preset-info {
          flex: 1;
        }

        .preset-name {
          font-weight: 600;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
          margin-bottom: 2px;
        }

        .preset-description {
          font-size: 12px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
          margin-bottom: 4px;
        }

        .preset-layers {
          font-size: 11px;
          color: ${darkMode ? '#64748b' : '#9ca3af'};
        }

        .preset-actions {
          display: flex;
          gap: 8px;
        }

        .preset-action-btn {
          flex: 1;
          padding: 8px;
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 6px;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .preset-action-btn:hover {
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
        }

        .preset-action-btn.clear {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .settings-group {
          margin-bottom: 20px;
        }

        .settings-group h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .setting-info {
          flex: 1;
        }

        .setting-name {
          display: block;
          font-weight: 500;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 13px;
          margin-bottom: 2px;
        }

        .setting-description {
          font-size: 11px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .setting-status {
          font-size: 12px;
          font-weight: 600;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stat-item {
          text-align: center;
          padding: 8px;
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
          border-radius: 6px;
        }

        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: ${darkMode ? '#94a3b8' : '#64748b'};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .data-sources {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .data-source-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
          border-radius: 4px;
        }

        .source-name {
          font-size: 12px;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
        }

        @media (max-width: 768px) {
          .marine-layer-controls {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }

          .marine-layer-controls.expanded {
            width: auto;
          }

          .marine-layer-controls.collapsed {
            width: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default MarineLayerControls