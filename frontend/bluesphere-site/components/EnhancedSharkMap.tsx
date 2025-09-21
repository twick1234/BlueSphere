/*
 * BlueSphere Enhanced Shark Map with Historical Movement Tracking
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Real-time and historical shark tracking with individual movement paths
 */

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { SharkData, SharkTrackPoint, sharkTracker } from '../lib/shark-tracking';

// Dynamic imports for Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });

interface SharkTrack {
  sharkId: string;
  sharkName: string;
  points: SharkTrackPoint[];
  color: string;
  visible: boolean;
}

interface TimelineState {
  currentDate: Date;
  startDate: Date;
  endDate: Date;
  isPlaying: boolean;
  playbackSpeed: number; // days per second
}

interface EnhancedSharkMapProps {
  sharks: SharkData[];
  onSharkSelect?: (shark: SharkData | null) => void;
  selectedSharkId?: string | null;
  className?: string;
  showHistoricalTracks?: boolean;
  enableRealTimeUpdates?: boolean;
  maxVisibleSharks?: number;
  enableClustering?: boolean;
  showMigrationRoutes?: boolean;
}

const EnhancedSharkMap: React.FC<EnhancedSharkMapProps> = ({
  sharks,
  onSharkSelect,
  selectedSharkId,
  className = '',
  showHistoricalTracks = true,
  enableRealTimeUpdates = true,
  maxVisibleSharks = 500,
  enableClustering = true,
  showMigrationRoutes = false
}) => {
  const [map, setMap] = useState<any>(null);
  const [sharkTracks, setSharkTracks] = useState<Map<string, SharkTrack>>(new Map());
  const [trackVisibility, setTrackVisibility] = useState<Map<string, boolean>>(new Map());
  const [timeline, setTimeline] = useState<TimelineState>({
    currentDate: new Date(),
    startDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
    endDate: new Date(),
    isPlaying: false,
    playbackSpeed: 1 // 1 day per second
  });
  const [loading, setLoading] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(365); // days
  const [filterBySpecies, setFilterBySpecies] = useState<string>('all');
  const [filterByStatus, setFilterByStatus] = useState<string>('all');
  const [clusteredSharks, setClusteredSharks] = useState<any[]>([]);
  const [mapZoom, setMapZoom] = useState(4);
  const timelineRef = useRef<NodeJS.Timeout | null>(null);

  // Color palette for shark tracks
  const trackColors = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#EF44D2', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    if (sharks.length > 0) {
      loadSharkTracks();
    }
  }, [sharks, selectedTimeRange]);

  useEffect(() => {
    // Initialize track visibility for new sharks
    sharks.forEach(shark => {
      if (!trackVisibility.has(shark.id)) {
        setTrackVisibility(prev => new Map(prev).set(shark.id, true));
      }
    });
  }, [sharks]);

  useEffect(() => {
    // Timeline playback
    if (timeline.isPlaying) {
      timelineRef.current = setInterval(() => {
        setTimeline(prev => {
          const nextDate = new Date(prev.currentDate.getTime() + prev.playbackSpeed * 24 * 60 * 60 * 1000);
          if (nextDate > prev.endDate) {
            return { ...prev, currentDate: prev.startDate, isPlaying: false };
          }
          return { ...prev, currentDate: nextDate };
        });
      }, 1000);
    } else {
      if (timelineRef.current) {
        clearInterval(timelineRef.current);
        timelineRef.current = null;
      }
    }

    return () => {
      if (timelineRef.current) {
        clearInterval(timelineRef.current);
      }
    };
  }, [timeline.isPlaying, timeline.playbackSpeed]);

  const loadSharkTracks = async () => {
    if (!showHistoricalTracks || sharks.length === 0) return;

    setLoading(true);
    try {
      const trackPromises = sharks.map(async (shark, index) => {
        const trackPoints = await sharkTracker.getSharkMovements(shark.id, selectedTimeRange);
        return {
          sharkId: shark.id,
          sharkName: shark.name,
          points: trackPoints,
          color: trackColors[index % trackColors.length],
          visible: trackVisibility.get(shark.id) ?? true
        };
      });

      const tracks = await Promise.all(trackPromises);
      const trackMap = new Map();
      tracks.forEach(track => trackMap.set(track.sharkId, track));
      setSharkTracks(trackMap);
    } catch (error) {
      console.error('Failed to load shark tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackVisibility = (sharkId: string) => {
    setTrackVisibility(prev => {
      const newMap = new Map(prev);
      newMap.set(sharkId, !newMap.get(sharkId));
      return newMap;
    });

    setSharkTracks(prev => {
      const newMap = new Map(prev);
      const track = newMap.get(sharkId);
      if (track) {
        newMap.set(sharkId, { ...track, visible: !track.visible });
      }
      return newMap;
    });
  };

  const toggleTimelinePlayback = () => {
    setTimeline(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const setTimelineDate = (date: Date) => {
    setTimeline(prev => ({ ...prev, currentDate: date }));
  };

  const resetTimeline = () => {
    setTimeline(prev => ({
      ...prev,
      currentDate: prev.startDate,
      isPlaying: false
    }));
  };

  // Performance optimization: Cluster nearby sharks when zoomed out
  const clusterSharks = (sharks: SharkData[], zoom: number) => {
    if (!enableClustering || zoom > 6) return sharks;

    const clustered: any[] = [];
    const processed = new Set<string>();
    const clusterDistance = Math.max(0.5, 5 - zoom); // Adjust cluster distance based on zoom

    sharks.forEach(shark => {
      if (processed.has(shark.id)) return;

      const cluster = {
        ...shark,
        clusterSize: 1,
        clusterMembers: [shark]
      };

      sharks.forEach(otherShark => {
        if (processed.has(otherShark.id) || shark.id === otherShark.id) return;

        const distance = Math.sqrt(
          Math.pow(shark.lat - otherShark.lat, 2) +
          Math.pow(shark.lon - otherShark.lon, 2)
        );

        if (distance < clusterDistance) {
          cluster.clusterSize++;
          cluster.clusterMembers.push(otherShark);
          processed.add(otherShark.id);
        }
      });

      processed.add(shark.id);
      clustered.push(cluster);
    });

    return clustered;
  };

  // Filter sharks and tracks based on current timeline date and filters
  const getVisibleSharks = () => {
    let filteredSharks = sharks;

    // Apply species filter
    if (filterBySpecies !== 'all') {
      filteredSharks = filteredSharks.filter(shark => shark.species === filterBySpecies);
    }

    // Apply status filter
    if (filterByStatus !== 'all') {
      filteredSharks = filteredSharks.filter(shark => shark.status === filterByStatus);
    }

    // Apply timeline filter
    if (timeline.isPlaying) {
      filteredSharks = filteredSharks.filter(shark => {
        const lastPingDate = new Date(shark.last_ping);
        const tagDate = new Date(shark.tag_date);
        return tagDate <= timeline.currentDate && lastPingDate >= timeline.currentDate;
      });
    }

    // Limit number of visible sharks for performance
    const limitedSharks = filteredSharks
      .sort((a, b) => new Date(b.last_ping).getTime() - new Date(a.last_ping).getTime())
      .slice(0, maxVisibleSharks);

    // Apply clustering if enabled
    return clusterSharks(limitedSharks, mapZoom);
  };

  const getVisibleTrackPoints = (track: SharkTrack) => {
    if (!timeline.isPlaying) return track.points;

    return track.points.filter(point => {
      const pointDate = new Date(point.timestamp);
      return pointDate <= timeline.currentDate;
    });
  };

  const createSharkIcon = (shark: any, isSelected: boolean = false) => {
    if (typeof window === 'undefined') return null;

    const L = require('leaflet');
    const isCluster = shark.clusterSize > 1;
    const size = isSelected ? 45 : (isCluster ? Math.min(50, 25 + shark.clusterSize * 2) : 30);
    const color = shark.status === 'Active' ? '#EF4444' : '#9CA3AF';

    if (isCluster) {
      return L.divIcon({
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(135deg, ${color} 0%, ${color}aa 100%);
            border: ${isSelected ? '3px solid #FFFFFF' : '2px solid #FFFFFF'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: ${isSelected ? '1000' : '500'};
          ">
            ${shark.clusterSize}
          </div>
        `,
        className: 'shark-cluster-marker',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
    }

    // Get species-specific emoji
    const getSpeciesEmoji = (species: string) => {
      if (species.includes('Rhincodon')) return '🐋'; // Whale shark
      if (species.includes('Sphyrna')) return '🔨'; // Hammerhead
      if (species.includes('Prionace')) return '🌊'; // Blue shark
      if (species.includes('Galeocerdo')) return '🐅'; // Tiger shark
      return '🦈'; // Default
    };

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
          z-index: ${isSelected ? '1000' : '500'};
        ">
          ${getSpeciesEmoji(shark.species)}
        </div>
      `,
      className: 'shark-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const visibleSharks = getVisibleSharks();

  return (
    <div className={`relative ${className}`}>
      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
      {/* Historical Timeline Controls */}
      {showHistoricalTracks && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-[1000] max-w-md">
          <h4 className="font-semibold mb-3">📅 Historical Timeline</h4>

          {/* Filters */}
          <div className="mb-3 space-y-2">
            <div>
              <label htmlFor="species-filter" className="block text-sm font-medium mb-1">Species Filter</label>
              <select
                id="species-filter"
                value={filterBySpecies}
                onChange={(e) => setFilterBySpecies(e.target.value)}
                className="w-full px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Species</option>
                <option value="Carcharodon carcharias">Great White</option>
                <option value="Galeocerdo cuvier">Tiger Shark</option>
                <option value="Rhincodon typus">Whale Shark</option>
                <option value="Prionace glauca">Blue Shark</option>
                <option value="Sphyrna lewini">Hammerhead</option>
                <option value="Isurus oxyrinchus">Mako Shark</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium mb-1">Status Filter</label>
              <select
                id="status-filter"
                value={filterByStatus}
                onChange={(e) => setFilterByStatus(e.target.value)}
                className="w-full px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Lost_Signal">Lost Signal</option>
              </select>
            </div>

            <div>
              <label htmlFor="time-range-select" className="block text-sm font-medium mb-1">Time Range</label>
              <select
                id="time-range-select"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                aria-label="Select time range for shark tracking data"
              >
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 3 months</option>
                <option value={365}>Last year</option>
                <option value={1825}>Last 5 years</option>
              </select>
            </div>
          </div>

          {/* Current Date Display */}
          <div className="mb-3 text-center">
            <div className="text-lg font-bold text-blue-600">
              {formatDate(timeline.currentDate)}
            </div>
            <div className="text-xs text-gray-500">
              {timeline.isPlaying ? 'Playing' : 'Paused'}
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="mb-3">
            <label htmlFor="timeline-slider" className="sr-only">Select date on timeline</label>
            <input
              id="timeline-slider"
              type="range"
              min={timeline.startDate.getTime()}
              max={timeline.endDate.getTime()}
              value={timeline.currentDate.getTime()}
              onChange={(e) => setTimelineDate(new Date(Number(e.target.value)))}
              className="w-full"
              aria-label="Navigate timeline to specific date"
              aria-valuemin={timeline.startDate.getTime()}
              aria-valuemax={timeline.endDate.getTime()}
              aria-valuenow={timeline.currentDate.getTime()}
              aria-valuetext={formatDate(timeline.currentDate)}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatDate(timeline.startDate)}</span>
              <span>{formatDate(timeline.endDate)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={toggleTimelinePlayback}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              aria-label={timeline.isPlaying ? 'Pause timeline playback' : 'Start timeline playback'}
            >
              {timeline.isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={resetTimeline}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              aria-label="Reset timeline to beginning"
            >
              ↺
            </button>
          </div>

          {/* Playback Speed */}
          <div className="mb-2">
            <label htmlFor="playback-speed" className="block text-sm font-medium mb-1">
              Speed: {timeline.playbackSpeed} days/sec
            </label>
            <input
              id="playback-speed"
              type="range"
              min="1"
              max="30"
              value={timeline.playbackSpeed}
              onChange={(e) => setTimeline(prev => ({ ...prev, playbackSpeed: Number(e.target.value) }))}
              className="w-full"
              aria-label="Timeline playback speed"
              aria-valuemin={1}
              aria-valuemax={30}
              aria-valuenow={timeline.playbackSpeed}
              aria-valuetext={`${timeline.playbackSpeed} days per second`}
            />
          </div>
        </div>
      )}

      {/* Shark Track Controls */}
      {showHistoricalTracks && visibleSharks.length > 0 && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-[1000] max-w-xs max-h-96 overflow-y-auto">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            🦈 Shark Tracks
            <button
              onClick={() => setHeatmapMode(!heatmapMode)}
              className={`px-2 py-1 text-xs rounded ${
                heatmapMode ? 'bg-orange-600 text-white' : 'bg-gray-200'
              }`}
            >
              Heat Map
            </button>
          </h4>

          <div className="space-y-2">
            {visibleSharks.map((shark, index) => {
              const track = sharkTracks.get(shark.id);
              const isVisible = trackVisibility.get(shark.id) ?? true;
              const trackColor = trackColors[index % trackColors.length];

              return (
                <div key={shark.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <button
                    onClick={() => toggleTrackVisibility(shark.id)}
                    className={`w-4 h-4 rounded-full border-2 border-white flex-shrink-0 ${
                      isVisible ? 'shadow-md' : 'opacity-50'
                    }`}
                    style={{ backgroundColor: trackColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{shark.name}</div>
                    <div className="text-xs text-gray-500">
                      {track?.points.length || 0} points
                    </div>
                  </div>
                  <button
                    onClick={() => onSharkSelect?.(shark)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="mt-3 text-center text-sm text-gray-500">
              Loading tracks...
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: '600px', width: '100%' }}
        whenReady={() => {
          // Map initialization logic will be handled in a separate effect
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Shark Markers */}
        {visibleSharks.map((shark: any) => {
          const isSelected = selectedSharkId === shark.id;
          const isCluster = shark.clusterSize > 1;

          return (
            <Marker
              key={`marker-${shark.id}-${shark.clusterSize || 1}`}
              position={[shark.lat, shark.lon]}
              icon={createSharkIcon(shark, isSelected)}
              eventHandlers={{
                click: () => {
                  if (isCluster && mapZoom < 8) {
                    // Zoom in on cluster
                    map?.setView([shark.lat, shark.lon], Math.min(mapZoom + 3, 10));
                  } else {
                    onSharkSelect?.(shark);
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  {isCluster ? (
                    <div>
                      <h3 className="font-bold text-lg mb-2">Shark Cluster ({shark.clusterSize})</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {shark.clusterMembers.slice(0, 5).map((member: SharkData, idx: number) => (
                          <div key={member.id} className="border-b pb-1 last:border-b-0">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.species.split(' ').slice(-2).join(' ')}</div>
                          </div>
                        ))}
                        {shark.clusterSize > 5 && (
                          <div className="text-sm text-gray-500">...and {shark.clusterSize - 5} more</div>
                        )}
                      </div>
                      <button
                        onClick={() => map?.setView([shark.lat, shark.lon], Math.min(mapZoom + 3, 10))}
                        className="w-full mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Zoom In
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-lg mb-2">{shark.name}</h3>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Species:</span> {shark.species}</div>
                        <div><span className="font-medium">Length:</span> {shark.length_m}m</div>
                        <div><span className="font-medium">Sex:</span> {shark.sex === 'M' ? 'Male' : shark.sex === 'F' ? 'Female' : 'Unknown'}</div>
                        <div><span className="font-medium">Status:</span> <span className="text-green-600">{shark.status}</span></div>
                        {shark.water_temp_c && (
                          <div><span className="font-medium">Water temp:</span> {shark.water_temp_c}°C</div>
                        )}
                        {shark.depth_m && (
                          <div><span className="font-medium">Depth:</span> {shark.depth_m}m</div>
                        )}
                        {shark.location_description && (
                          <div className="mt-2 text-gray-600 italic">{shark.location_description}</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onSharkSelect?.(shark)}
                          className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => toggleTrackVisibility(shark.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Track
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Shark Movement Tracks */}
        {showHistoricalTracks && Array.from(sharkTracks.entries()).map(([sharkId, track]) => {
          if (!track.visible) return null;

          const visiblePoints = getVisibleTrackPoints(track);
          if (visiblePoints.length < 2) return null;

          const pathPoints = visiblePoints.map(point => [point.lat, point.lon] as [number, number]);

          return (
            <React.Fragment key={`track-${sharkId}`}>
              {/* Main track line */}
              <Polyline
                positions={pathPoints}
                color={track.color}
                weight={3}
                opacity={0.7}
              />

              {/* Track points (if not too many) */}
              {visiblePoints.length < 100 && visiblePoints.map((point, index) => (
                <Circle
                  key={`point-${sharkId}-${index}`}
                  center={[point.lat, point.lon]}
                  radius={1000}
                  fillColor={track.color}
                  fillOpacity={0.3}
                  stroke={false}
                />
              ))}

              {/* Heatmap circles for density visualization */}
              {heatmapMode && visiblePoints.map((point, index) => (
                <Circle
                  key={`heat-${sharkId}-${index}`}
                  center={[point.lat, point.lon]}
                  radius={5000}
                  fillColor={track.color}
                  fillOpacity={0.1}
                  stroke={false}
                />
              ))}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-lg shadow-lg border flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">🦈 {visibleSharks.length} sharks visible</span>
          {showHistoricalTracks && (
            <span className="text-gray-600">
              📍 {Array.from(sharkTracks.values()).reduce((sum, track) => sum + track.points.length, 0)} track points
            </span>
          )}
          {timeline.isPlaying && (
            <span className="text-blue-600 animate-pulse">⏸️ Playing at {timeline.playbackSpeed}x speed</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTimeRange(prev => prev === 365 ? 1825 : 365)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            {selectedTimeRange === 365 ? '5 Years' : '1 Year'}
          </button>
          {enableRealTimeUpdates && (
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-sm">Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSharkMap;