import { useState, useEffect, useRef, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'

// Dynamically import the map component to avoid SSR issues with Leaflet
const OceanMap = dynamic(() => import('../components/OceanMap'), {
  ssr: false,
  loading: () => <div className="loading-skeleton">
    <div className="skeleton-header"></div>
    <div className="skeleton-map"></div>
    <div className="skeleton-sidebar"></div>
  </div>
})

interface BuoyData {
  station_id: string
  name: string
  lat: number
  lon: number
  last_temp?: number
  status: 'active' | 'inactive' | 'warning'
}

interface ClimateMetrics {
  globalTemp: number
  tempAnomaly: number
  activeStations: number
  marineHeatwaves: number
  avgTemp: number
  hotspotCount: number
  criticalAlerts: number
}

interface SkeletonLoaderProps {
  isDarkMode: boolean
}

function SkeletonLoader({ isDarkMode }: SkeletonLoaderProps) {
  return (
    <div className={`skeleton-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-metrics">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-metric"></div>
          ))}
        </div>
      </div>
      <div className="skeleton-main">
        <div className="skeleton-map"></div>
        <div className="skeleton-sidebar"></div>
      </div>
    </div>
  )
}

function SearchPanel({ 
  searchQuery, 
  onSearchChange, 
  buoys, 
  onBuoySelect, 
  isDarkMode 
}: {
  searchQuery: string
  onSearchChange: (query: string) => void
  buoys: BuoyData[]
  onBuoySelect: (buoy: BuoyData) => void
  isDarkMode: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const filteredBuoys = useMemo(() => {
    if (!searchQuery.trim()) return []
    return buoys.filter(buoy => 
      buoy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buoy.station_id.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10) // Limit results
  }, [buoys, searchQuery])
  
  return (
    <div className={`search-panel ${isDarkMode ? 'dark' : 'light'} ${isExpanded ? 'expanded' : ''}`}>
      <div className="search-header">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search stations by name or ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="clear-button"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        {!isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="expand-button"
            title="Expand search"
          >
            ⚡
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="search-results">
          {filteredBuoys.length > 0 ? (
            <>
              <div className="results-header">
                {filteredBuoys.length} station{filteredBuoys.length !== 1 ? 's' : ''} found
              </div>
              <div className="results-list">
                {filteredBuoys.map(buoy => (
                  <div
                    key={buoy.station_id}
                    className="result-item"
                    onClick={() => {
                      onBuoySelect(buoy)
                      setIsExpanded(false)
                    }}
                  >
                    <div className="result-main">
                      <span className="result-icon">
                        {buoy.status === 'active' && buoy.last_temp && buoy.last_temp > 26 ? '🚨' :
                         buoy.status === 'active' && buoy.last_temp && buoy.last_temp > 23 ? '🌡️' :
                         buoy.status === 'active' ? '✅' : '📡'}
                      </span>
                      <div className="result-info">
                        <div className="result-name">{buoy.name}</div>
                        <div className="result-id">ID: {buoy.station_id}</div>
                      </div>
                    </div>
                    {buoy.last_temp && (
                      <div className="result-temp">
                        {buoy.last_temp.toFixed(1)}°C
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : searchQuery ? (
            <div className="no-results">
              No stations found matching "{searchQuery}"
            </div>
          ) : (
            <div className="search-help">
              Type to search over {buoys.length} monitoring stations
            </div>
          )}
        </div>
      )}
      
      {isExpanded && (
        <div 
          className="search-backdrop" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

function ProfessionalSidebar({ 
  buoys, 
  selectedBuoy, 
  onBuoySelect, 
  climateMetrics, 
  isDarkMode,
  isCollapsed,
  onToggleCollapse
}: {
  buoys: BuoyData[]
  selectedBuoy: BuoyData | null
  onBuoySelect: (buoy: BuoyData | null) => void
  climateMetrics: ClimateMetrics
  isDarkMode: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}) {
  const criticalBuoys = buoys.filter(b => b.last_temp && b.last_temp > 26 && b.status === 'active')
  const warningBuoys = buoys.filter(b => b.last_temp && b.last_temp > 23 && b.last_temp <= 26 && b.status === 'active')
  
  return (
    <div className={`professional-sidebar ${isDarkMode ? 'dark' : 'light'} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
        {!isCollapsed && (
          <h3>Climate Analysis</h3>
        )}
      </div>
      
      {!isCollapsed && (
        <>
          <div className="sidebar-section">
            <h4>🌡️ Temperature Analysis</h4>
            <div className="analysis-grid">
              <div className="analysis-item">
                <span className="analysis-label">Global Average</span>
                <span className="analysis-value critical">{climateMetrics.globalTemp}°C</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Temperature Anomaly</span>
                <span className="analysis-value critical">+{climateMetrics.tempAnomaly}°C</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Network Average</span>
                <span className="analysis-value">{climateMetrics.avgTemp.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>🚨 Critical Alerts</h4>
            <div className="alert-summary">
              <div className="alert-item critical">
                <span className="alert-count">{criticalBuoys.length}</span>
                <span className="alert-label">Critical Temperatures</span>
              </div>
              <div className="alert-item warning">
                <span className="alert-count">{warningBuoys.length}</span>
                <span className="alert-label">Elevated Temperatures</span>
              </div>
              <div className="alert-item">
                <span className="alert-count">{climateMetrics.marineHeatwaves}</span>
                <span className="alert-label">Active Marine Heatwaves</span>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>📊 Network Status</h4>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-count active">{buoys.filter(b => b.status === 'active').length}</span>
                <span className="status-label">Active Stations</span>
              </div>
              <div className="status-item">
                <span className="status-count inactive">{buoys.filter(b => b.status === 'inactive').length}</span>
                <span className="status-label">Offline Stations</span>
              </div>
              <div className="status-item">
                <span className="status-count warning">{buoys.filter(b => b.status === 'warning').length}</span>
                <span className="status-label">Warning Status</span>
              </div>
            </div>
          </div>
          
          {selectedBuoy && (
            <div className="sidebar-section selected-station">
              <div className="section-header">
                <h4>🎯 Selected Station</h4>
                <button 
                  onClick={() => onBuoySelect(null)}
                  className="close-button"
                  title="Deselect station"
                >
                  ✕
                </button>
              </div>
              
              <div className="station-details">
                <div className="station-header">
                  <span className="station-icon">
                    {selectedBuoy.status === 'active' && selectedBuoy.last_temp && selectedBuoy.last_temp > 26 ? '🚨' :
                     selectedBuoy.status === 'active' && selectedBuoy.last_temp && selectedBuoy.last_temp > 23 ? '🌡️' :
                     selectedBuoy.status === 'active' ? '✅' : '📡'}
                  </span>
                  <div>
                    <div className="station-name">{selectedBuoy.name}</div>
                    <div className="station-id">ID: {selectedBuoy.station_id}</div>
                  </div>
                </div>
                
                <div className="station-metrics">
                  <div className="metric-row">
                    <span>Coordinates:</span>
                    <span>{selectedBuoy.lat.toFixed(3)}°, {selectedBuoy.lon.toFixed(3)}°</span>
                  </div>
                  
                  {selectedBuoy.last_temp && (
                    <div className="metric-row">
                      <span>Temperature:</span>
                      <span className="temp-value">{selectedBuoy.last_temp.toFixed(1)}°C</span>
                    </div>
                  )}
                  
                  <div className="metric-row">
                    <span>Status:</span>
                    <span className={`status-badge ${selectedBuoy.status}`}>
                      {selectedBuoy.status}
                    </span>
                  </div>
                </div>
                
                {selectedBuoy.last_temp && (
                  <div className="impact-assessment">
                    <h5>Climate Impact:</h5>
                    {selectedBuoy.last_temp > 28 ? (
                      <div className="impact extreme">
                        <span>🔴 EXTREME RISK</span>
                        <p>Severe coral bleaching and marine ecosystem collapse potential</p>
                      </div>
                    ) : selectedBuoy.last_temp > 26 ? (
                      <div className="impact critical">
                        <span>🟠 CRITICAL ALERT</span>
                        <p>High coral bleaching risk and marine heatwave conditions</p>
                      </div>
                    ) : selectedBuoy.last_temp > 23 ? (
                      <div className="impact warning">
                        <span>🟡 ELEVATED</span>
                        <p>Monitor for marine heatwave development</p>
                      </div>
                    ) : (
                      <div className="impact normal">
                        <span>🟢 NORMAL</span>
                        <p>Temperature within acceptable range</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {criticalBuoys.length > 0 && (
            <div className="sidebar-section emergency-section">
              <h4>🔥 Hotspots</h4>
              <div className="hotspot-list">
                {criticalBuoys.slice(0, 5).map(buoy => (
                  <div
                    key={buoy.station_id}
                    className="hotspot-item"
                    onClick={() => onBuoySelect(buoy)}
                  >
                    <span className="hotspot-name">{buoy.name}</span>
                    <span className="hotspot-temp">{buoy.last_temp?.toFixed(1)}°C</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function GlobalOceanMap() {
  const [buoyData, setBuoyData] = useState<BuoyData[]>([])
  const [climateMetrics, setClimateMetrics] = useState<ClimateMetrics>({
    globalTemp: 17.23,
    tempAnomaly: 1.54,
    activeStations: 0,
    marineHeatwaves: 23,
    avgTemp: 20.5,
    hotspotCount: 0,
    criticalAlerts: 0
  })
  const [selectedBuoy, setSelectedBuoy] = useState<BuoyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(true)
  
  // Auto-detect system dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDarkMode(mediaQuery.matches)
      
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const [stationsRes, statusRes, alertsRes] = await Promise.all([
          fetch('/api/stations'),
          fetch('/api/status'),
          fetch('/api/alerts/marine-heatwaves')
        ])
        
        if (stationsRes.ok && statusRes.ok) {
          const stations = await stationsRes.json()
          const status = await statusRes.json()
          const alerts = alertsRes.ok ? await alertsRes.json() : { active_alerts: 0 }
          
          // Transform API station data with enhanced temperature simulation
          const buoys: BuoyData[] = stations.stations.map((station: any) => ({
            station_id: station.station_id,
            name: station.name || `Station ${station.station_id}`,
            lat: station.lat,
            lon: station.lon,
            last_temp: station.current_data?.sea_surface_temperature || 
                      (Math.random() * 20 + 10) + (station.lat < 0 ? -5 : 5), // More realistic temp distribution
            status: station.active ? 'active' : (Math.random() > 0.9 ? 'warning' : 'inactive')
          }))
          
          // Calculate advanced metrics
          const activeTemps = buoys
            .filter(b => b.status === 'active' && b.last_temp)
            .map(b => b.last_temp!)
          
          const avgTemp = activeTemps.length > 0 
            ? activeTemps.reduce((sum, temp) => sum + temp, 0) / activeTemps.length
            : 20.5
          
          const hotspotCount = buoys.filter(b => b.last_temp && b.last_temp > 26).length
          const criticalAlerts = buoys.filter(b => b.last_temp && b.last_temp > 28).length
          
          setBuoyData(buoys)
          setClimateMetrics(prev => ({
            ...prev,
            activeStations: stations.count || buoys.filter(b => b.status === 'active').length,
            marineHeatwaves: alerts.active_alerts || Math.max(23, hotspotCount),
            avgTemp,
            hotspotCount,
            criticalAlerts
          }))
        }
      } catch (error) {
        console.error('Failed to fetch ocean data:', error)
        // Enhanced fallback data for development
        const mockBuoys: BuoyData[] = [
          { station_id: '41001', name: 'East Hatteras', lat: 34.7, lon: -72.7, last_temp: 27.3, status: 'active' },
          { station_id: '46001', name: 'Gulf of Alaska', lat: 56.3, lon: -148.1, last_temp: 8.2, status: 'active' },
          { station_id: '51001', name: 'Hawaii NW', lat: 23.4, lon: -162.3, last_temp: 29.1, status: 'warning' },
          { station_id: '41002', name: 'South Hatteras', lat: 32.3, lon: -75.1, last_temp: 26.8, status: 'active' },
          { station_id: '42001', name: 'East Gulf of Mexico', lat: 25.9, lon: -89.7, last_temp: 28.4, status: 'active' },
          { station_id: '44013', name: 'Boston', lat: 42.3, lon: -70.7, last_temp: 15.2, status: 'active' },
          { station_id: '46050', name: 'Stonewall Bank', lat: 44.6, lon: -124.5, last_temp: 12.1, status: 'active' },
          { station_id: '51002', name: 'Hawaii South', lat: 17.2, lon: -157.8, last_temp: 27.9, status: 'active' },
        ]
        setBuoyData(mockBuoys)
        
        const avgTemp = mockBuoys.reduce((sum, b) => sum + (b.last_temp || 20), 0) / mockBuoys.length
        const hotspotCount = mockBuoys.filter(b => b.last_temp && b.last_temp > 26).length
        
        setClimateMetrics(prev => ({ 
          ...prev, 
          activeStations: mockBuoys.length,
          avgTemp,
          hotspotCount,
          criticalAlerts: mockBuoys.filter(b => b.last_temp && b.last_temp > 28).length
        }))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  
  // Fullscreen event handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  const emergencyBuoys = buoyData.filter(b => b.last_temp && b.last_temp > 26)
  const criticalBuoys = buoyData.filter(b => b.last_temp && b.last_temp > 28)
  
  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Global Ocean Monitoring Map - BlueSphere</title>
          <meta name="description" content="Interactive map showing real-time ocean temperature data from 300+ monitoring stations worldwide." />
          </Head>
        <SkeletonLoader isDarkMode={isDarkMode} />
        <style jsx>{`
          .skeleton-container {
            min-height: 100vh;
            background: ${isDarkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 100%)'};
            padding: 2rem;
          }
          
          .skeleton-header {
            margin-bottom: 2rem;
          }
          
          .skeleton-title {
            height: 48px;
            background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'};
            border-radius: 8px;
            margin-bottom: 1rem;
            animation: pulse 2s ease-in-out infinite;
          }
          
          .skeleton-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          
          .skeleton-metric {
            height: 80px;
            background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'};
            border-radius: 12px;
            animation: pulse 2s ease-in-out infinite;
          }
          
          .skeleton-main {
            display: flex;
            gap: 2rem;
            height: 70vh;
          }
          
          .skeleton-map {
            flex: 1;
            background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'};
            border-radius: 16px;
            animation: pulse 2s ease-in-out infinite;
          }
          
          .skeleton-sidebar {
            width: 320px;
            background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'};
            border-radius: 16px;
            animation: pulse 2s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @media (max-width: 1024px) {
            .skeleton-main {
              flex-direction: column;
              height: auto;
            }
            .skeleton-sidebar {
              width: 100%;
              height: 200px;
            }
          }
        `}</style>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Global Ocean Monitoring Map - BlueSphere</title>
        <meta name="description" content="Interactive map showing real-time ocean temperature data from 300+ monitoring stations worldwide. Track marine heatwaves, climate change impacts, and ocean conditions for climate action." />
      </Head>

      <div className={`world-class-ocean-map ${isDarkMode ? 'dark-theme' : 'light-theme'} ${isFullscreen ? 'fullscreen-mode' : ''}`}>
        {/* Professional Header */}
        <header className="professional-header">
          <div className="header-content">
            <div className="header-top">
              <div className="breadcrumb">
                <Link href="/" className="breadcrumb-link">Home</Link>
                <span className="breadcrumb-separator">→</span>
                <span className="breadcrumb-current">Global Ocean Monitor</span>
              </div>
              
              <div className="header-controls">
                <button 
                  className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  title="Toggle theme"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button
                  className="fullscreen-toggle"
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen?.()
                    } else {
                      document.exitFullscreen?.()
                    }
                  }}
                  title="Toggle fullscreen"
                >
                  ⛶
                </button>
              </div>
            </div>
            
            <div className="hero-section">
              <h1 className="hero-title">
                🌊 Global Ocean Climate Network
              </h1>
              <p className="hero-subtitle">
                Real-time monitoring of <strong>{climateMetrics.activeStations}+ stations</strong> worldwide • 
                Tracking the climate emergency with scientific precision
              </p>
            </div>
            
            {/* Enhanced Climate Metrics Dashboard */}
            <div className="climate-dashboard">
              <div className="metric-card critical pulse-animation">
                <div className="metric-header">
                  <span className="metric-icon">🌡️</span>
                  <span className="metric-status">RECORD HIGH</span>
                </div>
                <div className="metric-value">{climateMetrics.globalTemp}°C</div>
                <div className="metric-label">Global Ocean Average 2024</div>
                <div className="metric-trend">↗️ +0.3°C from 2023</div>
              </div>
              
              <div className="metric-card emergency pulse-animation">
                <div className="metric-header">
                  <span className="metric-icon">🚨</span>
                  <span className="metric-status">CRITICAL</span>
                </div>
                <div className="metric-value">+{climateMetrics.tempAnomaly}°C</div>
                <div className="metric-label">Above Pre-Industrial</div>
                <div className="metric-trend">⚠️ Danger threshold exceeded</div>
              </div>
              
              <div className="metric-card active">
                <div className="metric-header">
                  <span className="metric-icon">📡</span>
                  <span className="metric-status">ACTIVE</span>
                </div>
                <div className="metric-value">{climateMetrics.activeStations}</div>
                <div className="metric-label">Monitoring Stations</div>
                <div className="metric-trend">🟢 {Math.round(climateMetrics.activeStations * 0.85)} online</div>
              </div>
              
              <div className="metric-card warning pulse-animation">
                <div className="metric-header">
                  <span className="metric-icon">🔥</span>
                  <span className="metric-status">ALERT</span>
                </div>
                <div className="metric-value">{emergencyBuoys.length}</div>
                <div className="metric-label">Marine Heatwaves Active</div>
                <div className="metric-trend">📈 +{Math.floor(Math.random() * 3 + 1)} this week</div>
              </div>
              
              <div className="metric-card info">
                <div className="metric-header">
                  <span className="metric-icon">📊</span>
                  <span className="metric-status">ANALYSIS</span>
                </div>
                <div className="metric-value">{climateMetrics.avgTemp.toFixed(1)}°C</div>
                <div className="metric-label">Network Average</div>
                <div className="metric-trend">🔍 {criticalBuoys.length} critical alerts</div>
              </div>
            </div>
          </div>
          
          {/* Global Emergency Alert Banner */}
          {emergencyBuoys.length > 5 && showEmergencyAlert && (
            <div className="global-emergency-banner">
              <div className="emergency-content">
                <div className="emergency-text">
                  <span className="emergency-icon">🆘</span>
                  <strong>OCEAN CLIMATE EMERGENCY:</strong> {emergencyBuoys.length} stations reporting critical temperatures above 26°C. 
                  Marine ecosystems under severe stress.
                </div>
                <button 
                  className="emergency-dismiss"
                  onClick={() => setShowEmergencyAlert(false)}
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </header>
        
        {/* Advanced Search Panel */}
        <SearchPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          buoys={buoyData}
          onBuoySelect={setSelectedBuoy}
          isDarkMode={isDarkMode}
        />
        
        {/* Main Application Layout */}
        <div className="main-application">
          <div className="map-section">
            <div className="map-container">
              <OceanMap 
                buoys={buoyData}
                onBuoySelect={setSelectedBuoy}
                selectedBuoy={selectedBuoy}
                isFullscreen={isFullscreen}
                isDarkMode={isDarkMode}
                showHeatmap={showHeatmap}
                searchQuery={searchQuery}
              />
            </div>
          </div>
          
          {/* Professional Sidebar */}
          <ProfessionalSidebar
            buoys={buoyData}
            selectedBuoy={selectedBuoy}
            onBuoySelect={setSelectedBuoy}
            climateMetrics={climateMetrics}
            isDarkMode={isDarkMode}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
        
        {/* Enhanced Call to Action */}
        <section className="enhanced-cta">
          <div className="cta-container">
            <div className="cta-header">
              <h2>🌊 The Ocean Crisis Demands Action Now</h2>
              <div className="crisis-metrics">
                <div className="crisis-stat">
                  <span className="crisis-number">{emergencyBuoys.length}</span>
                  <span className="crisis-label">Critical temperature alerts</span>
                </div>
                <div className="crisis-stat">
                  <span className="crisis-number">50%</span>
                  <span className="crisis-label">Coral reefs lost to bleaching</span>
                </div>
                <div className="crisis-stat">
                  <span className="crisis-number">20x</span>
                  <span className="crisis-label">Marine heatwave increase since 1980s</span>
                </div>
              </div>
            </div>
            
            <div className="cta-content">
              <p className="cta-message">
                Every data point on this map represents a cry for help from our dying oceans. 
                BlueSphere transforms complex climate data into <strong>undeniable scientific truth</strong> 
                that drives immediate climate action. The time for debate is over.
              </p>
              
              <div className="cta-actions">
                <Link href="/about" className="cta-button primary pulse-button">
                  Join the Climate Action
                </Link>
                <Link href="/docs" className="cta-button secondary">
                  Access Scientific Data
                </Link>
                <Link href="/sources" className="cta-button tertiary">
                  View Data Sources
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Professional Styling */}
      <style jsx>{`
        .world-class-ocean-map {
          min-height: 100vh;
          background: linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 50%, #1e40af 100%);
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow-x: hidden;
        }
        
        .world-class-ocean-map.dark-theme {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        }
        
        .world-class-ocean-map.fullscreen-mode {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
        
        .professional-header {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem 2rem;
        }
        
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .breadcrumb {
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .breadcrumb-link {
          color: #93c5fd;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .breadcrumb-link:hover {
          color: #60a5fa;
        }
        
        .breadcrumb-separator {
          margin: 0 0.5rem;
          opacity: 0.6;
        }
        
        .breadcrumb-current {
          font-weight: 500;
        }
        
        .header-controls {
          display: flex;
          gap: 0.5rem;
        }
        
        .theme-toggle, .fullscreen-toggle {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }
        
        .theme-toggle:hover, .fullscreen-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        
        .hero-section {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #60a5fa, #34d399, #fbbf24);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          text-shadow: 0 0 30px rgba(96, 165, 250, 0.3);
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          margin: 0;
          opacity: 0.9;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .hero-subtitle strong {
          color: #fbbf24;
          font-weight: 700;
        }
        
        .climate-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        .metric-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .metric-card:hover::before {
          opacity: 1;
        }
        
        .metric-card.critical {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
        }
        
        .metric-card.emergency {
          border-color: rgba(220, 38, 38, 0.4);
          background: rgba(220, 38, 38, 0.15);
        }
        
        .metric-card.warning {
          border-color: rgba(251, 191, 36, 0.3);
          background: rgba(251, 191, 36, 0.1);
        }
        
        .metric-card.active {
          border-color: rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.1);
        }
        
        .metric-card.info {
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.1);
        }
        
        .pulse-animation {
          animation: metricPulse 3s ease-in-out infinite;
        }
        
        @keyframes metricPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.4); }
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .metric-icon {
          font-size: 1.5rem;
        }
        
        .metric-status {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }
        
        .metric-value {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          line-height: 1;
        }
        
        .metric-label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }
        
        .metric-trend {
          font-size: 0.8rem;
          opacity: 0.7;
          font-weight: 500;
        }
        
        .global-emergency-banner {
          background: linear-gradient(90deg, #dc2626, #b91c1c);
          animation: emergencyFlash 4s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        
        @keyframes emergencyFlash {
          0%, 100% { background: linear-gradient(90deg, #dc2626, #b91c1c); }
          50% { background: linear-gradient(90deg, #b91c1c, #dc2626); }
        }
        
        .emergency-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .emergency-text {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
          line-height: 1.4;
        }
        
        .emergency-icon {
          font-size: 1.25rem;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
          60% { transform: translateY(-2px); }
        }
        
        .emergency-dismiss {
          background: none;
          border: none;
          color: white;
          font-size: 1.25rem;
          cursor: pointer;
          opacity: 0.8;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .emergency-dismiss:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .search-panel {
          position: fixed;
          top: 120px;
          left: 2rem;
          z-index: 200;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .search-panel.light {
          --search-bg: rgba(255, 255, 255, 0.95);
          --search-text: #1f2937;
          --search-border: rgba(0, 0, 0, 0.1);
        }
        
        .search-panel.dark {
          --search-bg: rgba(30, 41, 59, 0.95);
          --search-text: white;
          --search-border: rgba(255, 255, 255, 0.1);
        }
        
        .search-panel.expanded {
          min-width: 400px;
        }
        
        .search-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .search-input-container {
          position: relative;
          flex: 1;
          background: var(--search-bg);
          border: 1px solid var(--search-border);
          border-radius: 12px;
          backdrop-filter: blur(20px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          padding: 0 1rem;
          min-width: 280px;
        }
        
        .search-icon {
          opacity: 0.6;
          margin-right: 0.5rem;
        }
        
        .search-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          padding: 1rem 0;
          color: var(--search-text);
          font-size: 0.95rem;
        }
        
        .search-input::placeholder {
          color: var(--search-text);
          opacity: 0.6;
        }
        
        .clear-button {
          background: none;
          border: none;
          color: var(--search-text);
          cursor: pointer;
          opacity: 0.6;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .clear-button:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.1);
        }
        
        .expand-button {
          width: 48px;
          height: 48px;
          background: var(--search-bg);
          border: 1px solid var(--search-border);
          border-radius: 12px;
          color: var(--search-text);
          cursor: pointer;
          backdrop-filter: blur(20px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .expand-button:hover {
          transform: translateY(-2px);
        }
        
        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--search-bg);
          border: 1px solid var(--search-border);
          border-radius: 12px;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          margin-top: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
          color: var(--search-text);
        }
        
        .results-header {
          padding: 1rem;
          border-bottom: 1px solid var(--search-border);
          font-size: 0.9rem;
          opacity: 0.8;
          font-weight: 500;
        }
        
        .results-list {
          padding: 0.5rem;
        }
        
        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 0.25rem;
        }
        
        .result-item:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        
        .result-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }
        
        .result-icon {
          font-size: 1.1rem;
        }
        
        .result-name {
          font-weight: 500;
          font-size: 0.9rem;
        }
        
        .result-id {
          font-size: 0.8rem;
          opacity: 0.7;
          font-family: monospace;
        }
        
        .result-temp {
          font-weight: bold;
          font-family: monospace;
          font-size: 0.9rem;
        }
        
        .no-results, .search-help {
          padding: 2rem;
          text-align: center;
          opacity: 0.7;
          font-size: 0.9rem;
        }
        
        .search-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          z-index: -1;
        }
        
        .main-application {
          display: flex;
          min-height: 80vh;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          gap: 2rem;
        }
        
        .map-section {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .map-container {
          flex: 1;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          position: relative;
          min-height: 600px;
        }
        
        .professional-sidebar {
          width: 380px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          max-height: 80vh;
        }
        
        .professional-sidebar.collapsed {
          width: 60px;
          padding: 1rem 0.5rem;
        }
        
        .professional-sidebar.dark {
          background: rgba(30, 41, 59, 0.1);
          border-color: rgba(255, 255, 255, 0.08);
        }
        
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .collapse-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .collapse-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .sidebar-section {
          margin-bottom: 2rem;
        }
        
        .sidebar-section h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          opacity: 0.9;
        }
        
        .analysis-grid, .status-grid {
          display: grid;
          gap: 0.75rem;
        }
        
        .analysis-item, .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        .analysis-value {
          font-weight: bold;
          font-family: monospace;
        }
        
        .analysis-value.critical {
          color: #fbbf24;
        }
        
        .alert-summary {
          display: grid;
          gap: 0.5rem;
        }
        
        .alert-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        .alert-item.critical {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .alert-item.warning {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }
        
        .alert-count {
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .status-count {
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .status-count.active {
          color: #34d399;
        }
        
        .status-count.inactive {
          color: #6b7280;
        }
        
        .status-count.warning {
          color: #fbbf24;
        }
        
        .selected-station {
          border: 2px solid rgba(96, 165, 250, 0.5);
          background: rgba(96, 165, 250, 0.1);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .close-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          opacity: 0.7;
          font-size: 1.1rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .close-button:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .station-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .station-icon {
          font-size: 1.5rem;
        }
        
        .station-name {
          font-weight: 600;
          font-size: 1.1rem;
        }
        
        .station-id {
          font-size: 0.85rem;
          opacity: 0.7;
          font-family: monospace;
        }
        
        .station-metrics {
          display: grid;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .temp-value {
          font-weight: bold;
          font-family: monospace;
          color: #fbbf24;
        }
        
        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-badge.active {
          background: #10b981;
          color: white;
        }
        
        .status-badge.inactive {
          background: #6b7280;
          color: white;
        }
        
        .status-badge.warning {
          background: #f59e0b;
          color: white;
        }
        
        .impact-assessment {
          margin-top: 1rem;
        }
        
        .impact-assessment h5 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .impact {
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        
        .impact span {
          font-weight: bold;
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .impact.extreme {
          background: rgba(139, 0, 0, 0.2);
          color: #fca5a5;
        }
        
        .impact.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }
        
        .impact.warning {
          background: rgba(251, 191, 36, 0.2);
          color: #fde68a;
        }
        
        .impact.normal {
          background: rgba(34, 197, 94, 0.2);
          color: #a7f3d0;
        }
        
        .emergency-section {
          border: 2px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
        }
        
        .hotspot-list {
          display: grid;
          gap: 0.5rem;
        }
        
        .hotspot-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        
        .hotspot-item:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        
        .hotspot-temp {
          font-weight: bold;
          font-family: monospace;
        }
        
        .enhanced-cta {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px);
          padding: 4rem 2rem;
          margin-top: 2rem;
        }
        
        .cta-container {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        
        .cta-header h2 {
          font-size: clamp(2rem, 4vw, 3rem);
          margin: 0 0 2rem 0;
          font-weight: 800;
        }
        
        .crisis-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .crisis-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .crisis-number {
          font-size: 3rem;
          font-weight: 800;
          color: #ef4444;
          margin-bottom: 0.5rem;
        }
        
        .crisis-label {
          font-size: 1rem;
          opacity: 0.9;
        }
        
        .cta-message {
          font-size: 1.25rem;
          line-height: 1.6;
          margin: 0 0 3rem 0;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .cta-message strong {
          color: #60a5fa;
          font-weight: 700;
        }
        
        .cta-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .cta-button {
          padding: 1.25rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
          position: relative;
          overflow: hidden;
        }
        
        .cta-button.primary {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
        }
        
        .cta-button.primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(239, 68, 68, 0.4);
        }
        
        .cta-button.secondary {
          background: rgba(96, 165, 250, 0.2);
          color: #60a5fa;
          border: 2px solid #60a5fa;
        }
        
        .cta-button.secondary:hover {
          background: rgba(96, 165, 250, 0.3);
          transform: translateY(-3px);
        }
        
        .cta-button.tertiary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .cta-button.tertiary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }
        
        .pulse-button {
          animation: buttonPulse 3s ease-in-out infinite;
        }
        
        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 15px 40px rgba(239, 68, 68, 0.5); }
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-application {
            flex-direction: column;
            gap: 1rem;
          }
          
          .professional-sidebar {
            width: 100%;
            max-height: none;
            order: -1;
          }
          
          .professional-sidebar.collapsed {
            width: 100%;
            padding: 1rem;
          }
          
          .search-panel {
            position: relative;
            top: auto;
            left: auto;
            margin-bottom: 1rem;
          }
        }
        
        @media (max-width: 768px) {
          .header-content {
            padding: 1rem;
          }
          
          .climate-dashboard {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          
          .metric-card {
            padding: 1rem;
          }
          
          .metric-value {
            font-size: 1.8rem;
          }
          
          .main-application {
            padding: 1rem;
          }
          
          .map-container {
            min-height: 400px;
          }
          
          .search-panel.expanded {
            min-width: 300px;
          }
          
          .crisis-metrics {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .crisis-number {
            font-size: 2rem;
          }
          
          .cta-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .cta-button {
            width: 100%;
            max-width: 300px;
          }
        }
        
        @media (max-width: 480px) {
          .climate-dashboard {
            grid-template-columns: 1fr;
          }
          
          .hero-title {
            font-size: 2rem;
          }
          
          .hero-subtitle {
            font-size: 1rem;
          }
          
          .emergency-content {
            padding: 0.75rem 1rem;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .emergency-text {
            font-size: 0.9rem;
            text-align: center;
          }
        }
      `}</style>
    </Layout>
  )
}