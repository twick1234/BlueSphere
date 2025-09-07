// Marine heatwave alerts API endpoint
import { NextApiRequest, NextApiResponse } from 'next'

interface HeatwaveAlert {
  station_id: string
  name: string
  lat: number
  lon: number
  current_temp: number
  expected_temp: number
  anomaly: number
  severity: 'Moderate' | 'High' | 'Extreme'
  alert_time: string
  risk_level: string
}

function generateHeatwaveAlerts(): HeatwaveAlert[] {
  const alerts: HeatwaveAlert[] = []
  
  // Hotspots around the world experiencing marine heatwaves
  const heatwaveLocations = [
    { name: "Great Barrier Reef Monitor", lat: -16.3, lon: 145.8, base_temp: 26 },
    { name: "Caribbean Coral Triangle", lat: 18.2, lon: -67.1, base_temp: 27 },
    { name: "Florida Keys Deep", lat: 24.6, lon: -81.4, base_temp: 26 },
    { name: "Mediterranean Thermal", lat: 40.4, lon: 14.3, base_temp: 22 },
    { name: "Red Sea Central", lat: 22.0, lon: 38.5, base_temp: 28 },
    { name: "Southeast Pacific", lat: -15.0, lon: -75.0, base_temp: 19 },
    { name: "Bay of Bengal", lat: 15.0, lon: 90.0, base_temp: 29 },
    { name: "Arabian Sea", lat: 20.0, lon: 65.0, base_temp: 28 },
    { name: "Coral Sea", lat: -18.0, lon: 155.0, base_temp: 25 },
    { name: "Gulf of Mexico Central", lat: 26.0, lon: -91.0, base_temp: 24 },
  ]
  
  // Generate random alerts (30-70% of hotspots active)
  const activeCount = Math.floor(Math.random() * 5) + 3 // 3-7 active alerts
  const activeLocations = heatwaveLocations
    .sort(() => Math.random() - 0.5)
    .slice(0, activeCount)
  
  activeLocations.forEach((location, index) => {
    const expected_temp = location.base_temp + (Math.random() - 0.5) * 2
    const anomaly = 4 + Math.random() * 4 // 4-8°C above expected
    const current_temp = expected_temp + anomaly
    
    let severity: 'Moderate' | 'High' | 'Extreme'
    let risk_level: string
    
    if (anomaly > 6) {
      severity = 'Extreme'
      risk_level = 'CRITICAL - Mass coral bleaching imminent'
    } else if (anomaly > 5) {
      severity = 'High' 
      risk_level = 'HIGH - Widespread ecosystem stress'
    } else {
      severity = 'Moderate'
      risk_level = 'MODERATE - Monitor for ecosystem impacts'
    }
    
    alerts.push({
      station_id: `HW${(1000 + index).toString().padStart(4, '0')}`,
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      current_temp: Math.round(current_temp * 10) / 10,
      expected_temp: Math.round(expected_temp * 10) / 10,
      anomaly: Math.round(anomaly * 10) / 10,
      severity,
      alert_time: new Date().toISOString(),
      risk_level
    })
  })
  
  return alerts.sort((a, b) => b.anomaly - a.anomaly) // Sort by severity
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const alerts = generateHeatwaveAlerts()
    
    const response = {
      active_alerts: alerts.length,
      marine_heatwaves: alerts,
      alert_threshold: "4°C above regional average",
      last_checked: new Date().toISOString(),
      emergency_status: alerts.some(a => a.severity === 'Extreme') ? 'CRITICAL' : 
                       alerts.some(a => a.severity === 'High') ? 'HIGH' : 'MODERATE',
      climate_impact: {
        coral_reefs_at_risk: alerts.filter(a => a.current_temp > 26).length,
        ecosystem_threat_level: "UNPRECEDENTED",
        urgent_message: "Marine heatwaves have increased 20x since the 1980s. Immediate action required."
      }
    }
    
    res.status(200).json(response)
    
  } catch (error) {
    console.error('Error generating marine heatwave alerts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}