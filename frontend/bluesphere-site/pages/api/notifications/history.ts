import { NextApiRequest, NextApiResponse } from 'next'

interface NotificationHistory {
  id: string
  subscriptionId: string
  alertId: string
  email: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sentAt?: string
  failureReason?: string
  retryCount: number
  alertData?: {
    type: string
    severity: string
    title: string
    location: {
      name: string
      lat: number
      lon: number
    }
  }
}

// Simulated notification history - in production this would come from a database
const generateNotificationHistory = (): NotificationHistory[] => {
  const baseHistory: Partial<NotificationHistory>[] = [
    {
      subscriptionId: 'sub_001',
      alertId: 'alert_001',
      email: 'researcher@marine.org',
      status: 'sent',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      retryCount: 0,
      alertData: {
        type: 'marine_heatwave',
        severity: 'critical',
        title: 'Severe Marine Heatwave - Great Barrier Reef',
        location: {
          name: 'Great Barrier Reef, Australia',
          lat: -16.3,
          lon: 145.8
        }
      }
    },
    {
      subscriptionId: 'sub_002',
      alertId: 'alert_002',
      email: 'conservation@ocean.org',
      status: 'sent',
      sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      retryCount: 0,
      alertData: {
        type: 'temperature_spike',
        severity: 'high',
        title: 'Rapid Temperature Increase - Florida Keys',
        location: {
          name: 'Florida Keys, USA',
          lat: 24.7,
          lon: -80.8
        }
      }
    },
    {
      subscriptionId: 'sub_003',
      alertId: 'alert_003',
      email: 'policy@climate.gov',
      status: 'failed',
      failureReason: 'Mailbox full',
      retryCount: 2,
      alertData: {
        type: 'coral_bleaching_risk',
        severity: 'high',
        title: 'Coral Bleaching Alert - Maldives',
        location: {
          name: 'North Malé Atoll, Maldives',
          lat: 4.2,
          lon: 73.5
        }
      }
    },
    {
      subscriptionId: 'sub_001',
      alertId: 'alert_004',
      email: 'researcher@marine.org',
      status: 'sent',
      sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      retryCount: 0,
      alertData: {
        type: 'anomaly_detected',
        severity: 'medium',
        title: 'Unusual Temperature Pattern - North Sea',
        location: {
          name: 'North Sea, UK',
          lat: 56.5,
          lon: 3.0
        }
      }
    },
    {
      subscriptionId: 'sub_004',
      alertId: 'alert_005',
      email: 'alerts@fishery.com',
      status: 'sent',
      sentAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      retryCount: 0,
      alertData: {
        type: 'temperature_spike',
        severity: 'medium',
        title: 'Temperature Anomaly - Baltic Sea',
        location: {
          name: 'Baltic Sea, Sweden',
          lat: 58.0,
          lon: 19.0
        }
      }
    },
    {
      subscriptionId: 'sub_005',
      alertId: 'alert_006',
      email: 'monitoring@reef-foundation.org',
      status: 'bounced',
      failureReason: 'Email address no longer exists',
      retryCount: 1,
      alertData: {
        type: 'coral_bleaching_risk',
        severity: 'critical',
        title: 'Mass Bleaching Event - Caribbean',
        location: {
          name: 'Caribbean Sea, Jamaica',
          lat: 18.2,
          lon: -77.5
        }
      }
    }
  ]

  return baseHistory.map((history, index) => ({
    id: `notif_${Date.now()}_${index}`,
    ...history,
    email: history.email || 'unknown@example.com'
  })) as NotificationHistory[]
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      email, 
      status, 
      subscriptionId, 
      limit = '50',
      offset = '0',
      orderBy = 'sentAt',
      order = 'desc'
    } = req.query

    let history = generateNotificationHistory()

    // Filter by email
    if (email && typeof email === 'string') {
      history = history.filter(h => h.email === email)
    }

    // Filter by status
    if (status && typeof status === 'string') {
      history = history.filter(h => h.status === status)
    }

    // Filter by subscription ID
    if (subscriptionId && typeof subscriptionId === 'string') {
      history = history.filter(h => h.subscriptionId === subscriptionId)
    }

    // Sort results
    const validOrderFields = ['sentAt', 'status', 'email', 'retryCount']
    const orderField = validOrderFields.includes(orderBy as string) ? orderBy as string : 'sentAt'
    const sortOrder = order === 'asc' ? 1 : -1

    history.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (orderField) {
        case 'sentAt':
          aVal = a.sentAt ? new Date(a.sentAt).getTime() : 0
          bVal = b.sentAt ? new Date(b.sentAt).getTime() : 0
          break
        case 'retryCount':
          aVal = a.retryCount
          bVal = b.retryCount
          break
        default:
          aVal = (a as any)[orderField] || ''
          bVal = (b as any)[orderField] || ''
      }

      if (aVal < bVal) return -sortOrder
      if (aVal > bVal) return sortOrder
      return 0
    })

    // Apply pagination
    const limitNum = parseInt(limit as string, 10)
    const offsetNum = parseInt(offset as string, 10)
    
    const total = history.length
    const paginatedHistory = history.slice(offsetNum, offsetNum + limitNum)

    // Generate statistics
    const stats = {
      total: history.length,
      sent: history.filter(h => h.status === 'sent').length,
      failed: history.filter(h => h.status === 'failed').length,
      bounced: history.filter(h => h.status === 'bounced').length,
      pending: history.filter(h => h.status === 'pending').length,
      totalRetries: history.reduce((sum, h) => sum + h.retryCount, 0),
      averageRetries: history.length > 0 
        ? (history.reduce((sum, h) => sum + h.retryCount, 0) / history.length).toFixed(2)
        : '0',
      successRate: history.length > 0 
        ? ((history.filter(h => h.status === 'sent').length / history.length) * 100).toFixed(1) + '%'
        : '0%'
    }

    // Group by alert type for additional insights
    const byAlertType = history.reduce((acc, h) => {
      if (h.alertData?.type) {
        acc[h.alertData.type] = (acc[h.alertData.type] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Group by severity
    const bySeverity = history.reduce((acc, h) => {
      if (h.alertData?.severity) {
        acc[h.alertData.severity] = (acc[h.alertData.severity] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    res.status(200).json({
      success: true,
      data: paginatedHistory,
      pagination: {
        total,
        offset: offsetNum,
        limit: limitNum,
        hasMore: offsetNum + limitNum < total
      },
      stats,
      insights: {
        byAlertType,
        bySeverity
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'BlueSphere Notification System',
        filters: {
          email: email || null,
          status: status || null,
          subscriptionId: subscriptionId || null
        }
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch notification history',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}