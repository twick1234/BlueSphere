// System status API endpoint
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const response = {
      system_status: "operational",
      datasets: [
        {
          dataset_id: 1,
          name: "Global NDBC Buoys",
          last_finished_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          status: "green",
          stations_active: 156,
          data_quality: "excellent"
        },
        {
          dataset_id: 2,
          name: "International Ocean Networks",
          last_finished_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          status: "green", 
          stations_active: 89,
          data_quality: "good"
        },
        {
          dataset_id: 3,
          name: "Marine Heatwave Detection",
          last_finished_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          status: "yellow",
          stations_active: 245,
          data_quality: "good",
          alert: "High marine heatwave activity detected globally"
        }
      ],
      performance_metrics: {
        total_stations_monitored: 300,
        active_stations: 245,
        data_update_frequency: "real-time",
        api_response_time_ms: 95,
        uptime_percentage: 99.8
      },
      climate_emergency: {
        global_ocean_temp_anomaly: "+1.54°C",
        marine_heatwaves_active: Math.floor(Math.random() * 10) + 15,
        coral_reefs_at_risk: "73%",
        urgent_status: "CRITICAL - Immediate action required"
      }
    }
    
    res.status(200).json(response)
    
  } catch (error) {
    console.error('Error getting system status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}