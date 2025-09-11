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

interface AlertSubscription {
  id: string
  email: string
  alertTypes: string[]
  thresholds: {
    temperature: number
    severity: 'low' | 'medium' | 'high' | 'critical'
  }
  zones: {
    name: string
    bounds: {
      north: number
      south: number
      east: number
      west: number
    }
  }[]
  active: boolean
  createdAt: string
  lastTriggered?: string
}

interface ProcessingResult {
  alertId: string
  subscriptionMatches: number
  notificationsSent: number
  notificationsFailed: number
  processingTime: number
  matchedSubscriptions: {
    subscriptionId: string
    email: string
    matchReason: string[]
  }[]
}

// Mock data fetchers - in production these would query a database
async function fetchActiveAlerts(): Promise<Alert[]> {
  // This would normally fetch from the alerts/active endpoint or database
  const response = await fetch('http://localhost:3000/api/alerts/active')
  const data = await response.json()
  return data.alerts || []
}

async function fetchActiveSubscriptions(): Promise<AlertSubscription[]> {
  // This would normally fetch from the database
  const mockSubscriptions: AlertSubscription[] = [
    {
      id: 'sub_001',
      email: 'researcher@marine.org',
      alertTypes: ['marine_heatwave', 'coral_bleaching_risk'],
      thresholds: {
        temperature: 25.0,
        severity: 'medium'
      },
      zones: [{
        name: 'Great Barrier Reef',
        bounds: { north: -10, south: -24, east: 154, west: 142 }
      }],
      active: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sub_002',
      email: 'conservation@ocean.org',
      alertTypes: ['marine_heatwave', 'temperature_spike', 'coral_bleaching_risk'],
      thresholds: {
        temperature: 26.0,
        severity: 'high'
      },
      zones: [{
        name: 'Caribbean Sea',
        bounds: { north: 25, south: 9, east: -60, west: -87 }
      }, {
        name: 'Florida Keys',
        bounds: { north: 25.5, south: 24.0, east: -80.0, west: -81.5 }
      }],
      active: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sub_003',
      email: 'policy@climate.gov',
      alertTypes: ['marine_heatwave', 'temperature_spike', 'anomaly_detected', 'coral_bleaching_risk'],
      thresholds: {
        temperature: 24.0,
        severity: 'low'
      },
      zones: [{
        name: 'Global',
        bounds: { north: 90, south: -90, east: 180, west: -180 }
      }],
      active: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
  
  return mockSubscriptions
}

function isLocationInZone(location: { lat: number, lon: number }, zone: { bounds: { north: number, south: number, east: number, west: number } }): boolean {
  const { lat, lon } = location
  const { north, south, east, west } = zone.bounds
  
  return lat <= north && lat >= south && lon <= east && lon >= west
}

function getSeverityLevel(severity: string): number {
  const levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 }
  return levels[severity as keyof typeof levels] || 0
}

function matchAlertToSubscription(alert: Alert, subscription: AlertSubscription): { matches: boolean, reasons: string[] } {
  const reasons: string[] = []
  
  // Check if subscription is active
  if (!subscription.active) {
    return { matches: false, reasons: ['Subscription is inactive'] }
  }

  // Check alert type
  if (!subscription.alertTypes.includes(alert.type)) {
    return { matches: false, reasons: ['Alert type not subscribed'] }
  }
  reasons.push(`Alert type '${alert.type}' matches subscription`)

  // Check severity threshold
  const alertSeverityLevel = getSeverityLevel(alert.severity)
  const subscriptionSeverityLevel = getSeverityLevel(subscription.thresholds.severity)
  
  if (alertSeverityLevel < subscriptionSeverityLevel) {
    return { matches: false, reasons: ['Alert severity below threshold'] }
  }
  reasons.push(`Severity '${alert.severity}' meets threshold '${subscription.thresholds.severity}'`)

  // Check temperature threshold
  if (alert.data.temperature < subscription.thresholds.temperature) {
    return { matches: false, reasons: ['Temperature below threshold'] }
  }
  reasons.push(`Temperature ${alert.data.temperature}°C exceeds threshold ${subscription.thresholds.temperature}°C`)

  // Check geographic zones
  const isInAnyZone = subscription.zones.some(zone => 
    isLocationInZone(alert.location, zone)
  )
  
  if (!isInAnyZone) {
    return { matches: false, reasons: ['Alert location outside monitored zones'] }
  }
  
  const matchingZones = subscription.zones
    .filter(zone => isLocationInZone(alert.location, zone))
    .map(zone => zone.name)
  
  reasons.push(`Location matches zone(s): ${matchingZones.join(', ')}`)

  return { matches: true, reasons }
}

async function sendNotifications(alert: Alert, subscriptions: { subscription: AlertSubscription, matchReason: string[] }[]) {
  const notifications = subscriptions.map(({ subscription }) => ({
    subscriptionId: subscription.id,
    alertId: alert.id,
    email: subscription.email,
    alertData: {
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      location: alert.location,
      data: alert.data,
      impact: alert.impact
    },
    timestamp: new Date().toISOString()
  }))

  try {
    const response = await fetch('http://localhost:3000/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notifications,
        priority: alert.severity === 'critical' ? 'urgent' : 'high'
      })
    })

    const result = await response.json()
    return {
      sent: result.summary?.sent || 0,
      failed: result.summary?.failed || 0,
      details: result.results || []
    }
  } catch (error) {
    console.error('Failed to send notifications:', error)
    return {
      sent: 0,
      failed: notifications.length,
      details: []
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()

  try {
    const { forceProcess = false } = req.body

    // Fetch active alerts and subscriptions
    const [alerts, subscriptions] = await Promise.all([
      fetchActiveAlerts(),
      fetchActiveSubscriptions()
    ])

    if (alerts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active alerts to process',
        summary: {
          alertsProcessed: 0,
          totalMatches: 0,
          notificationsSent: 0,
          notificationsFailed: 0,
          processingTime: Date.now() - startTime
        }
      })
    }

    if (subscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active subscriptions found',
        summary: {
          alertsProcessed: alerts.length,
          totalMatches: 0,
          notificationsSent: 0,
          notificationsFailed: 0,
          processingTime: Date.now() - startTime
        }
      })
    }

    // Process each alert against all subscriptions
    const processingResults: ProcessingResult[] = []
    let totalNotificationsSent = 0
    let totalNotificationsFailed = 0
    let totalMatches = 0

    for (const alert of alerts) {
      const alertStartTime = Date.now()
      const matchedSubscriptions: { subscription: AlertSubscription, matchReason: string[] }[] = []

      // Check each subscription against this alert
      for (const subscription of subscriptions) {
        const matchResult = matchAlertToSubscription(alert, subscription)
        
        if (matchResult.matches) {
          matchedSubscriptions.push({
            subscription,
            matchReason: matchResult.reasons
          })
        }
      }

      let notificationResult = { sent: 0, failed: 0, details: [] }
      
      if (matchedSubscriptions.length > 0) {
        notificationResult = await sendNotifications(alert, matchedSubscriptions)
        totalMatches += matchedSubscriptions.length
      }

      totalNotificationsSent += notificationResult.sent
      totalNotificationsFailed += notificationResult.failed

      processingResults.push({
        alertId: alert.id,
        subscriptionMatches: matchedSubscriptions.length,
        notificationsSent: notificationResult.sent,
        notificationsFailed: notificationResult.failed,
        processingTime: Date.now() - alertStartTime,
        matchedSubscriptions: matchedSubscriptions.map(({ subscription, matchReason }) => ({
          subscriptionId: subscription.id,
          email: subscription.email,
          matchReason
        }))
      })
    }

    const totalProcessingTime = Date.now() - startTime

    res.status(200).json({
      success: true,
      summary: {
        alertsProcessed: alerts.length,
        subscriptionsChecked: subscriptions.length,
        totalMatches,
        notificationsSent: totalNotificationsSent,
        notificationsFailed: totalNotificationsFailed,
        processingTime: totalProcessingTime,
        averageProcessingTimePerAlert: Math.round(totalProcessingTime / alerts.length)
      },
      results: processingResults,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'BlueSphere Alert Processing System',
        forceProcess
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to process alerts',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    })
  }
}