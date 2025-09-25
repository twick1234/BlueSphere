/**
 * Comprehensive utility function tests
 * Tests all utility functions across the BlueSphere platform
 */

import { formatDate, calculateDistance, convertTemperature, validateEmail, sanitizeInput, generateSharkId, calculateOceanDepth, formatCoordinates, parseGPS } from '../../lib/utils'

describe('Date Utilities', () => {
  it('should format dates correctly', () => {
    const date = new Date('2024-09-24T12:00:00Z')
    expect(formatDate(date)).toBe('Sep 24, 2024')
    expect(formatDate(date, 'full')).toBe('September 24, 2024')
    expect(formatDate(date, 'iso')).toBe('2024-09-24')
  })

  it('should handle invalid dates', () => {
    const invalidDate = new Date('invalid')
    expect(formatDate(invalidDate)).toBe('Invalid Date')
  })

  it('should format timestamps', () => {
    const timestamp = 1695556800000 // 2023-09-24T12:00:00Z
    expect(formatDate(timestamp)).toBe('Sep 24, 2023')
  })
})

describe('Geographic Utilities', () => {
  it('should calculate distance between coordinates', () => {
    // Distance between Miami and Key West (approximately 165km)
    const miami = { lat: 25.7617, lon: -80.1918 }
    const keyWest = { lat: 24.5551, lon: -81.7821 }

    const distance = calculateDistance(miami.lat, miami.lon, keyWest.lat, keyWest.lon)
    expect(distance).toBeCloseTo(209, 5) // Within 5km tolerance (actual distance Miami to Key West)
  })

  it('should calculate zero distance for same location', () => {
    const distance = calculateDistance(25.7617, -80.1918, 25.7617, -80.1918)
    expect(distance).toBe(0)
  })

  it('should handle antipodal points', () => {
    // Points on opposite sides of Earth should be ~20,015km apart
    const distance = calculateDistance(0, 0, 0, 180)
    expect(distance).toBeCloseTo(20015, 0)
  })

  it('should format coordinates properly', () => {
    expect(formatCoordinates(25.7617, -80.1918)).toBe('25.7617°N, 80.1918°W')
    expect(formatCoordinates(-25.7617, 80.1918)).toBe('25.7617°S, 80.1918°E')
    expect(formatCoordinates(0, 0)).toBe('0.0000°N, 0.0000°E')
  })

  it('should parse GPS strings', () => {
    expect(parseGPS('25.7617°N, 80.1918°W')).toEqual({ lat: 25.7617, lon: -80.1918 })
    expect(parseGPS('25.7617°S, 80.1918°E')).toEqual({ lat: -25.7617, lon: 80.1918 })
    expect(parseGPS('invalid')).toBeNull()
  })
})

describe('Temperature Conversion', () => {
  it('should convert Celsius to Fahrenheit', () => {
    expect(convertTemperature(0, 'C', 'F')).toBe(32)
    expect(convertTemperature(100, 'C', 'F')).toBe(212)
    expect(convertTemperature(25, 'C', 'F')).toBe(77)
  })

  it('should convert Fahrenheit to Celsius', () => {
    expect(convertTemperature(32, 'F', 'C')).toBe(0)
    expect(convertTemperature(212, 'F', 'C')).toBe(100)
    expect(convertTemperature(77, 'F', 'C')).toBe(25)
  })

  it('should convert to Kelvin', () => {
    expect(convertTemperature(0, 'C', 'K')).toBe(273.15)
    expect(convertTemperature(32, 'F', 'K')).toBe(273.15)
  })

  it('should handle same unit conversion', () => {
    expect(convertTemperature(25, 'C', 'C')).toBe(25)
    expect(convertTemperature(77, 'F', 'F')).toBe(77)
  })
})

describe('Ocean Utilities', () => {
  it('should calculate ocean depth from pressure', () => {
    // 1 atm of pressure = ~10m depth
    expect(calculateOceanDepth(2)).toBeCloseTo(10, 1) // 2 atm = ~10m
    expect(calculateOceanDepth(101)).toBeCloseTo(1000, 10) // 101 atm = ~1000m
  })

  it('should handle surface pressure', () => {
    expect(calculateOceanDepth(1)).toBe(0) // Sea level
  })

  it('should generate unique shark IDs', () => {
    const id1 = generateSharkId()
    const id2 = generateSharkId()

    expect(id1).toMatch(/^SHK-\d{4}-[A-Z0-9]{6}$/)
    expect(id2).toMatch(/^SHK-\d{4}-[A-Z0-9]{6}$/)
    expect(id1).not.toBe(id2)
  })

  it('should generate shark ID with custom prefix', () => {
    const id = generateSharkId('GWS') // Great White Shark
    expect(id).toMatch(/^GWS-\d{4}-[A-Z0-9]{6}$/)
  })
})

describe('Input Validation', () => {
  it('should validate email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    expect(validateEmail('invalid-email')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })

  it('should sanitize input strings', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World')
    expect(sanitizeInput('Safe text')).toBe('Safe text')
    expect(sanitizeInput('Text with "quotes" and \'apostrophes\'')).toBe('Text with "quotes" and \'apostrophes\'')
  })

  it('should handle null and undefined inputs', () => {
    expect(sanitizeInput(null)).toBe('')
    expect(sanitizeInput(undefined)).toBe('')
  })
})

describe('Error Handling', () => {
  it('should handle invalid temperature units', () => {
    expect(() => convertTemperature(25, 'X' as any, 'C')).toThrow('Invalid temperature unit')
    expect(() => convertTemperature(25, 'C', 'Y' as any)).toThrow('Invalid temperature unit')
  })

  it('should handle invalid coordinates', () => {
    expect(calculateDistance(NaN, 0, 0, 0)).toBeNaN()
    expect(calculateDistance(0, 0, NaN, 0)).toBeNaN()
    expect(formatCoordinates(NaN, 0)).toBe('Invalid coordinates')
  })

  it('should handle edge cases', () => {
    expect(calculateDistance(90, 0, -90, 0)).toBeCloseTo(20015, 0) // Pole to pole
    expect(convertTemperature(-273.15, 'C', 'K')).toBe(0) // Absolute zero
  })
})