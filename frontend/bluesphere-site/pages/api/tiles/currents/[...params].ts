// Ocean Currents Vector Tiles API endpoint
// Matches PRD specification for /tiles/currents/{z}/{x}/{y}.mvt
import { NextApiRequest, NextApiResponse } from 'next'

interface CurrentVector {
  lat: number
  lon: number
  u_velocity: number // East-west component (m/s)
  v_velocity: number // North-south component (m/s)
  magnitude: number
  direction: number // degrees from north
}

// Generate realistic ocean current vectors for a tile
function generateCurrentField(z: number, x: number, y: number): CurrentVector[] {
  const vectors: CurrentVector[] = []
  
  // Calculate geographic bounds for this tile
  const n = Math.pow(2, z)
  const lonMin = (x / n) * 360 - 180
  const lonMax = ((x + 1) / n) * 360 - 180
  const latMax = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI
  const latMin = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI
  
  // Generate current vectors at regular grid points
  const gridSpacing = Math.max(1, Math.floor(20 - z)) // More dense at higher zoom
  const lonStep = (lonMax - lonMin) / gridSpacing
  const latStep = (latMax - latMin) / gridSpacing
  
  for (let i = 0; i <= gridSpacing; i++) {
    for (let j = 0; j <= gridSpacing; j++) {
      const lon = lonMin + i * lonStep
      const lat = latMax - j * latStep
      
      // Generate realistic current patterns
      // Simulate major ocean currents and gyres
      
      // Gulf Stream-like current (strong eastward flow around 30-40N, -80 to -40W)
      let u = 0, v = 0
      
      if (lat > 25 && lat < 45 && lon > -80 && lon < -40) {
        u = 0.8 + 0.3 * Math.sin((lon + 60) * Math.PI / 40) // Strong eastward flow
        v = 0.2 * Math.cos((lat - 35) * Math.PI / 20) // Some meandering
      }
      // California Current (southward flow along west coast)
      else if (lat > 30 && lat < 50 && lon > -130 && lon < -115) {
        u = -0.1 + 0.1 * Math.cos((lat - 40) * Math.PI / 20)
        v = -0.4 + 0.2 * Math.sin((lon + 122) * Math.PI / 15) // Southward flow
      }
      // Kuroshio Current (northward flow along Japan)
      else if (lat > 20 && lat < 40 && lon > 130 && lon < 150) {
        u = 0.3 * Math.sin((lat - 30) * Math.PI / 20)
        v = 0.6 + 0.2 * Math.cos((lon - 140) * Math.PI / 20) // Northward flow
      }
      // Antarctic Circumpolar Current
      else if (lat < -40) {
        u = 0.5 + 0.3 * Math.sin(lon * Math.PI / 90) // Strong eastward flow
        v = 0.1 * Math.cos(lon * Math.PI / 45)
      }
      // Equatorial currents
      else if (Math.abs(lat) < 10) {
        u = 0.4 + 0.2 * Math.sin(lon * Math.PI / 60) // Eastward trade wind driven
        v = 0.1 * Math.sin(lat * Math.PI / 10)
      }
      // General circulation patterns
      else {
        // Coriolis-influenced circulation
        const f = 2 * 7.27e-5 * Math.sin(lat * Math.PI / 180) // Coriolis parameter
        u = 0.2 * Math.sin(lon * Math.PI / 60) + 0.1 * Math.cos(lat * Math.PI / 90)
        v = 0.2 * Math.cos(lon * Math.PI / 60) * Math.sign(f)
      }
      
      // Add some random variation
      u += (Math.random() - 0.5) * 0.1
      v += (Math.random() - 0.5) * 0.1
      
      // Calculate magnitude and direction
      const magnitude = Math.sqrt(u * u + v * v)
      const direction = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360 // degrees from north
      
      if (magnitude > 0.05) { // Only include significant currents
        vectors.push({
          lat: Math.round(lat * 10000) / 10000,
          lon: Math.round(lon * 10000) / 10000,
          u_velocity: Math.round(u * 1000) / 1000,
          v_velocity: Math.round(v * 1000) / 1000,
          magnitude: Math.round(magnitude * 1000) / 1000,
          direction: Math.round(direction * 10) / 10
        })
      }
    }
  }
  
  return vectors
}

// Generate MVT-like response (simplified vector tile format)
function generateVectorTileResponse(vectors: CurrentVector[]): Buffer {
  // This would normally be a proper Mapbox Vector Tile (MVT) format
  // For simplicity, we'll return a JSON-based format that can be parsed by the frontend
  
  const vectorTileData = {
    type: "FeatureCollection",
    features: vectors.map((vector, index) => ({
      type: "Feature",
      id: index,
      geometry: {
        type: "Point",
        coordinates: [vector.lon, vector.lat]
      },
      properties: {
        u_velocity: vector.u_velocity,
        v_velocity: vector.v_velocity,
        magnitude: vector.magnitude,
        direction: vector.direction,
        arrow_length: Math.min(20, vector.magnitude * 30), // Scale for visualization
        color: getCurrentColor(vector.magnitude)
      }
    }))
  }
  
  return Buffer.from(JSON.stringify(vectorTileData))
}

// Get color for current magnitude
function getCurrentColor(magnitude: number): string {
  if (magnitude < 0.1) return "#0066CC" // Light blue - slow
  if (magnitude < 0.3) return "#00AA00" // Green - moderate
  if (magnitude < 0.6) return "#FFAA00" // Orange - fast
  return "#FF3300" // Red - very fast
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { params } = req.query
    
    if (!params || !Array.isArray(params) || params.length !== 3) {
      return res.status(400).json({ error: 'Invalid tile parameters. Expected format: /tiles/currents/{z}/{x}/{y}.mvt' })
    }
    
    const [zStr, xStr, yStr] = params
    const z = parseInt(zStr)
    const x = parseInt(xStr)
    const y = parseInt(yStr.replace('.mvt', ''))
    
    if (isNaN(z) || isNaN(x) || isNaN(y)) {
      return res.status(400).json({ error: 'Invalid tile coordinates' })
    }
    
    // Validate zoom level
    if (z < 0 || z > 18) {
      return res.status(400).json({ error: 'Zoom level must be between 0 and 18' })
    }
    
    // Only generate currents for zoom levels where they're meaningful
    if (z < 2) {
      return res.status(200).json({ 
        type: "FeatureCollection", 
        features: [],
        message: "Current data not available at this zoom level"
      })
    }
    
    // Validate tile coordinates for this zoom level
    const maxTile = Math.pow(2, z) - 1
    if (x < 0 || x > maxTile || y < 0 || y > maxTile) {
      return res.status(400).json({ error: `Tile coordinates out of range for zoom level ${z}` })
    }
    
    // Generate current field
    const currentVectors = generateCurrentField(z, x, y)
    const tileBuffer = generateVectorTileResponse(currentVectors)
    
    // Set appropriate headers for vector tile serving
    res.setHeader('Content-Type', 'application/json') // Simplified - would normally be application/x-protobuf
    res.setHeader('Cache-Control', 'public, max-age=1800') // 30 minute cache (currents change more frequently)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('X-Tile-Coords', `${z}/${x}/${y}`)
    res.setHeader('X-Vector-Count', currentVectors.length.toString())
    res.setHeader('X-Generated-At', new Date().toISOString())
    
    res.status(200).send(tileBuffer)
    
  } catch (error) {
    console.error('Error generating current vectors:', error)
    res.status(500).json({ error: 'Internal server error generating current vectors' })
  }
}