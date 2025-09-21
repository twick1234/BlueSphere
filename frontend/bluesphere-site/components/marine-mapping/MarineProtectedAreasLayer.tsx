/*
 * BlueSphere Marine Protected Areas Layer
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Visualization of marine protected areas, no-take zones, and conservation boundaries
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Polygon, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { MarineMapLayer, MapBounds } from './MarineMapEngine'

interface MarineProtectedArea {
  id: string
  name: string
  designation: 'Marine Park' | 'No-Take Zone' | 'UNESCO Biosphere' | 'World Heritage' | 'National Monument' | 'Marine Sanctuary' | 'Critical Habitat'
  country: string
  area_km2: number
  established: string
  iucn_category: 'Ia' | 'Ib' | 'II' | 'III' | 'IV' | 'V' | 'VI'
  protection_level: 'Strict' | 'High' | 'Moderate' | 'Low'
  boundaries: [number, number][]
  center: [number, number]
  key_species?: string[]
  threats?: string[]
  management_authority: string
  regulations: string[]
  effectiveness_score?: number
}

interface MarineProtectedAreasLayerProps {
  layer: MarineMapLayer
  onFeatureSelect: (feature: any) => void
  performanceMode: boolean
  bounds?: MapBounds
}

// Create MPA icon based on protection level and designation
const createMPAIcon = (mpa: MarineProtectedArea) => {
  let icon = '🛡️'
  let color = '#059669'

  switch (mpa.designation) {
    case 'No-Take Zone':
      icon = '🚫'
      color = '#dc2626'
      break
    case 'UNESCO Biosphere':
      icon = '🌍'
      color = '#0891b2'
      break
    case 'World Heritage':
      icon = '🏛️'
      color = '#7c3aed'
      break
    case 'National Monument':
      icon = '🗿'
      color = '#ea580c'
      break
    case 'Marine Sanctuary':
      icon = '🏛️'
      color = '#059669'
      break
    case 'Critical Habitat':
      icon = '🐠'
      color = '#0d9488'
      break
    default:
      icon = '🛡️'
      color = '#059669'
  }

  const size = mpa.area_km2 > 10000 ? 32 : mpa.area_km2 > 1000 ? 28 : 24

  return L.divIcon({
    html: `
      <div class="mpa-marker" style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.6}px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
      ">
        ${icon}

        <!-- Protection level indicator -->
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${mpa.protection_level === 'Strict' ? '#dc2626' :
                      mpa.protection_level === 'High' ? '#f59e0b' :
                      mpa.protection_level === 'Moderate' ? '#10b981' : '#6b7280'};
          border: 2px solid white;
        "></div>
      </div>
    `,
    className: 'custom-mpa-icon',
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2]
  })
}

// Get polygon styling based on MPA properties
const getMPAStyle = (mpa: MarineProtectedArea, isSelected: boolean = false) => {
  let fillColor = '#059669'
  let color = '#047857'

  switch (mpa.protection_level) {
    case 'Strict':
      fillColor = '#dc2626'
      color = '#b91c1c'
      break
    case 'High':
      fillColor = '#f59e0b'
      color = '#d97706'
      break
    case 'Moderate':
      fillColor = '#10b981'
      color = '#059669'
      break
    case 'Low':
      fillColor = '#6b7280'
      color = '#4b5563'
      break
  }

  return {
    fillColor,
    color,
    weight: isSelected ? 3 : 2,
    opacity: isSelected ? 1 : 0.8,
    fillOpacity: isSelected ? 0.4 : 0.2,
    dashArray: mpa.designation === 'No-Take Zone' ? '0' : '5, 5'
  }
}

const MarineProtectedAreasLayer: React.FC<MarineProtectedAreasLayerProps> = ({
  layer,
  onFeatureSelect,
  performanceMode,
  bounds
}) => {
  const [mpas, setMpas] = useState<MarineProtectedArea[]>([])
  const [selectedMPAId, setSelectedMPAId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load Marine Protected Areas data
  useEffect(() => {
    const loadMPAs = async () => {
      setIsLoading(true)
      try {
        // In a real application, this would fetch from a marine protected areas API
        // For now, we'll generate comprehensive realistic data
        const mpaData = generateMPAData()
        setMpas(mpaData)
      } catch (error) {
        console.error('Failed to load MPA data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMPAs()
  }, [])

  // Filter MPAs based on bounds for performance
  const visibleMPAs = useMemo(() => {
    if (!bounds || performanceMode) return mpas.slice(0, 50) // Limit in performance mode

    return mpas.filter(mpa => {
      const [centerLat, centerLon] = mpa.center
      return centerLat >= bounds.south &&
             centerLat <= bounds.north &&
             centerLon >= bounds.west &&
             centerLon <= bounds.east
    })
  }, [mpas, bounds, performanceMode])

  // Group MPAs by designation for better organization
  const mpasByDesignation = useMemo(() => {
    const grouped: Record<string, MarineProtectedArea[]> = {}

    visibleMPAs.forEach(mpa => {
      if (!grouped[mpa.designation]) {
        grouped[mpa.designation] = []
      }
      grouped[mpa.designation].push(mpa)
    })

    return grouped
  }, [visibleMPAs])

  const handleMPAClick = (mpa: MarineProtectedArea) => {
    setSelectedMPAId(mpa.id === selectedMPAId ? null : mpa.id)
    onFeatureSelect({
      type: 'marine_protected_area',
      data: mpa,
      coordinates: mpa.center
    })
  }

  if (!layer.enabled) return null

  return (
    <>
      {/* Render MPAs by designation */}
      {Object.entries(mpasByDesignation).map(([designation, designationMPAs]) => (
        <React.Fragment key={designation}>
          {designationMPAs.map(mpa => (
            <React.Fragment key={mpa.id}>
              {/* MPA boundary polygon */}
              <Polygon
                positions={mpa.boundaries}
                pathOptions={getMPAStyle(mpa, selectedMPAId === mpa.id)}
                eventHandlers={{
                  click: () => handleMPAClick(mpa)
                }}
              >
                <Popup>
                  <div className="mpa-popup">
                    <div className="popup-header">
                      <h3>{mpa.name}</h3>
                      <span className={`designation-badge ${mpa.designation.toLowerCase().replace(/\s+/g, '-')}`}>
                        {mpa.designation}
                      </span>
                    </div>

                    <div className="mpa-details">
                      <div className="detail-row">
                        <span className="label">Country:</span>
                        <span className="value">{mpa.country}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Area:</span>
                        <span className="value">{mpa.area_km2.toLocaleString()} km²</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Established:</span>
                        <span className="value">{mpa.established}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">IUCN Category:</span>
                        <span className="value">{mpa.iucn_category}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Protection Level:</span>
                        <span className={`value protection-${mpa.protection_level.toLowerCase()}`}>
                          {mpa.protection_level}
                        </span>
                      </div>
                      {mpa.effectiveness_score && (
                        <div className="detail-row">
                          <span className="label">Effectiveness:</span>
                          <span className="value">{mpa.effectiveness_score}/100</span>
                        </div>
                      )}
                    </div>

                    {mpa.key_species && (
                      <div className="key-species">
                        <h4>Key Species:</h4>
                        <div className="species-list">
                          {mpa.key_species.map((species, index) => (
                            <span key={index} className="species-tag">{species}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {mpa.regulations && (
                      <div className="regulations">
                        <h4>Regulations:</h4>
                        <ul>
                          {mpa.regulations.slice(0, 3).map((regulation, index) => (
                            <li key={index}>{regulation}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="popup-footer">
                      <small>Managed by {mpa.management_authority}</small>
                    </div>
                  </div>
                </Popup>
              </Polygon>

              {/* Central marker for identification */}
              <Marker
                position={mpa.center}
                icon={createMPAIcon(mpa)}
                eventHandlers={{
                  click: () => handleMPAClick(mpa)
                }}
                opacity={layer.opacity}
              />

              {/* Buffer zone indicator for large MPAs */}
              {mpa.area_km2 > 5000 && (
                <Circle
                  center={mpa.center}
                  radius={Math.sqrt(mpa.area_km2) * 1000}
                  pathOptions={{
                    color: getMPAStyle(mpa).color,
                    weight: 1,
                    opacity: 0.3,
                    fillOpacity: 0.05,
                    dashArray: '10, 10'
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      <style jsx>{`
        .mpa-popup {
          min-width: 320px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .popup-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          flex: 1;
          margin-right: 0.5rem;
        }

        .designation-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .designation-badge.marine-park {
          background: #dcfce7;
          color: #166534;
        }

        .designation-badge.no-take-zone {
          background: #fee2e2;
          color: #991b1b;
        }

        .designation-badge.unesco-biosphere {
          background: #dbeafe;
          color: #1e40af;
        }

        .designation-badge.world-heritage {
          background: #ede9fe;
          color: #6b21a8;
        }

        .designation-badge.national-monument {
          background: #fed7aa;
          color: #c2410c;
        }

        .designation-badge.marine-sanctuary {
          background: #d1fae5;
          color: #065f46;
        }

        .designation-badge.critical-habitat {
          background: #ccfbf1;
          color: #134e4a;
        }

        .mpa-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-row .label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          min-width: 100px;
        }

        .detail-row .value {
          font-size: 0.875rem;
          color: #1f2937;
          font-weight: 600;
          text-align: right;
        }

        .value.protection-strict {
          color: #dc2626;
        }

        .value.protection-high {
          color: #f59e0b;
        }

        .value.protection-moderate {
          color: #10b981;
        }

        .value.protection-low {
          color: #6b7280;
        }

        .key-species {
          margin-bottom: 1rem;
        }

        .key-species h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .species-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .species-tag {
          padding: 0.125rem 0.375rem;
          background: #f3f4f6;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .regulations {
          margin-bottom: 1rem;
        }

        .regulations h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .regulations ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.8rem;
          color: #4b5563;
        }

        .regulations li {
          margin-bottom: 0.25rem;
        }

        .popup-footer {
          padding-top: 0.5rem;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .popup-footer small {
          color: #6b7280;
          font-size: 0.75rem;
        }

        :global(.custom-mpa-icon) {
          z-index: 200;
        }

        :global(.custom-mpa-icon:hover) {
          z-index: 1000;
        }
      `}</style>
    </>
  )
}

// Generate comprehensive MPA data
function generateMPAData(): MarineProtectedArea[] {
  const mpas: MarineProtectedArea[] = [
    // Pacific Ocean MPAs
    {
      id: 'papahānaumokuākea',
      name: 'Papahānaumokuākea',
      designation: 'National Monument',
      country: 'United States',
      area_km2: 362074,
      established: '2006',
      iucn_category: 'Ia',
      protection_level: 'Strict',
      boundaries: [
        [28.0, -178.0], [28.0, -160.0], [23.0, -160.0], [23.0, -178.0]
      ],
      center: [25.5, -169.0],
      key_species: ['Hawaiian Monk Seal', 'Green Sea Turtle', 'Laysan Albatross', 'Hawaiian Hoary Bat'],
      threats: ['Climate Change', 'Marine Debris', 'Invasive Species'],
      management_authority: 'NOAA & US Fish and Wildlife Service',
      regulations: ['No commercial fishing', 'No recreational fishing', 'No anchoring', 'Permit required for research'],
      effectiveness_score: 95
    },
    {
      id: 'great_barrier_reef',
      name: 'Great Barrier Reef Marine Park',
      designation: 'Marine Park',
      country: 'Australia',
      area_km2: 344400,
      established: '1975',
      iucn_category: 'VI',
      protection_level: 'High',
      boundaries: [
        [-10.0, 142.0], [-10.0, 154.0], [-24.0, 154.0], [-24.0, 142.0]
      ],
      center: [-17.0, 148.0],
      key_species: ['Coral Trout', 'Giant Clam', 'Dugong', 'Green Sea Turtle', 'Humpback Whale'],
      threats: ['Coral Bleaching', 'Crown-of-thorns Starfish', 'Water Quality', 'Coastal Development'],
      management_authority: 'Great Barrier Reef Marine Park Authority',
      regulations: ['Zoned management', 'No-take areas', 'Fishing restrictions', 'Tourism permits required'],
      effectiveness_score: 78
    },
    {
      id: 'galapagos_marine_reserve',
      name: 'Galápagos Marine Reserve',
      designation: 'UNESCO Biosphere',
      country: 'Ecuador',
      area_km2: 133000,
      established: '1998',
      iucn_category: 'VI',
      protection_level: 'High',
      boundaries: [
        [2.0, -92.0], [2.0, -89.0], [-2.0, -89.0], [-2.0, -92.0]
      ],
      center: [0.0, -90.5],
      key_species: ['Galápagos Shark', 'Hammerhead Shark', 'Marine Iguana', 'Galápagos Penguin', 'Whale Shark'],
      threats: ['Overfishing', 'Climate Change', 'Tourism Pressure', 'Invasive Species'],
      management_authority: 'Galápagos National Park Directorate',
      regulations: ['No industrial fishing', 'Artisanal fishing zones', 'No-take zones', 'Tourism quotas'],
      effectiveness_score: 85
    },

    // Atlantic Ocean MPAs
    {
      id: 'stellwagen_bank',
      name: 'Stellwagen Bank National Marine Sanctuary',
      designation: 'Marine Sanctuary',
      country: 'United States',
      area_km2: 2181,
      established: '1992',
      iucn_category: 'IV',
      protection_level: 'Moderate',
      boundaries: [
        [42.8, -70.6], [42.8, -70.0], [42.0, -70.0], [42.0, -70.6]
      ],
      center: [42.4, -70.3],
      key_species: ['Humpback Whale', 'Fin Whale', 'Atlantic Cod', 'Sand Lance', 'Bluefin Tuna'],
      threats: ['Ship Strikes', 'Fishing Gear Entanglement', 'Noise Pollution', 'Climate Change'],
      management_authority: 'NOAA National Marine Sanctuaries',
      regulations: ['Whale watching guidelines', 'Fishing regulations', 'No dumping', 'Speed restrictions'],
      effectiveness_score: 72
    },
    {
      id: 'flower_garden_banks',
      name: 'Flower Garden Banks National Marine Sanctuary',
      designation: 'Marine Sanctuary',
      country: 'United States',
      area_km2: 145,
      established: '1992',
      iucn_category: 'Ia',
      protection_level: 'Strict',
      boundaries: [
        [28.1, -94.0], [28.1, -93.5], [27.8, -93.5], [27.8, -94.0]
      ],
      center: [27.95, -93.75],
      key_species: ['Brain Coral', 'Manta Ray', 'Whale Shark', 'Hammerhead Shark', 'Loggerhead Turtle'],
      threats: ['Oil Spills', 'Anchor Damage', 'Climate Change', 'Hurricane Damage'],
      management_authority: 'NOAA National Marine Sanctuaries',
      regulations: ['No anchoring', 'No fishing', 'No collecting', 'No discharge'],
      effectiveness_score: 90
    },

    // Indian Ocean MPAs
    {
      id: 'chagos_archipelago',
      name: 'Chagos Archipelago Marine Protected Area',
      designation: 'No-Take Zone',
      country: 'United Kingdom',
      area_km2: 640000,
      established: '2010',
      iucn_category: 'Ia',
      protection_level: 'Strict',
      boundaries: [
        [-4.0, 70.0], [-4.0, 74.0], [-8.0, 74.0], [-8.0, 70.0]
      ],
      center: [-6.0, 72.0],
      key_species: ['Coconut Crab', 'Green Sea Turtle', 'Blacktip Shark', 'Giant Trevally', 'Red-footed Booby'],
      threats: ['Climate Change', 'Illegal Fishing', 'Ocean Acidification'],
      management_authority: 'British Indian Ocean Territory Administration',
      regulations: ['Complete fishing ban', 'No extraction', 'Research permits only', 'No commercial activities'],
      effectiveness_score: 93
    },

    // Mediterranean MPAs
    {
      id: 'pelagos_sanctuary',
      name: 'Pelagos Sanctuary',
      designation: 'UNESCO Biosphere',
      country: 'France/Italy/Monaco',
      area_km2: 87500,
      established: '1999',
      iucn_category: 'VI',
      protection_level: 'Moderate',
      boundaries: [
        [44.0, 6.0], [44.0, 10.0], [41.0, 10.0], [41.0, 6.0]
      ],
      center: [42.5, 8.0],
      key_species: ['Sperm Whale', 'Fin Whale', 'Pilot Whale', 'Striped Dolphin', 'Bluefin Tuna'],
      threats: ['Ship Strikes', 'Noise Pollution', 'Plastic Pollution', 'Overfishing'],
      management_authority: 'Trilateral Commission (France, Italy, Monaco)',
      regulations: ['Speed limits for vessels', 'Whale watching codes', 'Fishing quotas', 'Noise restrictions'],
      effectiveness_score: 68
    },

    // Additional smaller but important MPAs
    {
      id: 'monterey_bay',
      name: 'Monterey Bay National Marine Sanctuary',
      designation: 'Marine Sanctuary',
      country: 'United States',
      area_km2: 15744,
      established: '1992',
      iucn_category: 'V',
      protection_level: 'Moderate',
      boundaries: [
        [37.5, -123.0], [37.5, -121.8], [35.5, -121.8], [35.5, -123.0]
      ],
      center: [36.5, -122.4],
      key_species: ['Sea Otter', 'Blue Whale', 'Leatherback Turtle', 'Great White Shark', 'Kelp Forest Species'],
      threats: ['Agricultural Runoff', 'Plastic Pollution', 'Climate Change', 'Vessel Traffic'],
      management_authority: 'NOAA National Marine Sanctuaries',
      regulations: ['Water quality standards', 'Vessel discharge restrictions', 'Research coordination', 'Public education'],
      effectiveness_score: 80
    },
    {
      id: 'ningaloo_reef',
      name: 'Ningaloo Marine Park',
      designation: 'World Heritage',
      country: 'Australia',
      area_km2: 5000,
      established: '1987',
      iucn_category: 'II',
      protection_level: 'High',
      boundaries: [
        [-21.5, 113.5], [-21.5, 114.5], [-24.0, 114.5], [-24.0, 113.5]
      ],
      center: [-22.75, 114.0],
      key_species: ['Whale Shark', 'Manta Ray', 'Humpback Whale', 'Loggerhead Turtle', 'Coral Trout'],
      threats: ['Tourism Pressure', 'Climate Change', 'Cyclones', 'Coastal Development'],
      management_authority: 'Department of Biodiversity, Conservation and Attractions',
      regulations: ['Sanctuary zones', 'Recreation zones', 'Commercial fishing zones', 'Whale shark interaction rules'],
      effectiveness_score: 88
    }
  ]

  return mpas
}

export default MarineProtectedAreasLayer