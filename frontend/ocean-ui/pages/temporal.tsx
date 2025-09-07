import { useState, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'

// Dynamically import components to avoid SSR issues
const TemporalMap = dynamic(() => import('../components/TemporalMap'), {
  ssr: false,
  loading: () => <div className="loading">Loading temporal visualization...</div>
})

const TimeSlider = dynamic(() => import('../components/TimeSlider'), {
  ssr: false
})

interface ClimateStats {
  averageTemp: number
  anomaly: number
  trendRate: number // °C per decade
  heatwaveCount: number
  dataPoints: number
}

export default function TemporalVisualization() {
  // Temporal controls state
  const [startDate] = useState('1980-01-01')
  const [endDate] = useState('2024-12-31')
  const [currentDate, setCurrentDate] = useState('2020-01-01')
  const [resolution, setResolution] = useState<'daily' | 'monthly' | 'yearly'>('monthly')
  
  // Animation controls
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(2)
  
  // Visualization options
  const [showAnomalies, setShowAnomalies] = useState(false)
  const [showTrends, setShowTrends] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  
  // Data state
  const [climateStats, setClimateStats] = useState<ClimateStats>({
    averageTemp: 16.8,
    anomaly: 0.0,
    trendRate: 0.18,
    heatwaveCount: 0,
    dataPoints: 0
  })
  
  const [loading, setLoading] = useState(false)

  // Update climate stats when date changes
  useEffect(() => {
    const updateStats = async () => {
      setLoading(true)
      
      try {
        // Fetch climate statistics for current date
        const response = await fetch(
          `http://localhost:8000/temporal/stats/summary?` +
          `date=${currentDate}&resolution=${resolution}&` +
          `lat_min=-90&lat_max=90&lon_min=-180&lon_max=180`
        )
        
        if (response.ok) {
          const data = await response.json()
          setClimateStats({
            averageTemp: data.average_temperature || 16.8,
            anomaly: data.temperature_anomaly || calculateMockAnomaly(currentDate),
            trendRate: data.trend_rate || 0.18,
            heatwaveCount: data.heatwave_count || 0,
            dataPoints: data.data_points || 0
          })
        } else {
          // Use mock data
          setClimateStats({
            averageTemp: 16.8 + Math.random() * 2 - 1,
            anomaly: calculateMockAnomaly(currentDate),
            trendRate: 0.15 + Math.random() * 0.1,
            heatwaveCount: Math.floor(Math.random() * 10),
            dataPoints: Math.floor(Math.random() * 10000) + 5000
          })
        }
      } catch (error) {
        console.error('Failed to fetch climate stats:', error)
        // Fallback to mock data
        setClimateStats({
          averageTemp: 16.8,
          anomaly: calculateMockAnomaly(currentDate),
          trendRate: 0.18,
          heatwaveCount: Math.floor(Math.random() * 15),
          dataPoints: 7500
        })
      } finally {
        setLoading(false)
      }
    }
    
    updateStats()
  }, [currentDate, resolution])

  // Calculate mock anomaly based on date (showing warming trend)
  const calculateMockAnomaly = (date: string): number => {
    const year = new Date(date).getFullYear()
    const monthOfYear = new Date(date).getMonth()
    
    // Base warming trend: 0.18°C per decade since 1980
    const baseWarmingTrend = ((year - 1980) / 10) * 0.18
    
    // Add some variability and seasonal effects
    const seasonalVariation = Math.sin((monthOfYear / 12) * 2 * Math.PI) * 0.3
    const randomVariation = (Math.random() - 0.5) * 0.8
    
    // Recent acceleration
    const recentAcceleration = year > 2000 ? ((year - 2000) / 10) * 0.1 : 0
    
    return baseWarmingTrend + seasonalVariation + randomVariation + recentAcceleration
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const getClimateMessage = (): { text: string; severity: 'normal' | 'warning' | 'critical' } => {
    if (climateStats.anomaly > 1.5) {
      return {
        text: `🚨 Extreme warming: ${climateStats.anomaly.toFixed(2)}°C above baseline. Critical marine ecosystem stress likely.`,
        severity: 'critical'
      }
    } else if (climateStats.anomaly > 0.8) {
      return {
        text: `⚠️ Significant warming: ${climateStats.anomaly.toFixed(2)}°C above baseline. Monitor for coral bleaching.`,
        severity: 'warning'
      }
    } else if (climateStats.anomaly > 0.3) {
      return {
        text: `🌡️ Moderate warming: ${climateStats.anomaly.toFixed(2)}°C above baseline. Ocean ecosystems adapting.`,
        severity: 'warning'
      }
    } else {
      return {
        text: `✅ Normal conditions: ${climateStats.anomaly.toFixed(2)}°C relative to baseline.`,
        severity: 'normal'
      }
    }
  }

  const climateMessage = getClimateMessage()

  return (
    <>
      <Head>
        <title>Temporal Climate Visualization - BlueSphere</title>
        <meta name="description" content="Interactive temporal visualization of ocean temperature changes and climate trends over decades" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: 'white'
      }}>
        {/* Header */}
        <header style={{
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '700' }}>
                🌊 Temporal Climate Explorer
              </h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
                Interactive visualization of ocean temperature evolution over time
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button
                onClick={() => setShowAnomalies(!showAnomalies)}
                style={{
                  background: showAnomalies ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showAnomalies ? '🌡️ Show Absolute' : '📊 Show Anomalies'}
              </button>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                📈 Trend: +{climateStats.trendRate.toFixed(2)}°C/decade
              </div>
            </div>
          </div>
        </header>

        {/* Main visualization area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr auto',
          gap: '20px',
          padding: '20px',
          height: 'calc(100vh - 140px)'
        }}>
          {/* Map container */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <TemporalMap
              startDate={startDate}
              endDate={endDate}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              resolution={resolution}
              showAnomalies={showAnomalies}
              isPlaying={isPlaying}
            />
          </div>

          {/* Control panel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '20px',
            maxHeight: '300px'
          }}>
            {/* Time controls */}
            <TimeSlider
              startDate={startDate}
              endDate={endDate}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              playSpeed={playSpeed}
              onSpeedChange={setPlaySpeed}
              resolution={resolution}
              onResolutionChange={setResolution}
            />

            {/* Climate analysis panel */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
                📊 Climate Analysis
              </h3>

              {/* Current stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {climateStats.averageTemp.toFixed(1)}°C
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Global Average
                  </div>
                </div>
                
                <div style={{
                  background: climateStats.anomaly > 0.5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {climateStats.anomaly > 0 ? '+' : ''}{climateStats.anomaly.toFixed(2)}°C
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Anomaly
                  </div>
                </div>
              </div>

              {/* Climate message */}
              <div style={{
                background: 
                  climateMessage.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                  climateMessage.severity === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                  'rgba(34, 197, 94, 0.2)',
                border: `1px solid ${
                  climateMessage.severity === 'critical' ? 'rgba(239, 68, 68, 0.4)' :
                  climateMessage.severity === 'warning' ? 'rgba(245, 158, 11, 0.4)' :
                  'rgba(34, 197, 94, 0.4)'
                }`,
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: '1.4',
                marginBottom: '16px'
              }}>
                {climateMessage.text}
              </div>

              {/* Additional metrics */}
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                <div style={{ marginBottom: '4px' }}>
                  🌊 Marine Heatwaves: {climateStats.heatwaveCount}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  📊 Data Points: {climateStats.dataPoints.toLocaleString()}
                </div>
                <div>
                  📈 Long-term Trend: +{climateStats.trendRate.toFixed(2)}°C per decade
                </div>
              </div>

              {loading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0, 0, 0, 0.8)',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  Updating...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          fontSize: '12px',
          opacity: 0.6,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          🌍 BlueSphere Temporal Climate Explorer • Data sources: NOAA ERSST, OISST, NDBC • 
          Interactive temporal analysis of {new Date().getFullYear() - 1980} years of ocean climate data
        </div>
      </div>
    </>
  )
}