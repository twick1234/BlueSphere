import { useState, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues with Leaflet
const OceanMap = dynamic(() => import('../components/OceanMap'), {
  ssr: false,
  loading: () => <div className="loading">Loading ocean data visualization...</div>
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
}

export default function Home() {
  const [buoyData, setBuoyData] = useState<BuoyData[]>([])
  const [climateMetrics, setClimateMetrics] = useState<ClimateMetrics>({
    globalTemp: 16.8,
    tempAnomaly: 1.2,
    activeStations: 0,
    marineHeatwaves: 5
  })
  const [selectedBuoy, setSelectedBuoy] = useState<BuoyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch data from our API
    const fetchData = async () => {
      try {
        const [stationsRes, statusRes] = await Promise.all([
          fetch('http://localhost:8000/stations'),
          fetch('http://localhost:8000/status')
        ])
        
        if (stationsRes.ok && statusRes.ok) {
          const stations = await stationsRes.json()
          const status = await statusRes.json()
          
          // Transform API data to our format
          const buoys: BuoyData[] = stations.slice(0, 50).map((station: any) => ({
            station_id: station.station_id,
            name: station.name || `Station ${station.station_id}`,
            lat: station.lat,
            lon: station.lon,
            last_temp: Math.random() * 30 + 5, // Mock temperature data
            status: Math.random() > 0.1 ? 'active' : 'inactive'
          }))
          
          setBuoyData(buoys)
          setClimateMetrics(prev => ({
            ...prev,
            activeStations: buoys.filter(b => b.status === 'active').length
          }))
        }
      } catch (error) {
        console.error('Failed to fetch ocean data:', error)
        // Use mock data as fallback
        const mockBuoys: BuoyData[] = [
          { station_id: '41001', name: 'East Hatteras', lat: 34.7, lon: -72.7, last_temp: 24.5, status: 'active' },
          { station_id: '46001', name: 'Gulf of Alaska', lat: 56.3, lon: -148.1, last_temp: 8.2, status: 'active' },
          { station_id: '51001', name: 'Hawaii', lat: 23.4, lon: -162.3, last_temp: 26.1, status: 'warning' }
        ]
        setBuoyData(mockBuoys)
        setClimateMetrics(prev => ({ ...prev, activeStations: 3 }))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <>
      <Head>
        <title>BlueSphere - Global Ocean Temperature Monitoring</title>
        <meta name="description" content="Real-time ocean temperature monitoring and climate analysis platform tracking buoys worldwide for environmental impact assessment" />
      </Head>

      <div className="container">
        <header className="header">
          <div className="header-content">
            <h1>🌊 BlueSphere Ocean Data Platform</h1>
            <p>Real-time global ocean temperature monitoring and climate trend analysis</p>
          </div>
          
          <div className="climate-metrics">
            <div className="metric">
              <span className="metric-value">{climateMetrics.globalTemp}°C</span>
              <span className="metric-label">Global Ocean Avg</span>
            </div>
            <div className="metric anomaly">
              <span className="metric-value">+{climateMetrics.tempAnomaly}°C</span>
              <span className="metric-label">Temperature Anomaly</span>
            </div>
            <div className="metric">
              <span className="metric-value">{climateMetrics.activeStations}</span>
              <span className="metric-label">Active Buoys</span>
            </div>
            <div className="metric warning">
              <span className="metric-value">{climateMetrics.marineHeatwaves}</span>
              <span className="metric-label">Marine Heatwaves</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="map-section">
            <div className="map-container">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading global ocean monitoring data...</p>
                </div>
              ) : (
                <OceanMap 
                  buoys={buoyData} 
                  onBuoySelect={setSelectedBuoy}
                  selectedBuoy={selectedBuoy}
                />
              )}
            </div>
          </div>

          <div className="info-panel">
            <div className="panel-section">
              <h3>Climate Impact Analysis</h3>
              <div className="impact-alerts">
                <div className="alert warning">
                  <strong>⚠️ Rising Temperatures</strong>
                  <p>Ocean temperatures are {climateMetrics.tempAnomaly}°C above the 1991-2020 average, indicating accelerated warming trends.</p>
                </div>
                <div className="alert info">
                  <strong>🌊 Current Status</strong>
                  <p>{climateMetrics.activeStations} buoys are actively monitoring temperature, salinity, and current data across global waters.</p>
                </div>
              </div>
            </div>

            {selectedBuoy && (
              <div className="panel-section">
                <h3>Station Details</h3>
                <div className="buoy-details">
                  <h4>{selectedBuoy.name}</h4>
                  <p><strong>ID:</strong> {selectedBuoy.station_id}</p>
                  <p><strong>Location:</strong> {selectedBuoy.lat.toFixed(2)}°N, {selectedBuoy.lon.toFixed(2)}°W</p>
                  <p><strong>Last Temperature:</strong> {selectedBuoy.last_temp?.toFixed(1)}°C</p>
                  <p><strong>Status:</strong> <span className={`status ${selectedBuoy.status}`}>{selectedBuoy.status}</span></p>
                </div>
              </div>
            )}

            <div className="panel-section">
              <h3>Environmental Actions</h3>
              <div className="action-items">
                <div className="action-card">
                  <h4>🎯 Immediate Actions</h4>
                  <ul>
                    <li>Monitor coral bleaching risks in warm zones</li>
                    <li>Track marine heatwave development</li>
                    <li>Alert fisheries to temperature changes</li>
                  </ul>
                </div>
                <div className="action-card">
                  <h4>🌱 Future Planning</h4>
                  <ul>
                    <li>Expand monitoring network coverage</li>
                    <li>Implement early warning systems</li>
                    <li>Support marine protected areas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>

        <style jsx>{`
          .container {
            min-height: 100vh;
            background: linear-gradient(135deg, #0a4d68 0%, #1e3a8a 100%);
            color: white;
          }

          .header {
            padding: 2rem;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
          }

          .header-content h1 {
            margin: 0 0 0.5rem 0;
            font-size: 2.5rem;
            font-weight: 700;
          }

          .header-content p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1rem;
          }

          .climate-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
          }

          .metric {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .metric.anomaly {
            background: rgba(251, 191, 36, 0.2);
            border-color: rgba(251, 191, 36, 0.4);
          }

          .metric.warning {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
          }

          .metric-value {
            display: block;
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
          }

          .metric-label {
            display: block;
            font-size: 0.9rem;
            opacity: 0.8;
          }

          .main-content {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 2rem;
            padding: 2rem;
            height: calc(100vh - 200px);
          }

          .map-container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            height: 100%;
            position: relative;
          }

          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: white;
          }

          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .info-panel {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 1.5rem;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .panel-section {
            margin-bottom: 2rem;
          }

          .panel-section h3 {
            margin: 0 0 1rem 0;
            color: #60a5fa;
          }

          .impact-alerts .alert {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid;
          }

          .alert.warning {
            border-left-color: #fbbf24;
          }

          .alert.info {
            border-left-color: #60a5fa;
          }

          .alert strong {
            display: block;
            margin-bottom: 0.5rem;
          }

          .alert p {
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .buoy-details {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
          }

          .buoy-details h4 {
            margin: 0 0 0.5rem 0;
            color: #34d399;
          }

          .buoy-details p {
            margin: 0.25rem 0;
            font-size: 0.9rem;
          }

          .status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
          }

          .status.active {
            background: #10b981;
            color: white;
          }

          .status.inactive {
            background: #6b7280;
            color: white;
          }

          .status.warning {
            background: #f59e0b;
            color: white;
          }

          .action-items {
            display: grid;
            gap: 1rem;
          }

          .action-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
          }

          .action-card h4 {
            margin: 0 0 0.5rem 0;
            color: #34d399;
          }

          .action-card ul {
            margin: 0;
            padding-left: 1rem;
          }

          .action-card li {
            margin: 0.25rem 0;
            font-size: 0.9rem;
          }

          @media (max-width: 1024px) {
            .main-content {
              grid-template-columns: 1fr;
              grid-template-rows: 1fr auto;
            }
            
            .climate-metrics {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 640px) {
            .header {
              padding: 1rem;
            }
            
            .header-content h1 {
              font-size: 2rem;
            }
            
            .main-content {
              padding: 1rem;
            }
            
            .climate-metrics {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </>
  )
}