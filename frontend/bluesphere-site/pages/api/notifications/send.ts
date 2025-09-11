import { NextApiRequest, NextApiResponse } from 'next'

interface AlertNotification {
  subscriptionId: string
  alertId: string
  email: string
  alertData: {
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
  }
  timestamp: string
}

interface NotificationRequest {
  notifications: AlertNotification[]
  priority: 'urgent' | 'high' | 'normal' | 'low'
}

interface NotificationHistory {
  id: string
  subscriptionId: string
  alertId: string
  email: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sentAt?: string
  failureReason?: string
  retryCount: number
}

// In-memory storage for demo - in production, use a database and queue system
const notificationHistory: NotificationHistory[] = []
const rateLimitMap: Map<string, { count: number; lastReset: number }> = new Map()

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    const { notifications, priority = 'normal' }: NotificationRequest = req.body

    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({ 
        error: 'Notifications array is required' 
      })
    }

    if (notifications.length === 0) {
      return res.status(400).json({ 
        error: 'At least one notification is required' 
      })
    }

    // Rate limiting check
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    for (const notification of notifications) {
      const rateLimitKey = notification.email
      const rateLimit = rateLimitMap.get(rateLimitKey)
      
      if (rateLimit) {
        // Reset counter if more than an hour has passed
        if (now - rateLimit.lastReset > oneHour) {
          rateLimit.count = 0
          rateLimit.lastReset = now
        }
        
        // Check rate limit (max 10 notifications per hour per email)
        if (rateLimit.count >= 10) {
          return res.status(429).json({ 
            error: `Rate limit exceeded for ${notification.email}`,
            retryAfter: Math.ceil((oneHour - (now - rateLimit.lastReset)) / 1000)
          })
        }
      } else {
        rateLimitMap.set(rateLimitKey, { count: 0, lastReset: now })
      }
    }

    // Process notifications
    const results = await Promise.all(
      notifications.map(async (notification) => {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        try {
          // Validate notification data
          if (!notification.email || !notification.alertData) {
            throw new Error('Email and alertData are required')
          }

          // Simulate email sending (in production, use a real email service)
          const emailResult = await simulateEmailSend(notification)
          
          // Update rate limit counter
          const rateLimitKey = notification.email
          const rateLimit = rateLimitMap.get(rateLimitKey)!
          rateLimit.count++

          // Record notification history
          const historyEntry: NotificationHistory = {
            id: notificationId,
            subscriptionId: notification.subscriptionId,
            alertId: notification.alertId,
            email: notification.email,
            status: emailResult.success ? 'sent' : 'failed',
            sentAt: emailResult.success ? new Date().toISOString() : undefined,
            failureReason: emailResult.success ? undefined : emailResult.error,
            retryCount: 0
          }
          
          notificationHistory.push(historyEntry)

          return {
            notificationId,
            email: notification.email,
            success: emailResult.success,
            error: emailResult.error
          }
        } catch (error) {
          const historyEntry: NotificationHistory = {
            id: notificationId,
            subscriptionId: notification.subscriptionId,
            alertId: notification.alertId,
            email: notification.email,
            status: 'failed',
            failureReason: error instanceof Error ? error.message : 'Unknown error',
            retryCount: 0
          }
          
          notificationHistory.push(historyEntry)

          return {
            notificationId,
            email: notification.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    res.status(200).json({
      success: true,
      summary: {
        total: notifications.length,
        sent: successCount,
        failed: failureCount,
        priority
      },
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to process notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function simulateEmailSend(notification: AlertNotification) {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
  
  // Simulate 95% success rate
  if (Math.random() < 0.95) {
    console.log(`📧 Email notification sent to ${notification.email}:`)
    console.log(`   Alert: ${notification.alertData.title}`)
    console.log(`   Severity: ${notification.alertData.severity.toUpperCase()}`)
    console.log(`   Location: ${notification.alertData.location.name}`)
    console.log(`   Temperature: ${notification.alertData.data.temperature}°C (threshold: ${notification.alertData.data.threshold}°C)`)
    
    return { success: true }
  } else {
    // Simulate various failure reasons
    const failureReasons = [
      'Invalid email address',
      'Mailbox full',
      'Temporary server error',
      'Recipient blocked notifications',
      'Email bounced'
    ]
    
    return { 
      success: false, 
      error: failureReasons[Math.floor(Math.random() * failureReasons.length)]
    }
  }
}