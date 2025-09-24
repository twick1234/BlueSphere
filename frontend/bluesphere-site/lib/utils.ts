/**
 * Comprehensive utility functions for BlueSphere platform
 */

export function formatDate(date: Date | number | string, format: 'short' | 'full' | 'iso' = 'short'): string {
  const dateObj = new Date(date)

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  switch (format) {
    case 'full':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'iso':
      return dateObj.toISOString().split('T')[0]
    default:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
  }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return NaN
  }

  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export function convertTemperature(temp: number, fromUnit: 'C' | 'F' | 'K', toUnit: 'C' | 'F' | 'K'): number {
  if (fromUnit === toUnit) return temp

  let celsius: number

  switch (fromUnit) {
    case 'F':
      celsius = (temp - 32) * 5/9
      break
    case 'K':
      celsius = temp - 273.15
      break
    case 'C':
      celsius = temp
      break
    default:
      throw new Error('Invalid temperature unit')
  }

  switch (toUnit) {
    case 'F':
      return celsius * 9/5 + 32
    case 'K':
      return celsius + 273.15
    case 'C':
      return celsius
    default:
      throw new Error('Invalid temperature unit')
  }
}

export function validateEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return ''

  // Remove HTML tags and potential XSS
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

export function generateSharkId(prefix: string = 'SHK'): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${year}-${random}`
}

export function calculateOceanDepth(pressure: number): number {
  if (pressure <= 1) return 0
  // Approximate: 1 atmosphere = 10 meters depth
  return (pressure - 1) * 10
}

export function formatCoordinates(lat: number, lon: number): string {
  if (isNaN(lat) || isNaN(lon)) return 'Invalid coordinates'

  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'

  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`
}

export function parseGPS(gpsString: string): { lat: number, lon: number } | null {
  const regex = /(\d+\.?\d*)°([NS]),\s*(\d+\.?\d*)°([EW])/
  const match = gpsString.match(regex)

  if (!match) return null

  const lat = parseFloat(match[1]) * (match[2] === 'S' ? -1 : 1)
  const lon = parseFloat(match[3]) * (match[4] === 'W' ? -1 : 1)

  return { lat, lon }
}