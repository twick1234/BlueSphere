/**
 * Advanced Layer Management System
 *
 * Google Maps-style layer controls with sophisticated ocean data management,
 * opacity controls, blend modes, and custom layer creation capabilities.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { LayerDefinition, LayerHierarchy } from './OceanMapEngine'

export interface LayerGroup {
  id: string
  name: string
  icon: string
  description: string
  expanded: boolean
  layers: LayerDefinition[]
}

export interface CustomLayerConfig {
  name: string
  dataSource: string
  type: LayerDefinition['type']
  colorScale: string
  opacity: number
  blendMode: LayerDefinition['blendMode']
}

interface AdvancedLayerManagerProps {
  layerHierarchy: LayerHierarchy
  onLayerToggle: (layerId: string, visible: boolean) => void
  onLayerUpdate: (layerId: string, updates: Partial<LayerDefinition>) => void
  onCreateCustomLayer: (config: CustomLayerConfig) => void
  onSaveLayerPreset: (name: string, layerIds: string[]) => void
  onLoadLayerPreset: (presetName: string) => void
  isDarkMode: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

// Layer preset configurations
const LAYER_PRESETS = {
  'temperature-monitoring': {
    name: 'Temperature Monitoring',
    description: 'Focus on sea surface temperature and anomalies',
    icon: '🌡️',
    layers: ['ocean_base', 'sea_surface_temp', 'temp_anomalies', 'marine_heatwaves']
  },
  'climate-analysis': {
    name: 'Climate Analysis',
    description: 'Comprehensive climate impact assessment',
    icon: '🌍',
    layers: ['ocean_base', 'sea_surface_temp', 'temp_anomalies', 'marine_heatwaves', 'historical_comparison', 'seasonal_patterns']
  },
  'marine-ecosystem': {
    name: 'Marine Ecosystem Health',
    description: 'Biological and ecological monitoring',
    icon: '🐋',
    layers: ['ocean_base', 'chlorophyll_a', 'coral_reef_health', 'marine_protected_areas', 'wildlife_tracking']
  },
  'environmental-impact': {
    name: 'Environmental Impact',
    description: 'Human activities and pollution monitoring',
    icon: '⚠️',
    layers: ['ocean_base', 'shipping_density', 'pollution_sources', 'oil_spill_risk']
  },
  'oceanographic-research': {
    name: 'Oceanographic Research',
    description: 'Comprehensive data for scientific analysis',
    icon: '🔬',
    layers: ['bathymetry_3d', 'ocean_currents', 'sea_surface_temp', 'chlorophyll_a', 'ocean_ph']
  }
}

// Color scale options for custom layers
const COLOR_SCALES = {
  'temperature': {
    name: 'Temperature Scale',
    colors: ['#0066cc', '#00ccff', '#00ff66', '#ffff00', '#ff6600', '#cc0000'],
    description: 'Blue to red temperature gradient'
  },
  'diverging': {
    name: 'Diverging Scale',
    colors: ['#0066cc', '#ffffff', '#cc0000'],
    description: 'Centered diverging scale for anomalies'
  },
  'viridis': {
    name: 'Viridis',
    colors: ['#440154', '#31688e', '#35b779', '#fde725'],
    description: 'Perceptually uniform scale'
  },
  'chlorophyll': {
    name: 'Chlorophyll Scale',
    colors: ['#000080', '#0000ff', '#00ff00', '#ffff00', '#ff0000'],
    description: 'Ocean productivity visualization'
  },
  'bathymetry': {
    name: 'Bathymetry Scale',
    colors: ['#000080', '#0040ff', '#0080ff', '#40c0ff', '#80e0ff', '#c0f0ff'],
    description: 'Ocean depth visualization'
  }
}

export default function AdvancedLayerManager({
  layerHierarchy,
  onLayerToggle,
  onLayerUpdate,
  onCreateCustomLayer,
  onSaveLayerPreset,
  onLoadLayerPreset,
  isDarkMode,
  isCollapsed,
  onToggleCollapse,
  className = ''
}: AdvancedLayerManagerProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'presets' | 'custom'>('layers')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['ocean', 'environmental']))
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<'name' | 'type' | 'zIndex'>('zIndex')
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)
  const [customLayerConfig, setCustomLayerConfig] = useState<Partial<CustomLayerConfig>>({})
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)

  // Convert layer hierarchy to groups
  const layerGroups: LayerGroup[] = useMemo(() => [
    {
      id: 'base',
      name: 'Base Maps',
      icon: '🗺️',
      description: 'Foundational map layers',
      expanded: expandedGroups.has('base'),
      layers: layerHierarchy.base
    },
    {
      id: 'ocean',
      name: 'Ocean Data',
      icon: '🌊',
      description: 'Primary oceanographic datasets',
      expanded: expandedGroups.has('ocean'),
      layers: layerHierarchy.ocean
    },
    {
      id: 'environmental',
      name: 'Environmental',
      icon: '🌍',
      description: 'Environmental monitoring and events',
      expanded: expandedGroups.has('environmental'),
      layers: layerHierarchy.environmental
    },
    {
      id: 'biological',
      name: 'Marine Life',
      icon: '🐋',
      description: 'Biological and ecological data',
      expanded: expandedGroups.has('biological'),
      layers: layerHierarchy.biological
    },
    {
      id: 'human',
      name: 'Human Impact',
      icon: '🏭',
      description: 'Anthropogenic activities and impacts',
      expanded: expandedGroups.has('human'),
      layers: layerHierarchy.human
    },
    {
      id: 'temporal',
      name: 'Temporal Analysis',
      icon: '📅',
      description: 'Historical and comparative data',
      expanded: expandedGroups.has('temporal'),
      layers: layerHierarchy.temporal
    }
  ], [layerHierarchy, expandedGroups])

  // Filter and sort layers
  const filteredGroups = useMemo(() => {
    return layerGroups.map(group => ({
      ...group,
      layers: group.layers
        .filter(layer =>
          !searchQuery ||
          layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          layer.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          switch (sortMode) {
            case 'name': return a.name.localeCompare(b.name)
            case 'type': return a.type.localeCompare(b.type)
            case 'zIndex': return a.zIndex - b.zIndex
            default: return 0
          }
        })
    })).filter(group => group.layers.length > 0)
  }, [layerGroups, searchQuery, sortMode])

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }, [])

  // Handle layer property changes
  const handleLayerPropertyChange = useCallback((
    layerId: string,
    property: keyof LayerDefinition,
    value: any
  ) => {
    onLayerUpdate(layerId, { [property]: value })
  }, [onLayerUpdate])

  // Handle drag and drop for layer reordering
  const handleDragStart = useCallback((layerId: string) => {
    setDraggedLayer(layerId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((targetLayerId: string) => {
    if (draggedLayer && draggedLayer !== targetLayerId) {
      // Implement layer reordering logic
      console.log(`Reorder layer ${draggedLayer} relative to ${targetLayerId}`)
    }
    setDraggedLayer(null)
  }, [draggedLayer])

  // Render individual layer control
  const renderLayerControl = useCallback((layer: LayerDefinition, groupId: string) => {
    const isSelected = selectedLayers.has(layer.id)

    return (
      <div
        key={layer.id}
        className={`layer-item ${layer.visible ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''}`}
        draggable
        onDragStart={() => handleDragStart(layer.id)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(layer.id)}
      >
        <div className="layer-header">
          <div className="layer-info">
            <div className="layer-main">
              <span className="layer-icon">{layer.icon}</span>
              <div className="layer-text">
                <span className="layer-name">{layer.name}</span>
                <span className="layer-desc">{layer.description}</span>
              </div>
            </div>
            <div className="layer-meta">
              <span className="layer-type">{layer.type}</span>
              <span className="layer-frequency">{layer.updateFrequency}</span>
            </div>
          </div>

          <div className="layer-controls">
            <button
              className={`layer-toggle ${layer.visible ? 'on' : 'off'}`}
              onClick={() => onLayerToggle(layer.id, !layer.visible)}
              title={layer.visible ? 'Hide layer' : 'Show layer'}
            >
              <div className="toggle-track">
                <div className="toggle-thumb" />
              </div>
            </button>

            <button
              className="layer-settings"
              onClick={() => setSelectedLayers(prev => {
                const newSet = new Set(prev)
                if (newSet.has(layer.id)) {
                  newSet.delete(layer.id)
                } else {
                  newSet.add(layer.id)
                }
                return newSet
              })}
              title="Layer settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Advanced layer controls */}
        {isSelected && (
          <div className="layer-settings-panel">
            <div className="setting-group">
              <label>Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={layer.opacity}
                onChange={(e) => handleLayerPropertyChange(layer.id, 'opacity', parseFloat(e.target.value))}
                className="opacity-slider"
              />
              <span className="value-display">{Math.round(layer.opacity * 100)}%</span>
            </div>

            <div className="setting-group">
              <label>Blend Mode</label>
              <select
                value={layer.blendMode}
                onChange={(e) => handleLayerPropertyChange(layer.id, 'blendMode', e.target.value)}
                className="blend-select"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Z-Index</label>
              <input
                type="number"
                min="1"
                max="100"
                value={layer.zIndex}
                onChange={(e) => handleLayerPropertyChange(layer.id, 'zIndex', parseInt(e.target.value))}
                className="zindex-input"
              />
            </div>

            {layer.customProps && (
              <div className="custom-props">
                {Object.entries(layer.customProps).map(([key, value]) => (
                  <div key={key} className="custom-prop">
                    <label>{key}</label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => {
                        const newProps = { ...layer.customProps, [key]: e.target.value }
                        handleLayerPropertyChange(layer.id, 'customProps', newProps)
                      }}
                      className="prop-input"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }, [selectedLayers, handleDragStart, handleDragOver, handleDrop, onLayerToggle, handleLayerPropertyChange])

  // Render layer presets
  const renderPresets = useCallback(() => (
    <div className="presets-panel">
      <div className="presets-header">
        <h3>Layer Presets</h3>
        <p>Quick configurations for common use cases</p>
      </div>

      <div className="presets-grid">
        {Object.entries(LAYER_PRESETS).map(([key, preset]) => (
          <div
            key={key}
            className="preset-card"
            onClick={() => onLoadLayerPreset(key)}
          >
            <div className="preset-icon">{preset.icon}</div>
            <div className="preset-info">
              <h4>{preset.name}</h4>
              <p>{preset.description}</p>
              <span className="layer-count">{preset.layers.length} layers</span>
            </div>
          </div>
        ))}
      </div>

      <div className="preset-actions">
        <button
          className="save-preset-btn"
          onClick={() => {
            const activeLayers = Object.values(layerHierarchy)
              .flat()
              .filter(layer => layer.visible)
              .map(layer => layer.id)

            const presetName = prompt('Enter preset name:')
            if (presetName) {
              onSaveLayerPreset(presetName, activeLayers)
            }
          }}
        >
          💾 Save Current as Preset
        </button>
      </div>
    </div>
  ), [layerHierarchy, onLoadLayerPreset, onSaveLayerPreset])

  // Render custom layer creator
  const renderCustomLayerCreator = useCallback(() => (
    <div className="custom-layer-panel">
      <div className="custom-header">
        <h3>Create Custom Layer</h3>
        <p>Build your own data visualization layer</p>
      </div>

      <div className="custom-form">
        <div className="form-group">
          <label>Layer Name</label>
          <input
            type="text"
            value={customLayerConfig.name || ''}
            onChange={(e) => setCustomLayerConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter layer name"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Data Source URL</label>
          <input
            type="url"
            value={customLayerConfig.dataSource || ''}
            onChange={(e) => setCustomLayerConfig(prev => ({ ...prev, dataSource: e.target.value }))}
            placeholder="https://api.example.com/data"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Layer Type</label>
          <select
            value={customLayerConfig.type || 'heatmap'}
            onChange={(e) => setCustomLayerConfig(prev => ({ ...prev, type: e.target.value as LayerDefinition['type'] }))}
            className="form-select"
          >
            <option value="heatmap">Heat Map</option>
            <option value="point">Point Data</option>
            <option value="vector">Vector Data</option>
            <option value="raster">Raster Tiles</option>
          </select>
        </div>

        <div className="form-group">
          <label>Color Scale</label>
          <select
            value={customLayerConfig.colorScale || 'temperature'}
            onChange={(e) => setCustomLayerConfig(prev => ({ ...prev, colorScale: e.target.value }))}
            className="form-select"
          >
            {Object.entries(COLOR_SCALES).map(([key, scale]) => (
              <option key={key} value={key}>{scale.name}</option>
            ))}
          </select>

          <div className="color-preview">
            {COLOR_SCALES[customLayerConfig.colorScale as keyof typeof COLOR_SCALES]?.colors.map((color, i) => (
              <div
                key={i}
                className="color-swatch"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            className="create-layer-btn"
            onClick={() => {
              if (customLayerConfig.name && customLayerConfig.dataSource) {
                onCreateCustomLayer(customLayerConfig as CustomLayerConfig)
                setCustomLayerConfig({})
              }
            }}
            disabled={!customLayerConfig.name || !customLayerConfig.dataSource}
          >
            🎨 Create Layer
          </button>
        </div>
      </div>
    </div>
  ), [customLayerConfig, onCreateCustomLayer])

  return (
    <div className={`advanced-layer-manager ${isDarkMode ? 'dark' : 'light'} ${isCollapsed ? 'collapsed' : 'expanded'} ${className}`}>
      {/* Header */}
      <div className="manager-header">
        <div className="header-main">
          <h2>Layer Manager</h2>
          <button
            className="collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Search and controls */}
            <div className="manager-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search layers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                className="sort-select"
              >
                <option value="zIndex">Sort by Order</option>
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>

            {/* Tabs */}
            <div className="manager-tabs">
              <button
                className={`tab ${activeTab === 'layers' ? 'active' : ''}`}
                onClick={() => setActiveTab('layers')}
              >
                🗂️ Layers
              </button>
              <button
                className={`tab ${activeTab === 'presets' ? 'active' : ''}`}
                onClick={() => setActiveTab('presets')}
              >
                📋 Presets
              </button>
              <button
                className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveTab('custom')}
              >
                🎨 Custom
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="manager-content">
          {activeTab === 'layers' && (
            <div className="layers-panel">
              {filteredGroups.map(group => (
                <div key={group.id} className="layer-group">
                  <div
                    className="group-header"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span className="group-icon">{group.icon}</span>
                    <div className="group-info">
                      <span className="group-name">{group.name}</span>
                      <span className="group-desc">{group.description}</span>
                    </div>
                    <span className="expand-icon">
                      {group.expanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {group.expanded && (
                    <div className="group-layers">
                      {group.layers.map(layer => renderLayerControl(layer, group.id))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'presets' && renderPresets()}
          {activeTab === 'custom' && renderCustomLayerCreator()}
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .advanced-layer-manager {
          position: fixed;
          top: 80px;
          left: 20px;
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          max-height: calc(100vh - 120px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .advanced-layer-manager.collapsed {
          width: 60px;
        }

        .advanced-layer-manager.expanded {
          width: 420px;
        }

        .manager-header {
          padding: 20px;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .header-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: ${isCollapsed ? '0' : '16px'};
        }

        .header-main h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          ${isCollapsed ? 'display: none;' : ''}
        }

        .collapse-btn {
          background: none;
          border: none;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .collapse-btn:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .manager-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .search-box {
          position: relative;
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 8px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
        }

        .sort-select {
          padding: 10px 12px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 8px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
          min-width: 140px;
        }

        .manager-tabs {
          display: flex;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 10px;
          padding: 4px;
        }

        .tab {
          flex: 1;
          padding: 10px 12px;
          border: none;
          background: none;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .tab.active {
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
          color: ${isDarkMode ? '#60a5fa' : '#3b82f6'};
        }

        .manager-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .layer-group {
          margin-bottom: 16px;
          border-radius: 12px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          overflow: hidden;
        }

        .group-header {
          padding: 16px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .group-header:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .group-icon {
          font-size: 20px;
        }

        .group-info {
          flex: 1;
        }

        .group-name {
          display: block;
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          margin-bottom: 4px;
        }

        .group-desc {
          display: block;
          font-size: 12px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
        }

        .expand-icon {
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          transition: transform 0.2s;
        }

        .layer-item {
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          transition: all 0.2s;
        }

        .layer-item:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
        }

        .layer-item.selected {
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)'};
          border-left: 3px solid #3b82f6;
        }

        .layer-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .layer-info {
          flex: 1;
        }

        .layer-main {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }

        .layer-icon {
          font-size: 16px;
        }

        .layer-text {
          flex: 1;
        }

        .layer-name {
          display: block;
          font-weight: 500;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
          margin-bottom: 2px;
        }

        .layer-desc {
          display: block;
          font-size: 12px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          line-height: 1.3;
        }

        .layer-meta {
          display: flex;
          gap: 8px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .layer-type {
          color: ${isDarkMode ? '#60a5fa' : '#3b82f6'};
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
          padding: 2px 6px;
          border-radius: 4px;
        }

        .layer-frequency {
          color: ${isDarkMode ? '#34d399' : '#059669'};
          background: ${isDarkMode ? 'rgba(52, 211, 153, 0.1)' : 'rgba(5, 150, 105, 0.05)'};
          padding: 2px 6px;
          border-radius: 4px;
        }

        .layer-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .layer-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .toggle-track {
          width: 40px;
          height: 20px;
          border-radius: 10px;
          background: ${isDarkMode ? '#374151' : '#e5e7eb'};
          position: relative;
          transition: all 0.2s;
        }

        .layer-toggle.on .toggle-track {
          background: #22c55e;
        }

        .toggle-thumb {
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

        .layer-toggle.on .toggle-thumb {
          transform: translateX(20px);
        }

        .layer-settings {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .layer-settings:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .layer-settings-panel {
          padding: 16px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
          border-top: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .setting-group {
          margin-bottom: 16px;
        }

        .setting-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .opacity-slider,
        .zindex-input,
        .blend-select {
          width: 100%;
          padding: 8px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 6px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 12px;
        }

        .value-display {
          font-size: 11px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          margin-left: 8px;
        }

        .presets-panel {
          padding: 0;
        }

        .presets-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .presets-header h3 {
          margin: 0 0 8px 0;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        }

        .presets-header p {
          margin: 0;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          font-size: 14px;
        }

        .presets-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 24px;
        }

        .preset-card {
          padding: 16px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .preset-card:hover {
          border-color: #3b82f6;
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)'};
        }

        .preset-icon {
          font-size: 24px;
        }

        .preset-info h4 {
          margin: 0 0 4px 0;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
        }

        .preset-info p {
          margin: 0 0 8px 0;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          font-size: 12px;
          line-height: 1.4;
        }

        .layer-count {
          font-size: 10px;
          color: ${isDarkMode ? '#60a5fa' : '#3b82f6'};
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .save-preset-btn,
        .create-layer-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-preset-btn:hover,
        .create-layer-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .create-layer-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .custom-layer-panel {
          padding: 0;
        }

        .custom-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .custom-header h3 {
          margin: 0 0 8px 0;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        }

        .custom-header p {
          margin: 0;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 12px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 8px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
        }

        .color-preview {
          display: flex;
          gap: 2px;
          margin-top: 8px;
        }

        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
        }

        /* Scrollbar styling */
        .manager-content::-webkit-scrollbar {
          width: 6px;
        }

        .manager-content::-webkit-scrollbar-track {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .manager-content::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 3px;
        }

        .manager-content::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .advanced-layer-manager.expanded {
            width: calc(100vw - 40px);
            max-width: 380px;
          }

          .manager-controls {
            flex-direction: column;
          }

          .presets-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}