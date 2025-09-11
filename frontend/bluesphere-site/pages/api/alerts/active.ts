import { NextApiRequest, NextApiResponse } from 'next'

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

// Simulated active alerts - in production this would come from real monitoring
const generateActiveAlerts = (): Alert[] => {
  const baseAlerts: Partial<Alert>[] = [
    {
      type: 'marine_heatwave',
      severity: 'critical',
      title: 'Severe Marine Heatwave - Great Barrier Reef',
      location: {
        name: 'Great Barrier Reef, Australia',
        lat: -16.3,
        lon: 145.8,
        stationId: 'aus_gbr_001'
      },
      data: {
        temperature: 29.2,
        threshold: 26.5,
        duration: '18 days',
        trend: 'increasing'
      },
      impact: {
        ecosystemRisk: 'Severe coral bleaching imminent - 85% of reef systems at risk',
        affectedSpecies: ['Hard Corals', 'Reef Fish', 'Sea Turtles', 'Marine Algae'],
        recommendations: [
          'Immediate marine park closure to reduce stress factors',
          'Deploy emergency coral cooling systems',
          'Monitor fish migration patterns',
          'Coordinate with tourism operators for reduced activities'
        ]
      }
    },
    {
      type: 'temperature_spike',
      severity: 'high',
      title: 'Rapid Temperature Increase - Florida Keys',
      location: {
        name: 'Florida Keys, USA',
        lat: 24.7,
        lon: -80.8,
        stationId: 'usa_fl_keys_01'
      },
      data: {
        temperature: 27.8,
        threshold: 26.0,
        duration: '3 days',
        trend: 'increasing'
      },
      impact: {
        ecosystemRisk: 'Moderate coral stress levels detected',
        affectedSpecies: ['Staghorn Coral', 'Brain Coral', 'Parrotfish'],
        recommendations: [
          'Increase monitoring frequency',
          'Alert local dive operators',
          'Prepare coral rescue protocols'
        ]
      }
    },
    {
      type: 'anomaly_detected',
      severity: 'medium',
      title: 'Unusual Temperature Pattern - North Sea',
      location: {
        name: 'North Sea, UK',
        lat: 56.5,
        lon: 3.0,
        stationId: 'uk_north_sea_05'
      },
      data: {
        temperature: 12.4,
        threshold: 10.5,
        duration: '7 days',
        trend: 'stable'
      },
      impact: {
        ecosystemRisk: 'Potential fish migration disruption',
        affectedSpecies: ['Atlantic Cod', 'Herring', 'Mackerel'],
        recommendations: [
          'Monitor fishing industry impacts',
          'Track fish stock movements',
          'Coordinate with maritime authorities'
        ]
      }
    },
    {
      type: 'coral_bleaching_risk',
      severity: 'high',
      title: 'Coral Bleaching Alert - Maldives',
      location: {
        name: 'North Malé Atoll, Maldives',
        lat: 4.2,
        lon: 73.5,
        stationId: 'mdv_male_001'
      },
      data: {
        temperature: 28.9,
        threshold: 27.5,
        duration: '12 days',
        trend: 'increasing'
      },
      impact: {
        ecosystemRisk: 'High probability of mass coral bleaching event',
        affectedSpecies: ['Acropora Corals', 'Soft Corals', 'Reef Sharks', 'Manta Rays'],
        recommendations: [
          'Implement emergency reef protection measures',
          'Reduce tourism pressure in affected areas',
          'Deploy underwater monitoring equipment',
          'Coordinate with resort operators'
        ]
      }
    }
  ]

  return baseAlerts.map((alert, index) => ({
    id: `alert_${Date.now()}_${index}`,
    ...alert,
    isActive: true,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date().toISOString()
  })) as Alert[]
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { severity, type, limit = '50' } = req.query

    let alerts = generateActiveAlerts()

    // Filter by severity
    if (severity && typeof severity === 'string') {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    // Filter by type
    if (type && typeof type === 'string') {
      alerts = alerts.filter(alert => alert.type === type)
    }

    // Limit results
    const limitNum = parseInt(limit as string, 10)
    if (limitNum && limitNum > 0) {
      alerts = alerts.slice(0, limitNum)
    }

    // Sort by severity and creation time
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      lastUpdated: new Date().toISOString()
    }

    res.status(200).json({
      success: true,
      alerts,
      summary,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'BlueSphere Alert Monitoring System',
        updateFrequency: '5 minutes'
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch active alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}