import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SharkData } from '../lib/shark-tracking';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface SharkMapProps {
  sharks: SharkData[];
  onSharkSelect?: (shark: SharkData) => void;
  selectedSharkId?: string;
  className?: string;
}

const SharkMap: React.FC<SharkMapProps> = ({
  sharks,
  onSharkSelect,
  selectedSharkId,
  className = ''
}) => {
  const [map, setMap] = useState<any>(null);

  const handleMapReady = () => {
    // Map is ready
  };

  // Custom shark icon
  const createSharkIcon = (shark: SharkData, isSelected: boolean = false) => {
    if (typeof window === 'undefined') return null;

    const L = require('leaflet');

    const size = isSelected ? 40 : 30;
    const color = shark.status === 'Active' ? '#EF4444' : '#9CA3AF'; // red for active, gray for inactive

    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: ${isSelected ? '3px solid #FFFFFF' : '2px solid #FFFFFF'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size > 35 ? '20px' : '16px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          🦈
        </div>
      `,
      className: 'shark-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600';
      case 'Inactive': return 'text-yellow-600';
      case 'Lost_Signal': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatLastSeen = (lastPing: string) => {
    const now = new Date();
    const pingDate = new Date(lastPing);
    const diffHours = Math.floor((now.getTime() - pingDate.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map */}
      <MapContainer
        center={[35.0, -75.0]} // Atlantic Ocean center
        zoom={4}
        style={{ height: '500px', width: '100%' }}
        whenReady={handleMapReady}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {sharks.map((shark) => {
          const isSelected = selectedSharkId === shark.id;

          return (
            <Marker
              key={shark.id}
              position={[shark.lat, shark.lon]}
              icon={createSharkIcon(shark, isSelected)}
              eventHandlers={{
                click: () => onSharkSelect?.(shark)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">{shark.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Species:</span> {shark.species}</div>
                    <div><span className="font-medium">Length:</span> {shark.length_m}m</div>
                    <div><span className="font-medium">Sex:</span> {shark.sex === 'M' ? 'Male' : shark.sex === 'F' ? 'Female' : 'Unknown'}</div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-1 ${getStatusColor(shark.status)}`}>{shark.status}</span>
                    </div>
                    <div><span className="font-medium">Last seen:</span> {formatLastSeen(shark.last_ping)}</div>
                    {shark.water_temp_c && (
                      <div><span className="font-medium">Water temp:</span> {shark.water_temp_c}°C</div>
                    )}
                    {shark.location_description && (
                      <div className="mt-2 text-gray-600 italic">{shark.location_description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => onSharkSelect?.(shark)}
                    className="mt-3 w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    View Full Profile
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
        <h4 className="font-semibold mb-2">Shark Status</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2 flex items-center justify-center text-xs">🦈</div>
            <span>Active (recent ping)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 rounded-full mr-2 flex items-center justify-center text-xs">🦈</div>
            <span>Inactive (no recent ping)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharkMap;