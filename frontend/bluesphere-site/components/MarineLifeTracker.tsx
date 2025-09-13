import React, { useState, useEffect, useRef } from 'react';
import { ArrowPathIcon, MapIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface MigrationRoute {
  id: string;
  species: string;
  commonName: string;
  route: Array<{ lat: number; lon: number; date: string; depth?: number }>;
  status: 'active' | 'seasonal' | 'historical' | 'predicted';
  totalDistance: number;
  duration: string;
  purpose: 'feeding' | 'breeding' | 'seasonal' | 'spawning' | 'refuge';
  populationSize: number;
  trackingMethod: 'satellite' | 'acoustic' | 'visual' | 'genetic' | 'ai_prediction';
  conservationStatus: 'least_concern' | 'near_threatened' | 'vulnerable' | 'endangered' | 'critically_endangered';
}

interface MarineLifeTrackerProps {
  isDarkMode: boolean;
  selectedSpecies?: string;
}

const MarineLifeTracker: React.FC<MarineLifeTrackerProps> = ({ 
  isDarkMode, 
  selectedSpecies 
}) => {
  const [migrationRoutes, setMigrationRoutes] = useState<MigrationRoute[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('current');
  const [playback, setPlayback] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Marine species migration data
  useEffect(() => {
    const routes: MigrationRoute[] = [
      {
        id: 'humpback-pacific',
        species: 'Megaptera novaeangliae',
        commonName: 'Humpback Whale',
        route: [
          { lat: 61.0, lon: -149.0, date: '2024-05-01T00:00:00Z' }, // Alaska
          { lat: 55.0, lon: -155.0, date: '2024-06-15T00:00:00Z' },
          { lat: 45.0, lon: -160.0, date: '2024-08-01T00:00:00Z' },
          { lat: 35.0, lon: -165.0, date: '2024-09-15T00:00:00Z' },
          { lat: 25.0, lon: -170.0, date: '2024-11-01T00:00:00Z' },
          { lat: 20.0, lon: -155.0, date: '2024-12-15T00:00:00Z' }  // Hawaii
        ],
        status: 'active',
        totalDistance: 5800,
        duration: '7.5 months',
        purpose: 'breeding',
        populationSize: 25000,
        trackingMethod: 'satellite',
        conservationStatus: 'least_concern'
      },
      {
        id: 'bluefin-atlantic',
        species: 'Thunnus thynnus',
        commonName: 'Atlantic Bluefin Tuna',
        route: [
          { lat: 42.0, lon: -70.0, date: '2024-03-01T00:00:00Z' }, // North Atlantic
          { lat: 45.0, lon: -60.0, date: '2024-04-15T00:00:00Z' },
          { lat: 50.0, lon: -45.0, date: '2024-06-01T00:00:00Z' },
          { lat: 55.0, lon: -35.0, date: '2024-07-15T00:00:00Z' },
          { lat: 60.0, lon: -25.0, date: '2024-08-01T00:00:00Z' },
          { lat: 65.0, lon: -15.0, date: '2024-09-15T00:00:00Z' }  // Norway
        ],
        status: 'seasonal',
        totalDistance: 4200,
        duration: '6 months',
        purpose: 'feeding',
        populationSize: 1500,
        trackingMethod: 'acoustic',
        conservationStatus: 'endangered'
      },
      {
        id: 'leatherback-pacific',
        species: 'Dermochelys coriacea',
        commonName: 'Leatherback Sea Turtle',
        route: [
          { lat: 12.0, lon: -87.0, date: '2024-02-01T00:00:00Z' }, // Costa Rica
          { lat: 15.0, lon: -95.0, date: '2024-03-15T00:00:00Z' },
          { lat: 20.0, lon: -105.0, date: '2024-05-01T00:00:00Z' },
          { lat: 25.0, lon: -115.0, date: '2024-06-15T00:00:00Z' },
          { lat: 35.0, lon: -125.0, date: '2024-08-01T00:00:00Z' },
          { lat: 45.0, lon: -130.0, date: '2024-09-15T00:00:00Z' }  // California
        ],
        status: 'active',
        totalDistance: 6500,
        duration: '8 months',
        purpose: 'feeding',
        populationSize: 2300,
        trackingMethod: 'satellite',
        conservationStatus: 'critically_endangered'
      },
      {
        id: 'great-white-pacific',
        species: 'Carcharodon carcharias',
        commonName: 'Great White Shark',
        route: [
          { lat: 37.0, lon: -123.0, date: '2024-01-01T00:00:00Z', depth: 10 }, // California
          { lat: 35.0, lon: -130.0, date: '2024-02-15T00:00:00Z', depth: 50 },
          { lat: 30.0, lon: -140.0, date: '2024-04-01T00:00:00Z', depth: 200 },
          { lat: 25.0, lon: -155.0, date: '2024-05-15T00:00:00Z', depth: 300 },
          { lat: 20.0, lon: -160.0, date: '2024-07-01T00:00:00Z', depth: 400 },
          { lat: 15.0, lon: -165.0, date: '2024-08-15T00:00:00Z', depth: 500 }  // Hawaii
        ],
        status: 'active',
        totalDistance: 3800,
        duration: '8 months',
        purpose: 'feeding',
        populationSize: 3500,
        trackingMethod: 'acoustic',
        conservationStatus: 'vulnerable'
      },
      {
        id: 'arctic-tern',
        species: 'Sterna paradisaea',
        commonName: 'Arctic Tern',
        route: [
          { lat: 71.0, lon: -8.0, date: '2024-04-01T00:00:00Z' }, // Greenland
          { lat: 60.0, lon: -20.0, date: '2024-05-15T00:00:00Z' },
          { lat: 45.0, lon: -30.0, date: '2024-07-01T00:00:00Z' },
          { lat: 30.0, lon: -40.0, date: '2024-08-15T00:00:00Z' },
          { lat: 0.0, lon: -50.0, date: '2024-10-01T00:00:00Z' },
          { lat: -30.0, lon: -60.0, date: '2024-11-15T00:00:00Z' },
          { lat: -65.0, lon: -65.0, date: '2025-01-01T00:00:00Z' } // Antarctica
        ],
        status: 'seasonal',
        totalDistance: 12000,
        duration: '12 months',
        purpose: 'seasonal',
        populationSize: 1000000,
        trackingMethod: 'satellite',
        conservationStatus: 'least_concern'
      },
      {
        id: 'salmon-pacific',
        species: 'Oncorhynchus nerka',
        commonName: 'Sockeye Salmon',
        route: [
          { lat: 58.0, lon: -134.0, date: '2024-04-01T00:00:00Z' }, // Alaska rivers
          { lat: 55.0, lon: -140.0, date: '2024-05-01T00:00:00Z' },
          { lat: 50.0, lon: -150.0, date: '2024-06-01T00:00:00Z' },
          { lat: 45.0, lon: -160.0, date: '2024-07-01T00:00:00Z' },
          { lat: 40.0, lon: -170.0, date: '2024-08-01T00:00:00Z' },
          { lat: 50.0, lon: -150.0, date: '2024-09-01T00:00:00Z' },
          { lat: 58.0, lon: -134.0, date: '2024-10-01T00:00:00Z' } // Return
        ],
        status: 'seasonal',
        totalDistance: 2400,
        duration: '6 months',
        purpose: 'spawning',
        populationSize: 500000,
        trackingMethod: 'genetic',
        conservationStatus: 'near_threatened'
      }
    ];

    setMigrationRoutes(routes);
  }, []);

  // Animation playback
  useEffect(() => {
    if (playback) {
      const animate = () => {
        setCurrentTime(prev => {
          const next = prev + 0.01;
          return next > 1 ? 0 : next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playback]);

  // Draw migration visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || migrationRoutes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw world map outline
    drawWorldMap(ctx, rect);

    // Filter and draw migration routes
    const filtered = migrationRoutes.filter(route => {
      const statusMatch = filterStatus === 'all' || route.status === filterStatus;
      const speciesMatch = filterSpecies === 'all' || route.commonName.toLowerCase().includes(filterSpecies.toLowerCase());
      return statusMatch && speciesMatch;
    });

    filtered.forEach((route, index) => {
      drawMigrationRoute(ctx, rect, route, index, currentTime);
    });

  }, [migrationRoutes, filterStatus, filterSpecies, currentTime, isDarkMode]);

  const drawWorldMap = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
    // Simple world map outline
    ctx.strokeStyle = isDarkMode ? '#374151' : '#d1d5db';
    ctx.lineWidth = 1;
    
    // Draw simplified continents
    const continents = [
      // North America
      [[80, 60], [120, 50], [180, 70], [200, 90], [150, 120], [100, 100], [80, 60]],
      // South America
      [[140, 150], [160, 180], [180, 220], [160, 250], [140, 230], [120, 200], [140, 150]],
      // Europe
      [[200, 80], [240, 70], [260, 90], [250, 110], [220, 100], [200, 80]],
      // Africa
      [[220, 120], [240, 140], [260, 180], [250, 220], [230, 200], [210, 160], [220, 120]],
      // Asia
      [[280, 80], [340, 70], [400, 90], [420, 110], [400, 130], [360, 120], [320, 100], [280, 80]],
      // Australia
      [[380, 200], [420, 195], [430, 210], [410, 220], [380, 215], [380, 200]]
    ];

    continents.forEach(continent => {
      ctx.beginPath();
      ctx.moveTo(continent[0][0], continent[0][1]);
      continent.slice(1).forEach(point => {
        ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isDarkMode ? '#1f2937' : '#f3f4f6';
      ctx.fill();
      ctx.stroke();
    });
  };

  const drawMigrationRoute = (ctx: CanvasRenderingContext2D, rect: DOMRect, route: MigrationRoute, index: number, time: number) => {
    // Convert lat/lon to canvas coordinates
    const points = route.route.map(point => ({
      x: ((point.lon + 180) / 360) * rect.width,
      y: ((90 - point.lat) / 180) * rect.height,
      date: new Date(point.date).getTime()
    }));

    // Route color based on species type
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Green  
      '#f59e0b', // Yellow
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16'  // Lime
    ];
    
    const routeColor = colors[index % colors.length];

    // Draw route path
    ctx.strokeStyle = routeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    // Draw direction arrows
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arrowLength = 8;
      
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - arrowLength * Math.cos(angle - Math.PI / 6),
        midY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX - arrowLength * Math.cos(angle + Math.PI / 6),
        midY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }

    // Animate current position if playback is active
    if (playback && points.length > 1) {
      const totalDuration = points[points.length - 1].date - points[0].date;
      const currentTimestamp = points[0].date + (totalDuration * time);
      
      // Find current segment
      let currentSegment = 0;
      for (let i = 0; i < points.length - 1; i++) {
        if (currentTimestamp >= points[i].date && currentTimestamp <= points[i + 1].date) {
          currentSegment = i;
          break;
        }
      }
      
      if (currentSegment < points.length - 1) {
        const segmentStart = points[currentSegment];
        const segmentEnd = points[currentSegment + 1];
        const segmentProgress = (currentTimestamp - segmentStart.date) / (segmentEnd.date - segmentStart.date);
        
        const currentX = segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentProgress;
        const currentY = segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentProgress;
        
        // Draw current position
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = routeColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw waypoints
    points.forEach((point, pointIndex) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = routeColor;
      ctx.fill();
      
      if (pointIndex === 0 || pointIndex === points.length - 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'seasonal': return 'text-blue-700 bg-blue-100';
      case 'historical': return 'text-gray-700 bg-gray-100';
      case 'predicted': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getConservationColor = (status: string) => {
    switch (status) {
      case 'least_concern': return 'text-green-700 bg-green-100';
      case 'near_threatened': return 'text-yellow-700 bg-yellow-100';
      case 'vulnerable': return 'text-orange-700 bg-orange-100';
      case 'endangered': return 'text-red-700 bg-red-100';
      case 'critically_endangered': return 'text-red-800 bg-red-200';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const uniqueSpecies = Array.from(new Set(migrationRoutes.map(r => r.commonName)));
  const filteredRoutes = migrationRoutes.filter(route => {
    const statusMatch = filterStatus === 'all' || route.status === filterStatus;
    const speciesMatch = filterSpecies === 'all' || route.commonName.toLowerCase().includes(filterSpecies.toLowerCase());
    return statusMatch && speciesMatch;
  });

  const containerClass = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`rounded-lg border ${containerClass} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ArrowPathIcon className="h-6 w-6 text-blue-600" />
          <h2 className={`text-xl font-semibold ${textClass}`}>
            Marine Life Migration Tracker
          </h2>
        </div>

        <div className="flex space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-1 rounded border text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="seasonal">Seasonal</option>
            <option value="historical">Historical</option>
            <option value="predicted">Predicted</option>
          </select>

          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className={`px-3 py-1 rounded border text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="all">All Species</option>
            {uniqueSpecies.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>

          <button
            onClick={() => setPlayback(!playback)}
            className={`px-4 py-1 rounded text-sm font-medium ${
              playback
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {playback ? 'Stop' : 'Play'} Animation
          </button>
        </div>
      </div>

      {/* Migration Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-blue-600">{filteredRoutes.length}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Tracked Routes</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-green-600">
            {filteredRoutes.filter(r => r.status === 'active').length}
          </div>
          <div className={`text-sm ${secondaryTextClass}`}>Active Migrations</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-purple-600">
            {uniqueSpecies.length}
          </div>
          <div className={`text-sm ${secondaryTextClass}`}>Species Monitored</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-yellow-600">
            {Math.round(filteredRoutes.reduce((acc, route) => acc + route.totalDistance, 0) / filteredRoutes.length || 0).toLocaleString()}
          </div>
          <div className={`text-sm ${secondaryTextClass}`}>Avg Distance (km)</div>
        </div>
      </div>

      {/* Migration Map */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          className="w-full border rounded"
          style={{ height: '500px' }}
        />
        {playback && (
          <div className="mt-2">
            <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}>
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${currentTime * 100}%` }}
              />
            </div>
            <div className={`text-xs ${secondaryTextClass} mt-1`}>
              Animation Progress: {Math.round(currentTime * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Migration Routes Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <th className={`text-left p-3 font-medium ${textClass}`}>Species</th>
              <th className={`text-left p-3 font-medium ${textClass}`}>Status</th>
              <th className={`text-left p-3 font-medium ${textClass}`}>Purpose</th>
              <th className={`text-left p-3 font-medium ${textClass}`}>Distance</th>
              <th className={`text-left p-3 font-medium ${textClass}`}>Duration</th>
              <th className={`text-left p-3 font-medium ${textClass}`}>Population</th>
              <th className={`text-left p-3 font-medium ${textClass}`}>Conservation</th>
              <th className={`text-left p-3 font-medium ${textClass}`}>Tracking</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr 
                key={route.id}
                className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
              >
                <td className={`p-3 ${textClass}`}>
                  <div>
                    <div className="font-medium">{route.commonName}</div>
                    <div className={`text-xs ${secondaryTextClass} italic`}>
                      {route.species}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                    {route.status.replace('_', ' ')}
                  </span>
                </td>
                <td className={`p-3 text-sm ${textClass} capitalize`}>
                  {route.purpose}
                </td>
                <td className={`p-3 font-mono ${textClass}`}>
                  {route.totalDistance.toLocaleString()} km
                </td>
                <td className={`p-3 text-sm ${textClass}`}>
                  {route.duration}
                </td>
                <td className={`p-3 font-mono ${textClass}`}>
                  {route.populationSize.toLocaleString()}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConservationColor(route.conservationStatus)}`}>
                    {route.conservationStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className={`p-3 text-sm ${textClass} capitalize`}>
                  {route.trackingMethod.replace('_', ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarineLifeTracker;