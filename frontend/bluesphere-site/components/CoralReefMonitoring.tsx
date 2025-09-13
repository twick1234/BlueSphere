import React, { useState, useEffect, useRef } from 'react';
import { MapIcon, ExclamationTriangleIcon, FireIcon, EyeIcon } from '@heroicons/react/24/outline';

interface CoralSite {
  id: string;
  name: string;
  location: {
    lat: number;
    lon: number;
    country: string;
    region: string;
  };
  bleachingLevel: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme';
  waterTemp: number;
  turbidity: number;
  coralCover: number;
  biodiversityIndex: number;
  threats: string[];
  lastSurvey: string;
  status: 'healthy' | 'warning' | 'critical' | 'recovering';
}

interface CoralReefMonitoringProps {
  isDarkMode: boolean;
  selectedSite?: string;
}

const CoralReefMonitoring: React.FC<CoralReefMonitoringProps> = ({ 
  isDarkMode, 
  selectedSite 
}) => {
  const [coralSites, setCoralSites] = useState<CoralSite[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'table'>('grid');
  const [timeRange, setTimeRange] = useState<string>('1M');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Famous coral reef sites with realistic data
  useEffect(() => {
    const sites: CoralSite[] = [
      {
        id: 'gbr-cairns',
        name: 'Great Barrier Reef - Cairns',
        location: { lat: -16.9186, lon: 145.7781, country: 'Australia', region: 'Coral Sea' },
        bleachingLevel: 'moderate',
        waterTemp: 28.5,
        turbidity: 12.3,
        coralCover: 45.2,
        biodiversityIndex: 78.9,
        threats: ['Coral bleaching', 'Crown-of-thorns starfish', 'Water pollution'],
        lastSurvey: '2024-01-10T08:30:00Z',
        status: 'warning'
      },
      {
        id: 'maldives-north',
        name: 'North Malé Atoll',
        location: { lat: 4.1755, lon: 73.5093, country: 'Maldives', region: 'Indian Ocean' },
        bleachingLevel: 'mild',
        waterTemp: 29.1,
        turbidity: 8.7,
        coralCover: 67.8,
        biodiversityIndex: 85.4,
        threats: ['Rising sea levels', 'Tourism pressure'],
        lastSurvey: '2024-01-12T10:15:00Z',
        status: 'healthy'
      },
      {
        id: 'red-sea-egypt',
        name: 'Red Sea - Hurghada',
        location: { lat: 27.2579, lon: 33.8116, country: 'Egypt', region: 'Red Sea' },
        bleachingLevel: 'none',
        waterTemp: 26.8,
        turbidity: 5.2,
        coralCover: 82.3,
        biodiversityIndex: 91.7,
        threats: ['Diving tourism', 'Coastal development'],
        lastSurvey: '2024-01-08T14:20:00Z',
        status: 'healthy'
      },
      {
        id: 'caribbean-belize',
        name: 'Belize Barrier Reef',
        location: { lat: 17.2500, lon: -88.0000, country: 'Belize', region: 'Caribbean' },
        bleachingLevel: 'severe',
        waterTemp: 31.2,
        turbidity: 18.9,
        coralCover: 23.1,
        biodiversityIndex: 52.8,
        threats: ['Mass bleaching', 'Hurricane damage', 'Sedimentation'],
        lastSurvey: '2024-01-05T12:45:00Z',
        status: 'critical'
      },
      {
        id: 'florida-keys',
        name: 'Florida Keys',
        location: { lat: 24.7000, lon: -81.0000, country: 'United States', region: 'Atlantic' },
        bleachingLevel: 'extreme',
        waterTemp: 32.8,
        turbidity: 25.4,
        coralCover: 12.5,
        biodiversityIndex: 34.2,
        threats: ['Marine heatwaves', 'Ocean acidification', 'Disease outbreaks'],
        lastSurvey: '2024-01-03T09:30:00Z',
        status: 'critical'
      },
      {
        id: 'palau-micronesia',
        name: 'Palau Rock Islands',
        location: { lat: 7.5000, lon: 134.5000, country: 'Palau', region: 'Pacific' },
        bleachingLevel: 'none',
        waterTemp: 28.0,
        turbidity: 6.1,
        coralCover: 89.7,
        biodiversityIndex: 96.3,
        threats: ['Climate change', 'Limited human impact'],
        lastSurvey: '2024-01-14T11:00:00Z',
        status: 'healthy'
      },
      {
        id: 'raja-ampat',
        name: 'Raja Ampat',
        location: { lat: -0.2300, lon: 130.5200, country: 'Indonesia', region: 'Coral Triangle' },
        bleachingLevel: 'mild',
        waterTemp: 28.9,
        turbidity: 7.8,
        coralCover: 75.4,
        biodiversityIndex: 94.1,
        threats: ['Overfishing', 'Plastic pollution'],
        lastSurvey: '2024-01-11T13:15:00Z',
        status: 'recovering'
      },
      {
        id: 'seychelles',
        name: 'Seychelles Inner Islands',
        location: { lat: -4.6796, lon: 55.4920, country: 'Seychelles', region: 'Indian Ocean' },
        bleachingLevel: 'moderate',
        waterTemp: 29.8,
        turbidity: 11.2,
        coralCover: 38.9,
        biodiversityIndex: 67.5,
        threats: ['Coral bleaching', 'Crown-of-thorns', 'Coastal development'],
        lastSurvey: '2024-01-07T15:45:00Z',
        status: 'recovering'
      }
    ];
    
    setCoralSites(sites);
  }, []);

  // Draw coral reef visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || coralSites.length === 0) return;

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

    if (viewMode === 'map') {
      // Draw world map with coral sites
      drawWorldMap(ctx, rect, coralSites);
    } else {
      // Draw coral health metrics
      drawCoralMetrics(ctx, rect, coralSites);
    }

  }, [coralSites, viewMode, isDarkMode, filterStatus]);

  const drawWorldMap = (ctx: CanvasRenderingContext2D, rect: DOMRect, sites: CoralSite[]) => {
    // Simple world map outline
    ctx.strokeStyle = isDarkMode ? '#374151' : '#d1d5db';
    ctx.lineWidth = 1;
    
    // Draw continents (simplified)
    const continents = [
      // North America
      [[50, 60], [100, 50], [150, 70], [180, 90], [120, 120], [80, 100], [50, 60]],
      // South America
      [[120, 150], [140, 180], [160, 220], [140, 250], [120, 230], [100, 200], [120, 150]],
      // Africa
      [[200, 120], [220, 140], [240, 180], [230, 220], [210, 200], [190, 160], [200, 120]],
      // Asia
      [[250, 80], [300, 70], [350, 90], [380, 110], [360, 130], [320, 120], [280, 100], [250, 80]],
      // Australia
      [[340, 200], [380, 195], [390, 210], [370, 220], [340, 215], [340, 200]]
    ];

    continents.forEach(continent => {
      ctx.beginPath();
      ctx.moveTo(continent[0][0], continent[0][1]);
      continent.slice(1).forEach(point => {
        ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.stroke();
    });

    // Plot coral sites
    sites.forEach(site => {
      // Convert lat/lon to canvas coordinates (simplified projection)
      const x = ((site.location.lon + 180) / 360) * rect.width;
      const y = ((90 - site.location.lat) / 180) * rect.height;

      // Site marker color based on status
      const color = site.status === 'healthy' ? '#10b981' :
                   site.status === 'warning' ? '#f59e0b' :
                   site.status === 'critical' ? '#ef4444' : '#6366f1';

      // Outer ring (bleaching level)
      const ringColor = site.bleachingLevel === 'none' ? '#10b981' :
                       site.bleachingLevel === 'mild' ? '#22d3ee' :
                       site.bleachingLevel === 'moderate' ? '#f59e0b' :
                       site.bleachingLevel === 'severe' ? '#f97316' : '#ef4444';

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = ringColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Site label
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#111827';
      ctx.textAlign = 'center';
      ctx.fillText(site.name.split(' - ')[0], x, y + 20);
    });
  };

  const drawCoralMetrics = (ctx: CanvasRenderingContext2D, rect: DOMRect, sites: CoralSite[]) => {
    const padding = 40;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = rect.height - 2 * padding;

    // Draw axes
    ctx.strokeStyle = isDarkMode ? '#6b7280' : '#9ca3af';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, rect.height - padding);
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.stroke();

    // Axis labels
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = isDarkMode ? '#d1d5db' : '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('Water Temperature (°C)', rect.width / 2, rect.height - 10);
    
    ctx.save();
    ctx.translate(15, rect.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Coral Cover (%)', 0, 0);
    ctx.restore();

    // Plot coral sites
    sites.forEach((site, index) => {
      const x = padding + (site.waterTemp - 25) * (chartWidth / 10); // 25-35°C range
      const y = rect.height - padding - (site.coralCover / 100) * chartHeight;

      // Bubble size based on biodiversity index
      const radius = 4 + (site.biodiversityIndex / 100) * 8;

      // Color based on bleaching level
      const color = site.bleachingLevel === 'none' ? '#10b981' :
                   site.bleachingLevel === 'mild' ? '#22d3ee' :
                   site.bleachingLevel === 'moderate' ? '#f59e0b' :
                   site.bleachingLevel === 'severe' ? '#f97316' : '#ef4444';

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color + '80'; // Add transparency
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Legend
    const legendY = padding + 20;
    const legendItems = [
      { color: '#10b981', label: 'No bleaching' },
      { color: '#22d3ee', label: 'Mild bleaching' },
      { color: '#f59e0b', label: 'Moderate bleaching' },
      { color: '#f97316', label: 'Severe bleaching' },
      { color: '#ef4444', label: 'Extreme bleaching' }
    ];

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    legendItems.forEach((item, index) => {
      const legendX = rect.width - 150;
      const itemY = legendY + index * 20;

      ctx.beginPath();
      ctx.arc(legendX, itemY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = item.color;
      ctx.fill();

      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#111827';
      ctx.fillText(item.label, legendX + 15, itemY + 4);
    });
  };

  const getBleachingColor = (level: string) => {
    switch (level) {
      case 'none': return 'text-green-600 bg-green-50';
      case 'mild': return 'text-cyan-600 bg-cyan-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'severe': return 'text-orange-600 bg-orange-50';
      case 'extreme': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-700 bg-green-100';
      case 'warning': return 'text-yellow-700 bg-yellow-100';
      case 'critical': return 'text-red-700 bg-red-100';
      case 'recovering': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const filteredSites = filterStatus === 'all' 
    ? coralSites 
    : coralSites.filter(site => site.status === filterStatus);

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
          <div className="relative">
            <MapIcon className="h-6 w-6 text-blue-600" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <h2 className={`text-xl font-semibold ${textClass}`}>
            Global Coral Reef Monitoring
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
            <option value="all">All Sites</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="recovering">Recovering</option>
          </select>

          <div className="flex rounded border overflow-hidden">
            {['grid', 'map', 'table'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 text-sm capitalize ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-blue-600">{filteredSites.length}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Monitored Sites</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-green-600">
            {filteredSites.filter(s => s.status === 'healthy').length}
          </div>
          <div className={`text-sm ${secondaryTextClass}`}>Healthy Reefs</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-red-600">
            {filteredSites.filter(s => s.bleachingLevel === 'severe' || s.bleachingLevel === 'extreme').length}
          </div>
          <div className={`text-sm ${secondaryTextClass}`}>Bleaching Events</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-yellow-600">
            {(filteredSites.reduce((acc, site) => acc + site.coralCover, 0) / filteredSites.length).toFixed(1)}%
          </div>
          <div className={`text-sm ${secondaryTextClass}`}>Avg. Coral Cover</div>
        </div>
      </div>

      {/* Visualization */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          className="w-full border rounded"
          style={{ height: viewMode === 'map' ? '400px' : '300px' }}
        />
      </div>

      {/* Site Details */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className={`p-4 rounded-lg border ${
                isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-medium ${textClass}`}>{site.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                  {site.status.toUpperCase()}
                </span>
              </div>
              
              <p className={`text-sm ${secondaryTextClass} mb-3`}>
                {site.location.country}, {site.location.region}
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${secondaryTextClass}`}>Water Temp:</span>
                  <span className={`text-sm font-medium ${textClass}`}>{site.waterTemp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${secondaryTextClass}`}>Coral Cover:</span>
                  <span className={`text-sm font-medium ${textClass}`}>{site.coralCover}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${secondaryTextClass}`}>Biodiversity:</span>
                  <span className={`text-sm font-medium ${textClass}`}>{site.biodiversityIndex}</span>
                </div>
              </div>

              <div className="mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBleachingColor(site.bleachingLevel)}`}>
                  {site.bleachingLevel.replace('_', ' ')} bleaching
                </span>
              </div>

              <div className="text-xs">
                <p className={`${secondaryTextClass} mb-1`}>Main threats:</p>
                <p className={`${textClass}`}>{site.threats.slice(0, 2).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <th className={`text-left p-3 font-medium ${textClass}`}>Site</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Status</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Bleaching</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Temp (°C)</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Cover (%)</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Biodiversity</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Last Survey</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr 
                  key={site.id}
                  className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                >
                  <td className={`p-3 ${textClass}`}>
                    <div>
                      <div className="font-medium">{site.name}</div>
                      <div className={`text-xs ${secondaryTextClass}`}>
                        {site.location.country}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                      {site.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBleachingColor(site.bleachingLevel)}`}>
                      {site.bleachingLevel}
                    </span>
                  </td>
                  <td className={`p-3 font-mono ${textClass}`}>
                    {site.waterTemp}
                  </td>
                  <td className={`p-3 font-mono ${textClass}`}>
                    {site.coralCover}
                  </td>
                  <td className={`p-3 font-mono ${textClass}`}>
                    {site.biodiversityIndex}
                  </td>
                  <td className={`p-3 text-sm ${secondaryTextClass}`}>
                    {new Date(site.lastSurvey).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CoralReefMonitoring;