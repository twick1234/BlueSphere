import { NextApiRequest, NextApiResponse } from 'next'

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

// In-memory storage for demo - in production, use a database
const subscriptions: AlertSubscription[] = []

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  switch (req.method) {
    case 'POST':
      return createSubscription(req, res)
    case 'GET':
      return getSubscriptions(req, res)
    case 'PUT':
      return updateSubscription(req, res)
    case 'DELETE':
      return deleteSubscription(req, res)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

function createSubscription(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, alertTypes, thresholds, zones } = req.body

    if (!email || !alertTypes || !thresholds) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, alertTypes, thresholds' 
      })
    }

    const subscription: AlertSubscription = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      alertTypes: alertTypes || ['marine_heatwave', 'temperature_spike'],
      thresholds: {
        temperature: thresholds.temperature || 26,
        severity: thresholds.severity || 'medium'
      },
      zones: zones || [{
        name: 'Global',
        bounds: { north: 90, south: -90, east: 180, west: -180 }
      }],
      active: true,
      createdAt: new Date().toISOString()
    }

    subscriptions.push(subscription)

    res.status(201).json({
      success: true,
      subscription,
      message: 'Alert subscription created successfully'
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function getSubscriptions(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query

  if (email) {
    const userSubscriptions = subscriptions.filter(sub => sub.email === email)
    return res.status(200).json({ subscriptions: userSubscriptions })
  }

  // Return all subscriptions (in production, this would be admin-only)
  res.status(200).json({ 
    subscriptions: subscriptions.map(sub => ({
      ...sub,
      email: sub.email.replace(/(.{2}).*@/, '$1***@') // Anonymize emails
    }))
  })
}

function updateSubscription(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const updates = req.body

  const subscriptionIndex = subscriptions.findIndex(sub => sub.id === id)
  
  if (subscriptionIndex === -1) {
    return res.status(404).json({ error: 'Subscription not found' })
  }

  subscriptions[subscriptionIndex] = {
    ...subscriptions[subscriptionIndex],
    ...updates
  }

  res.status(200).json({
    success: true,
    subscription: subscriptions[subscriptionIndex],
    message: 'Subscription updated successfully'
  })
}

function deleteSubscription(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  const subscriptionIndex = subscriptions.findIndex(sub => sub.id === id)
  
  if (subscriptionIndex === -1) {
    return res.status(404).json({ error: 'Subscription not found' })
  }

  subscriptions.splice(subscriptionIndex, 1)

  res.status(200).json({
    success: true,
    message: 'Subscription deleted successfully'
  })
}