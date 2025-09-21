/*
 * LayeredMapInterface - Google Maps-style Interface
 * Advanced marine monitoring with toggleable data layers
 */

import React, { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Types for marine data layers
interface MarineLayer {
  id: string;
  name: string;
  type: 'sharks' | 'temperature' | 'protected-areas' | 'research-stations' | 'shipping' | 'pollution';
  enabled: boolean;
  opacity: number;
  color: string;
  icon: string;
}

interface SharkData {
  id: string;
  species: string;
  position: [number, number];
  depth: number;
  temperature: number;
  timestamp: Date;
  status: string;
}

interface ResearchStation {
  id: string;
  name: string;
  position: [number, number];
  type: 'buoy' | 'platform' | 'vessel' | 'shore';
  active: boolean;
  sensors: string[];
}

interface ProtectedArea {
  id: string;
  name: string;
  boundaries: [number, number][];
  protection_level: 'strict' | 'moderate' | 'buffer';
  established: string;
}

const LayeredMapInterface: React.FC = () => {
  // Layer management state
  const [activeLayers, setActiveLayers] = useState<MarineLayer[]>([
    { id: 'sharks', name: 'Shark Tracking', type: 'sharks', enabled: true, opacity: 0.8, color: '#0066cc', icon: '🦈' },
    { id: 'temperature', name: 'Sea Temperature', type: 'temperature', enabled: false, opacity: 0.6, color: '#ff4444', icon: '🌡️' },
    { id: 'protected', name: 'Protected Areas', type: 'protected-areas', enabled: false, opacity: 0.4, color: '#00aa00', icon: '🛡️' },
    { id: 'research', name: 'Research Stations', type: 'research-stations', enabled: false, opacity: 0.9, color: '#8800cc', icon: '🔬' },
    { id: 'shipping', name: 'Shipping Routes', type: 'shipping', enabled: false, opacity: 0.5, color: '#ff8800', icon: '🚢' },
    { id: 'pollution', name: 'Pollution Zones', type: 'pollution', enabled: false, opacity: 0.7, color: '#cc0000', icon: '☠️' }
  ]);

  const [mapCenter] = useState<[number, number]>([20, 0]); // Global ocean view
  const [mapZoom] = useState(3);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  // Generate sample marine data
  const marineData = useMemo(() => {
    const sharks: SharkData[] = [];
    const stations: ResearchStation[] = [];
    const protectedAreas: ProtectedArea[] = [];

    // Generate global shark data
    for (let i = 0; i < 500; i++) {
      sharks.push({
        id: `shark-${i}`,
        species: ['Great White', 'Tiger', 'Bull', 'Hammerhead', 'Whale'][Math.floor(Math.random() * 5)],
        position: [
          -60 + Math.random() * 120, // Latitude: -60 to 60
          -180 + Math.random() * 360  // Longitude: -180 to 180
        ],
        depth: Math.floor(Math.random() * 200),
        temperature: 15 + Math.random() * 15,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30),
        status: ['active', 'migrating', 'feeding', 'resting'][Math.floor(Math.random() * 4)]
      });
    }

    // Generate research stations
    const stationLocations = [
      [-157.8583, 21.3099], // Hawaii
      [-80.1918, 25.7617],  // Florida
      [145.7781, -16.2863], // Great Barrier Reef
      [2.3522, 53.7986],    // North Sea
      [-58.3816, -62.1048], // Antarctica
      [55.2708, 25.2048],   // Persian Gulf
      [103.8198, 1.3521],   // Singapore Strait
      [-9.1393, 38.7223]    // Portugal Coast
    ];

    stationLocations.forEach((pos, i) => {
      stations.push({
        id: `station-${i}`,
        name: `Research Station ${i + 1}`,
        position: [pos[1], pos[0]] as [number, number],
        type: ['buoy', 'platform', 'vessel', 'shore'][Math.floor(Math.random() * 4)] as any,
        active: Math.random() > 0.2,
        sensors: ['temperature', 'salinity', 'pH', 'dissolved_oxygen', 'turbidity'].slice(0, 2 + Math.floor(Math.random() * 3))
      });
    });

    // Generate protected areas
    const protectedLocations = [
      { name: 'Great Barrier Reef Marine Park', center: [-16.2863, 145.7781], radius: 2 },
      { name: 'Monterey Bay National Marine Sanctuary', center: [36.7783, -121.9018], radius: 1 },
      { name: 'Galápagos Marine Reserve', center: [-0.9538, -91.0232], radius: 1.5 },
      { name: 'Papahānaumokuākea', center: [25.0, -170.0], radius: 3 },
      { name: 'Ross Sea Marine Protected Area', center: [-75.0, 180.0], radius: 4 }
    ];

    protectedLocations.forEach((area, i) => {
      const boundaries: [number, number][] = [];
      const centerLat = area.center[0];
      const centerLng = area.center[1];
      const radius = area.radius;

      // Generate circular boundary
      for (let angle = 0; angle < 360; angle += 30) {
        const radians = (angle * Math.PI) / 180;
        const lat = centerLat + radius * Math.cos(radians);
        const lng = centerLng + radius * Math.sin(radians);
        boundaries.push([lat, lng]);
      }

      protectedAreas.push({
        id: `protected-${i}`,
        name: area.name,
        boundaries,
        protection_level: ['strict', 'moderate', 'buffer'][Math.floor(Math.random() * 3)] as any,
        established: `${1990 + Math.floor(Math.random() * 30)}`
      });
    });

    return { sharks, stations, protectedAreas };
  }, []);

  // Layer toggle handler
  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  }, []);

  // Opacity adjustment handler
  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setActiveLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    );
  }, []);

  return (
    <div className="layered-map-interface">
      <style jsx>{`
        .layered-map-interface {
          position: relative;
          width: 100%;
          height: 600px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .map-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .layer-control-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          min-width: 280px;
          max-height: 500px;
          overflow-y: auto;
        }

        .layer-control-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .layer-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .layer-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .layer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .layer-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
        }

        .layer-toggle {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .layer-toggle.enabled {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .opacity-control {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .opacity-slider {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
        }

        .opacity-value {
          font-size: 0.8rem;
          color: #6b7280;
          min-width: 35px;
        }

        .map-legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }

        .legend-title {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #374151;
        }

        .feature-popup {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          z-index: 2000;
          max-width: 400px;
          width: 90%;
        }

        @media (max-width: 768px) {
          .layer-control-panel {
            top: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
            max-height: 300px;
          }

          .map-legend {
            bottom: 10px;
            left: 10px;
            right: 10px;
          }

          .legend-items {
            justify-content: center;
          }
        }
      `}</style>

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Shark Tracking Layer */}
          {activeLayers.find(l => l.id === 'sharks')?.enabled && (
            <>
              {marineData.sharks.slice(0, 100).map((shark) => (
                <Marker
                  key={shark.id}
                  position={shark.position}
                  opacity={activeLayers.find(l => l.id === 'sharks')?.opacity || 0.8}
                >
                  <Popup>
                    <div>
                      <h3>🦈 {shark.species} Shark</h3>
                      <p><strong>Depth:</strong> {shark.depth}m</p>
                      <p><strong>Temperature:</strong> {shark.temperature.toFixed(1)}°C</p>
                      <p><strong>Status:</strong> {shark.status}</p>
                      <p><strong>Last Ping:</strong> {shark.timestamp.toLocaleDateString()}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}

          {/* Research Stations Layer */}
          {activeLayers.find(l => l.id === 'research')?.enabled && (
            <>
              {marineData.stations.map((station) => (
                <Marker
                  key={station.id}
                  position={station.position}
                  opacity={activeLayers.find(l => l.id === 'research')?.opacity || 0.9}
                >
                  <Popup>
                    <div>
                      <h3>🔬 {station.name}</h3>
                      <p><strong>Type:</strong> {station.type}</p>
                      <p><strong>Status:</strong> {station.active ? 'Active' : 'Inactive'}</p>
                      <p><strong>Sensors:</strong> {station.sensors.join(', ')}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}

          {/* Protected Areas Layer */}
          {activeLayers.find(l => l.id === 'protected')?.enabled && (
            <>
              {marineData.protectedAreas.map((area) => (
                <React.Fragment key={area.id}>
                  <Polyline
                    positions={area.boundaries}
                    color="#00aa00"
                    opacity={activeLayers.find(l => l.id === 'protected')?.opacity || 0.4}
                    fillOpacity={0.2}
                  />
                  <Circle
                    center={area.boundaries[0]}
                    radius={50000}
                    color="#00aa00"
                    fillColor="#00aa00"
                    fillOpacity={0.1}
                  >
                    <Popup>
                      <div>
                        <h3>🛡️ {area.name}</h3>
                        <p><strong>Protection Level:</strong> {area.protection_level}</p>
                        <p><strong>Established:</strong> {area.established}</p>
                      </div>
                    </Popup>
                  </Circle>
                </React.Fragment>
              ))}
            </>
          )}
        </MapContainer>

        {/* Layer Control Panel */}
        <div className="layer-control-panel">
          <div className="layer-control-title">
            🗺️ Map Layers
          </div>

          {activeLayers.map((layer) => (
            <div key={layer.id} className="layer-item">
              <div className="layer-header">
                <div className="layer-name">
                  <span>{layer.icon}</span>
                  <span>{layer.name}</span>
                </div>
                <div
                  className={`layer-toggle ${layer.enabled ? 'enabled' : ''}`}
                  onClick={() => toggleLayer(layer.id)}
                >
                  {layer.enabled && '✓'}
                </div>
              </div>

              {layer.enabled && (
                <div className="opacity-control">
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Opacity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                    className="opacity-slider"
                  />
                  <span className="opacity-value">{Math.round(layer.opacity * 100)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Map Legend */}
        <div className="map-legend">
          <div className="legend-title">Legend</div>
          <div className="legend-items">
            {activeLayers.filter(l => l.enabled).map((layer) => (
              <div key={layer.id} className="legend-item">
                <span>{layer.icon}</span>
                <span>{layer.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayeredMapInterface;