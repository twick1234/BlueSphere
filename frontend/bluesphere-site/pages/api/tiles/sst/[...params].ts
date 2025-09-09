// SST Raster Tiles API endpoint
// Matches PRD specification for /tiles/sst/{z}/{x}/{y}.png
import { NextApiRequest, NextApiResponse } from 'next'

// Generate color for temperature value (simplified heat map coloring)
function getTemperatureColor(temp: number): { r: number, g: number, b: number, a: number } {
  // Temperature range: -2°C to 32°C
  // Normalize to 0-1
  const normalizedTemp = Math.max(0, Math.min(1, (temp + 2) / 34))
  
  // Color scale: Blue -> Cyan -> Green -> Yellow -> Orange -> Red
  let r, g, b
  
  if (normalizedTemp < 0.2) {
    // Blue to Cyan
    const t = normalizedTemp / 0.2
    r = 0
    g = Math.floor(t * 255)
    b = 255
  } else if (normalizedTemp < 0.4) {
    // Cyan to Green  
    const t = (normalizedTemp - 0.2) / 0.2
    r = 0
    g = 255
    b = Math.floor((1 - t) * 255)
  } else if (normalizedTemp < 0.6) {
    // Green to Yellow
    const t = (normalizedTemp - 0.4) / 0.2
    r = Math.floor(t * 255)
    g = 255
    b = 0
  } else if (normalizedTemp < 0.8) {
    // Yellow to Orange
    const t = (normalizedTemp - 0.6) / 0.2
    r = 255
    g = Math.floor((1 - t * 0.5) * 255)
    b = 0
  } else {
    // Orange to Red
    const t = (normalizedTemp - 0.8) / 0.2
    r = 255
    g = Math.floor((1 - t) * 128)
    b = 0
  }
  
  return { r, g, b, a: 180 } // Semi-transparent
}

// Generate realistic SST field for tile
function generateSSTField(z: number, x: number, y: number): number[][] {
  const tileSize = 256
  const field: number[][] = []
  
  // Calculate geographic bounds for this tile
  const n = Math.pow(2, z)
  const lonMin = (x / n) * 360 - 180
  const lonMax = ((x + 1) / n) * 360 - 180
  const latMax = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI
  const latMin = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI
  
  for (let py = 0; py < tileSize; py++) {
    const row: number[] = []
    for (let px = 0; px < tileSize; px++) {
      // Map pixel to geographic coordinates
      const lon = lonMin + (px / tileSize) * (lonMax - lonMin)
      const lat = latMax + (py / tileSize) * (latMin - latMax)
      
      // Generate realistic temperature based on latitude and some noise
      const baseTemp = 25 - (Math.abs(lat) * 0.4) // Temperature decreases with latitude
      const noise = 3 * Math.sin(lon * 0.1) * Math.cos(lat * 0.1) // Large-scale patterns
      const smallNoise = (Math.random() - 0.5) * 2 // Small-scale variation
      
      const temperature = baseTemp + noise + smallNoise
      row.push(Math.max(-2, Math.min(32, temperature)))
    }
    field.push(row)
  }
  
  return field
}

// Generate PNG-like response (simplified)
function generateTileResponse(z: number, x: number, y: number): Buffer {
  const tileSize = 256
  const sstField = generateSSTField(z, x, y)
  
  // Create a simple bitmap header + pixel data
  // This is a simplified PNG-like format
  const pixelData: number[] = []
  
  for (let py = 0; py < tileSize; py++) {
    for (let px = 0; px < tileSize; px++) {
      const temp = sstField[py][px]
      const color = getTemperatureColor(temp)
      
      pixelData.push(color.r, color.g, color.b, color.a)
    }
  }
  
  // Simple header + pixel data (this would normally be a proper PNG)
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, // Width: 256, Height: 256
    0x08, 0x06, 0x00, 0x00, 0x00, 0x5C, 0x72, 0x6B, 0xD5 // RGBA, etc.
  ])
  
  const pixels = Buffer.from(pixelData)
  return Buffer.concat([header, pixels])
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { params } = req.query
    
    if (!params || !Array.isArray(params) || params.length !== 3) {
      return res.status(400).json({ error: 'Invalid tile parameters. Expected format: /tiles/sst/{z}/{x}/{y}.png' })
    }
    
    const [zStr, xStr, yStr] = params
    const z = parseInt(zStr)
    const x = parseInt(xStr)
    const y = parseInt(yStr.replace('.png', ''))
    
    if (isNaN(z) || isNaN(x) || isNaN(y)) {
      return res.status(400).json({ error: 'Invalid tile coordinates' })
    }
    
    // Validate zoom level (typical web map range)
    if (z < 0 || z > 18) {
      return res.status(400).json({ error: 'Zoom level must be between 0 and 18' })
    }
    
    // Validate tile coordinates for this zoom level
    const maxTile = Math.pow(2, z) - 1
    if (x < 0 || x > maxTile || y < 0 || y > maxTile) {
      return res.status(400).json({ error: `Tile coordinates out of range for zoom level ${z}` })
    }
    
    // Generate tile data
    const tileBuffer = generateTileResponse(z, x, y)
    
    // Set appropriate headers for tile serving
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=3600') // 1 hour cache
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('X-Tile-Coords', `${z}/${x}/${y}`)
    res.setHeader('X-Generated-At', new Date().toISOString())
    
    res.status(200).send(tileBuffer)
    
  } catch (error) {
    console.error('Error generating SST tile:', error)
    res.status(500).json({ error: 'Internal server error generating tile' })
  }
}