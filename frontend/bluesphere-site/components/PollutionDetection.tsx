import React, { useState, useEffect, useRef } from 'react';
import { ExclamationTriangleIcon, BeakerIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PollutionIncident {
  id: string;
  type: 'plastic' | 'oil_spill' | 'chemical' | 'sewage' | 'microplastics' | 'acidification' | 'thermal' | 'noise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lon: number;
    region: string;
    depth?: number;
  };
  concentration: number;
  unit: string;
  detectionMethod: 'satellite' | 'sensor' | 'visual' | 'ai_analysis' | 'citizen_report';
  timestamp: string;
  status: 'detected' | 'monitoring' | 'contained' | 'cleanup' | 'resolved';
  estimatedSize: number;
  affectedArea: number;
  sources: string[];
  impact: {
    marineLife: number;
    ecosystem: number;
    economic: number;
  };
  responseActions: string[];
}

interface PollutionDetectionProps {
  isDarkMode: boolean;
  selectedIncident?: string;
}

const PollutionDetection: React.FC<PollutionDetectionProps> = ({ 
  isDarkMode, 
  selectedIncident 
}) => {
  const [incidents, setIncidents] = useState<PollutionIncident[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate realistic pollution incidents
  useEffect(() => {
    const pollutionData: PollutionIncident[] = [
      {
        id: 'oil-spill-gulf-2024-01',
        type: 'oil_spill',
        severity: 'critical',
        location: { lat: 28.7, lon: -89.2, region: 'Gulf of Mexico', depth: 0 },
        concentration: 25.8,
        unit: 'ppm',
        detectionMethod: 'satellite',
        timestamp: '2024-01-14T14:30:00Z',
        status: 'cleanup',
        estimatedSize: 1500,
        affectedArea: 450,
        sources: ['Oil rig platform failure', 'Equipment malfunction'],
        impact: { marineLife: 85, ecosystem: 90, economic: 95 },
        responseActions: ['Coast Guard deployed', 'Containment booms installed', 'Wildlife rescue initiated']
      },
      {
        id: 'plastic-patch-pacific-2024-02',
        type: 'plastic',
        severity: 'high',
        location: { lat: 38.0, lon: -145.0, region: 'North Pacific Gyre' },
        concentration: 750.2,
        unit: 'particles/m³',
        detectionMethod: 'ai_analysis',
        timestamp: '2024-01-12T09:15:00Z',
        status: 'monitoring',
        estimatedSize: 12500,
        affectedArea: 8900,
        sources: ['Land-based waste', 'Shipping debris', 'Fishing gear'],
        impact: { marineLife: 75, ecosystem: 70, economic: 45 },
        responseActions: ['Ocean cleanup vessels deployed', 'Research mission launched', 'Public awareness campaign']
      },
      {
        id: 'chemical-discharge-med-2024-03',
        type: 'chemical',
        severity: 'medium',
        location: { lat: 41.9, lon: 12.5, region: 'Mediterranean Sea', depth: 50 },
        concentration: 12.4,
        unit: 'mg/L',
        detectionMethod: 'sensor',
        timestamp: '2024-01-10T16:45:00Z',
        status: 'contained',
        estimatedSize: 350,
        affectedArea: 125,
        sources: ['Industrial discharge', 'Wastewater treatment overflow'],
        impact: { marineLife: 60, ecosystem: 55, economic: 30 },
        responseActions: ['Source identified and stopped', 'Water quality monitoring', 'Fish advisory issued']
      },
      {
        id: 'microplastics-arctic-2024-04',
        type: 'microplastics',
        severity: 'high',
        location: { lat: 75.0, lon: 0.0, region: 'Arctic Ocean', depth: 100 },
        concentration: 1250.7,
        unit: 'particles/L',
        detectionMethod: 'visual',
        timestamp: '2024-01-08T11:20:00Z',
        status: 'monitoring',
        estimatedSize: 5500,
        affectedArea: 3200,
        sources: ['Textile waste', 'Packaging materials', 'Atmospheric transport'],
        impact: { marineLife: 70, ecosystem: 65, economic: 25 },
        responseActions: ['Research data collection', 'Source tracking analysis', 'Policy recommendations drafted']
      },
      {
        id: 'sewage-discharge-caribbean-2024-05',
        type: 'sewage',
        severity: 'medium',
        location: { lat: 18.2, lon: -66.5, region: 'Caribbean Sea' },
        concentration: 850.0,
        unit: 'CFU/100ml',
        detectionMethod: 'citizen_report',
        timestamp: '2024-01-06T08:30:00Z',
        status: 'resolved',
        estimatedSize: 200,
        affectedArea: 75,
        sources: ['Treatment plant overflow', 'Hurricane damage'],
        impact: { marineLife: 45, ecosystem: 40, economic: 60 },
        responseActions: ['Repairs completed', 'Water testing normalized', 'Beach reopened']
      },
      {
        id: 'acidification-coral-triangle-2024-06',
        type: 'acidification',
        severity: 'high',
        location: { lat: -2.0, lon: 131.0, region: 'Coral Triangle', depth: 25 },
        concentration: 7.9,
        unit: 'pH',
        detectionMethod: 'sensor',
        timestamp: '2024-01-04T13:10:00Z',
        status: 'monitoring',
        estimatedSize: 8900,
        affectedArea: 6700,
        sources: ['CO2 absorption', 'Industrial runoff', 'Agricultural pollution'],
        impact: { marineLife: 80, ecosystem: 85, economic: 70 },
        responseActions: ['pH monitoring increased', 'Coral restoration started', 'Emission reduction talks']
      },
      {
        id: 'thermal-discharge-baltic-2024-07',
        type: 'thermal',
        severity: 'medium',
        location: { lat: 59.3, lon: 18.1, region: 'Baltic Sea', depth: 10 },
        concentration: 35.2,
        unit: '°C',
        detectionMethod: 'satellite',
        timestamp: '2024-01-02T10:45:00Z',
        status: 'contained',
        estimatedSize: 120,
        affectedArea: 45,
        sources: ['Power plant cooling water', 'Industrial discharge'],
        impact: { marineLife: 50, ecosystem: 45, economic: 20 },
        responseActions: ['Cooling system modified', 'Temperature monitoring', 'Fish migration tracked']
      },
      {
        id: 'noise-pollution-shipping-2024-08',
        type: 'noise',
        severity: 'medium',
        location: { lat: 51.0, lon: 1.0, region: 'English Channel' },
        concentration: 180.5,
        unit: 'dB',
        detectionMethod: 'sensor',
        timestamp: '2023-12-30T19:20:00Z',
        status: 'monitoring',
        estimatedSize: 2500,
        affectedArea: 1800,
        sources: ['Shipping traffic', 'Construction activities', 'Military exercises'],
        impact: { marineLife: 65, ecosystem: 40, economic: 15 },
        responseActions: ['Shipping lane adjustments', 'Quiet ship technology promoted', 'Marine life monitoring']
      }
    ];

    setIncidents(pollutionData);
  }, []);

  // Draw pollution visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || incidents.length === 0) return;

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

    // Draw world map
    drawWorldMap(ctx, rect);

    // Draw pollution incidents
    const filtered = incidents.filter(incident => {
      const typeMatch = filterType === 'all' || incident.type === filterType;
      const severityMatch = filterSeverity === 'all' || incident.severity === filterSeverity;
      return typeMatch && severityMatch;
    });

    filtered.forEach(incident => {
      drawPollutionIncident(ctx, rect, incident);
    });

  }, [incidents, filterType, filterSeverity, isDarkMode]);

  const drawWorldMap = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
    // Ocean background
    ctx.fillStyle = isDarkMode ? '#1e293b' : '#dbeafe';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Simple continents
    ctx.fillStyle = isDarkMode ? '#374151' : '#f3f4f6';
    ctx.strokeStyle = isDarkMode ? '#4b5563' : '#d1d5db';
    ctx.lineWidth = 1;
    
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
      ctx.stroke();
    });
  };

  const drawPollutionIncident = (ctx: CanvasRenderingContext2D, rect: DOMRect, incident: PollutionIncident) => {
    // Convert lat/lon to canvas coordinates
    const x = ((incident.location.lon + 180) / 360) * rect.width;
    const y = ((90 - incident.location.lat) / 180) * rect.height;

    // Size based on affected area
    const baseRadius = 3;
    const maxRadius = 15;
    const radius = baseRadius + (Math.log(incident.affectedArea + 1) / Math.log(10000)) * (maxRadius - baseRadius);

    // Color based on type and severity
    const typeColors = {
      oil_spill: '#0f172a',
      plastic: '#dc2626',
      chemical: '#7c3aed',
      sewage: '#92400e',
      microplastics: '#f59e0b',
      acidification: '#0ea5e9',
      thermal: '#ea580c',
      noise: '#6b7280'
    };

    const severityOpacity = {
      low: '40',
      medium: '60',
      high: '80',
      critical: 'ff'
    };

    const color = typeColors[incident.type] + severityOpacity[incident.severity];

    // Draw incident area
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = typeColors[incident.type];
    ctx.lineWidth = incident.severity === 'critical' ? 3 : 2;
    ctx.stroke();

    // Draw center point
    ctx.fillStyle = typeColors[incident.type];
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Add pulsing effect for critical incidents
    if (incident.severity === 'critical' && incident.status === 'detected') {
      const pulseRadius = radius + (Math.sin(Date.now() / 500) + 1) * 5;
      ctx.strokeStyle = typeColors[incident.type] + '40';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'oil_spill': return 'text-gray-900 bg-gray-100';
      case 'plastic': return 'text-red-700 bg-red-100';
      case 'chemical': return 'text-purple-700 bg-purple-100';
      case 'sewage': return 'text-yellow-800 bg-yellow-100';
      case 'microplastics': return 'text-orange-700 bg-orange-100';
      case 'acidification': return 'text-blue-700 bg-blue-100';
      case 'thermal': return 'text-orange-800 bg-orange-100';
      case 'noise': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-700 bg-green-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'critical': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'text-red-700 bg-red-100';
      case 'monitoring': return 'text-blue-700 bg-blue-100';
      case 'contained': return 'text-yellow-700 bg-yellow-100';
      case 'cleanup': return 'text-orange-700 bg-orange-100';
      case 'resolved': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const typeMatch = filterType === 'all' || incident.type === filterType;
    const severityMatch = filterSeverity === 'all' || incident.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
  const avgEconomicImpact = incidents.reduce((acc, i) => acc + i.impact.economic, 0) / incidents.length;

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
            <BeakerIcon className="h-6 w-6 text-red-600" />
            {criticalIncidents > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <h2 className={`text-xl font-semibold ${textClass}`}>
            Ocean Pollution Detection System
          </h2>
          {alertsEnabled && criticalIncidents > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {criticalIncidents} Critical Alert{criticalIncidents > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-1 rounded border text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="all">All Types</option>
            <option value="oil_spill">Oil Spill</option>
            <option value="plastic">Plastic</option>
            <option value="chemical">Chemical</option>
            <option value="sewage">Sewage</option>
            <option value="microplastics">Microplastics</option>
            <option value="acidification">Acidification</option>
            <option value="thermal">Thermal</option>
            <option value="noise">Noise</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className={`px-3 py-1 rounded border text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              alertsEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Alerts {alertsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Pollution Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-red-600">{filteredIncidents.length}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Active Incidents</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-orange-600">{criticalIncidents}</div>
          <div className={`text-sm ${secondaryTextClass}`}>Critical Alerts</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-blue-600">
            {filteredIncidents.reduce((acc, i) => acc + i.affectedArea, 0).toLocaleString()}
          </div>
          <div className={`text-sm ${secondaryTextClass}`}>Total Area (km²)</div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold text-purple-600">{Math.round(avgEconomicImpact)}%</div>
          <div className={`text-sm ${secondaryTextClass}`}>Avg Economic Impact</div>
        </div>
      </div>

      {/* Pollution Map */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          className="w-full border rounded"
          style={{ height: '400px' }}
        />
      </div>

      {/* Pollution Incidents List */}
      <div className="space-y-4">
        <h3 className={`text-lg font-medium ${textClass}`}>Recent Pollution Incidents</h3>
        
        {filteredIncidents.map((incident) => (
          <div
            key={incident.id}
            className={`p-4 rounded-lg border ${
              incident.severity === 'critical' 
                ? 'border-red-500 bg-red-50' 
                : isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`font-medium ${textClass}`}>
                    {incident.type.replace('_', ' ').toUpperCase()} - {incident.location.region}
                  </h4>
                  {incident.severity === 'critical' && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(incident.type)}`}>
                    {incident.type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
              </div>
              <div className={`text-xs ${secondaryTextClass} text-right`}>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>{new Date(incident.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <MapPinIcon className="h-3 w-3" />
                  <span>{incident.location.lat.toFixed(1)}°, {incident.location.lon.toFixed(1)}°</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <div className={`text-xs ${secondaryTextClass}`}>Concentration</div>
                <div className={`font-mono ${textClass}`}>
                  {incident.concentration} {incident.unit}
                </div>
              </div>
              <div>
                <div className={`text-xs ${secondaryTextClass}`}>Affected Area</div>
                <div className={`font-mono ${textClass}`}>
                  {incident.affectedArea.toLocaleString()} km²
                </div>
              </div>
              <div>
                <div className={`text-xs ${secondaryTextClass}`}>Detection Method</div>
                <div className={`text-sm ${textClass} capitalize`}>
                  {incident.detectionMethod.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className={`text-xs ${secondaryTextClass}`}>Marine Life Impact</div>
                <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}>
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${incident.impact.marineLife}%` }}
                  />
                </div>
                <div className={`text-xs ${textClass}`}>{incident.impact.marineLife}%</div>
              </div>
              <div>
                <div className={`text-xs ${secondaryTextClass}`}>Ecosystem Impact</div>
                <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}>
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${incident.impact.ecosystem}%` }}
                  />
                </div>
                <div className={`text-xs ${textClass}`}>{incident.impact.ecosystem}%</div>
              </div>
              <div>
                <div className={`text-xs ${secondaryTextClass}`}>Economic Impact</div>
                <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full`}>
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${incident.impact.economic}%` }}
                  />
                </div>
                <div className={`text-xs ${textClass}`}>{incident.impact.economic}%</div>
              </div>
            </div>

            {incident.responseActions.length > 0 && (
              <div>
                <div className={`text-xs ${secondaryTextClass} mb-1`}>Response Actions:</div>
                <ul className={`text-sm ${textClass} space-y-1`}>
                  {incident.responseActions.slice(0, 2).map((action, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PollutionDetection;