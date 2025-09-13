import React, { useState, useEffect, useRef } from 'react';
import { ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface HealthMetric {
  name: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  weight: number;
  description: string;
  lastUpdated: string;
}

interface RegionScore {
  region: string;
  coordinates: { lat: number; lon: number };
  overallScore: number;
  metrics: HealthMetric[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface OceanHealthScoringProps {
  isDarkMode: boolean;
  selectedRegion?: string;
}

const OceanHealthScoring: React.FC<OceanHealthScoringProps> = ({ 
  isDarkMode, 
  selectedRegion = 'Global' 
}) => {
  const [regionScores, setRegionScores] = useState<RegionScore[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('1M');
  const [loading, setLoading] = useState(true);
  const [currentRegion, setCurrentRegion] = useState<string>(selectedRegion || 'Global');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ocean health metrics with realistic marine science data
  const healthMetrics: HealthMetric[] = [
    {
      name: 'Water Temperature',
      value: 78.5,
      status: 'warning',
      trend: 'declining',
      weight: 0.25,
      description: 'Sea surface temperature anomaly',
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      name: 'pH Level',
      value: 65.2,
      status: 'critical',
      trend: 'declining',
      weight: 0.20,
      description: 'Ocean acidification indicator',
      lastUpdated: '2024-01-15T09:45:00Z'
    },
    {
      name: 'Dissolved Oxygen',
      value: 82.1,
      status: 'good',
      trend: 'stable',
      weight: 0.20,
      description: 'Oxygen levels in water column',
      lastUpdated: '2024-01-15T10:15:00Z'
    },
    {
      name: 'Chlorophyll-a',
      value: 88.9,
      status: 'excellent',
      trend: 'improving',
      weight: 0.15,
      description: 'Primary productivity indicator',
      lastUpdated: '2024-01-15T08:20:00Z'
    },
    {
      name: 'Plastic Pollution',
      value: 42.3,
      status: 'critical',
      trend: 'declining',
      weight: 0.10,
      description: 'Microplastic concentration levels',
      lastUpdated: '2024-01-15T07:30:00Z'
    },
    {
      name: 'Biodiversity Index',
      value: 71.8,
      status: 'warning',
      trend: 'declining',
      weight: 0.10,
      description: 'Marine species diversity measure',
      lastUpdated: '2024-01-15T06:45:00Z'
    }
  ];

  // Generate regional scores
  useEffect(() => {
    const generateRegionScores = () => {
      const regions = [
        { name: 'North Pacific', lat: 45, lon: -150 },
        { name: 'South Pacific', lat: -25, lon: -140 },
        { name: 'North Atlantic', lat: 50, lon: -30 },
        { name: 'South Atlantic', lat: -30, lon: -20 },
        { name: 'Indian Ocean', lat: -20, lon: 80 },
        { name: 'Arctic Ocean', lat: 75, lon: 0 },
        { name: 'Southern Ocean', lat: -60, lon: 0 },
        { name: 'Mediterranean Sea', lat: 35, lon: 15 }
      ];

      const scores = regions.map(region => {
        // Generate region-specific variations
        const regionalMetrics = healthMetrics.map(metric => ({
          ...metric,
          value: Math.max(0, Math.min(100, 
            metric.value + (Math.random() - 0.5) * 30
          ))
        }));

        // Calculate weighted overall score
        const overallScore = regionalMetrics.reduce((acc, metric) => 
          acc + (metric.value * metric.weight), 0
        );

        const riskLevel: 'low' | 'medium' | 'high' | 'critical' = overallScore >= 80 ? 'low' : 
                         overallScore >= 60 ? 'medium' : 
                         overallScore >= 40 ? 'high' : 'critical';

        const recommendations = [
          overallScore < 70 ? 'Implement stricter pollution controls' : null,
          regionalMetrics.find(m => m.name === 'pH Level')?.value < 70 ? 'Monitor acidification levels' : null,
          regionalMetrics.find(m => m.name === 'Water Temperature')?.value > 80 ? 'Track thermal stress indicators' : null,
          regionalMetrics.find(m => m.name === 'Plastic Pollution')?.value < 60 ? 'Enhance waste management programs' : null
        ].filter(Boolean) as string[];

        return {
          region: region.name,
          coordinates: region,
          overallScore: Math.round(overallScore * 10) / 10,
          metrics: regionalMetrics,
          riskLevel,
          recommendations
        };
      });

      setRegionScores(scores);
      setLoading(false);
    };

    generateRegionScores();
  }, []);

  // Draw scoring visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;

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

    // Draw health score visualization
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 3;

    // Get current region or global average
    const currentData = currentRegion === 'Global' 
      ? {
          overallScore: regionScores.reduce((acc, r) => acc + r.overallScore, 0) / regionScores.length,
          metrics: healthMetrics
        }
      : regionScores.find(r => r.region === currentRegion) || regionScores[0];

    if (!currentData) return;

    // Draw circular health meter
    const scoreAngle = (currentData.overallScore / 100) * 2 * Math.PI;
    
    // Background circle
    ctx.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Score arc
    const scoreColor = currentData.overallScore >= 80 ? '#10b981' :
                      currentData.overallScore >= 60 ? '#f59e0b' :
                      currentData.overallScore >= 40 ? '#f97316' : '#ef4444';
    
    ctx.strokeStyle = scoreColor;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + scoreAngle);
    ctx.stroke();

    // Score text
    ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#111827';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      currentData.overallScore.toFixed(1),
      centerX,
      centerY - 5
    );

    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Health Score', centerX, centerY + 15);

    // Draw metric bars
    if (selectedMetric === 'all') {
      const barWidth = 60;
      const barHeight = 8;
      const startY = centerY + radius + 40;
      const cols = 3;
      
      currentData.metrics.forEach((metric, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = centerX - (cols * (barWidth + 20)) / 2 + col * (barWidth + 20);
        const y = startY + row * 40;

        // Metric name
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = isDarkMode ? '#d1d5db' : '#6b7280';
        ctx.textAlign = 'left';
        ctx.fillText(metric.name, x, y - 15);

        // Background bar
        ctx.fillStyle = isDarkMode ? '#374151' : '#e5e7eb';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Value bar
        const metricColor = metric.status === 'excellent' ? '#10b981' :
                           metric.status === 'good' ? '#22d3ee' :
                           metric.status === 'warning' ? '#f59e0b' : '#ef4444';
        
        ctx.fillStyle = metricColor;
        ctx.fillRect(x, y, (metric.value / 100) * barWidth, barHeight);

        // Value text
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#111827';
        ctx.textAlign = 'right';
        ctx.fillText(metric.value.toFixed(1), x + barWidth, y + 15);
      });
    }

  }, [regionScores, currentRegion, selectedMetric, isDarkMode, loading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-cyan-600 bg-cyan-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-700 bg-green-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'critical': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'stable': return <div className="h-4 w-4 bg-blue-600 rounded-full"></div>;
      case 'declining': return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const containerClass = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  if (loading) {
    return (
      <div className={`rounded-lg border ${containerClass} p-6`}>
        <div className="animate-pulse">
          <div className={`h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
          <div className={`h-64 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${containerClass} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className={`h-6 w-6 text-blue-600`} />
          <h2 className={`text-xl font-semibold ${textClass}`}>
            Ocean Health Scoring System
          </h2>
        </div>

        <div className="flex space-x-4">
          <select
            value={currentRegion}
            onChange={(e) => setCurrentRegion(e.target.value)}
            className={`px-3 py-1 rounded border text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="Global">Global Average</option>
            {regionScores.map(region => (
              <option key={region.region} value={region.region}>
                {region.region}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-3 py-1 rounded border text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="1D">1 Day</option>
            <option value="1W">1 Week</option>
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="1Y">1 Year</option>
          </select>
        </div>
      </div>

      {/* Health Score Visualization */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '320px' }}
        />
      </div>

      {/* Regional Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {regionScores.map((region) => (
          <div
            key={region.region}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              currentRegion === region.region
                ? 'border-blue-500 shadow-lg'
                : isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
            } ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            onClick={() => setCurrentRegion(region.region)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-medium ${textClass}`}>{region.region}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(region.riskLevel)}`}>
                {region.riskLevel.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-2xl font-bold ${textClass}`}>
                {region.overallScore.toFixed(1)}
              </span>
              <span className={`text-sm ${secondaryTextClass}`}>/ 100</span>
            </div>

            <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full mb-2`}>
              <div
                className={`h-full rounded-full ${
                  region.overallScore >= 80 ? 'bg-green-500' :
                  region.overallScore >= 60 ? 'bg-yellow-500' :
                  region.overallScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${region.overallScore}%` }}
              />
            </div>

            <div className={`text-xs ${secondaryTextClass}`}>
              {region.recommendations.length} recommendations
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Metrics Table */}
      <div className="mb-6">
        <h3 className={`text-lg font-medium mb-4 ${textClass}`}>
          Health Metrics Detail
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <th className={`text-left p-3 font-medium ${textClass}`}>Metric</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Score</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Status</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Trend</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Weight</th>
                <th className={`text-left p-3 font-medium ${textClass}`}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {healthMetrics.map((metric, index) => (
                <tr 
                  key={metric.name}
                  className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                >
                  <td className={`p-3 ${textClass}`}>
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className={`text-xs ${secondaryTextClass}`}>
                        {metric.description}
                      </div>
                    </div>
                  </td>
                  <td className={`p-3 font-mono ${textClass}`}>
                    {metric.value.toFixed(1)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                      {metric.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm ${secondaryTextClass} capitalize`}>
                        {metric.trend}
                      </span>
                    </div>
                  </td>
                  <td className={`p-3 font-mono ${textClass}`}>
                    {(metric.weight * 100).toFixed(0)}%
                  </td>
                  <td className={`p-3 text-sm ${secondaryTextClass}`}>
                    {new Date(metric.lastUpdated).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {currentRegion !== 'Global' && (
        <div>
          <h3 className={`text-lg font-medium mb-4 ${textClass}`}>
            Recommendations for {currentRegion}
          </h3>
          {regionScores.find(r => r.region === currentRegion)?.recommendations.map((rec, index) => (
            <div 
              key={index}
              className={`flex items-start space-x-3 p-3 rounded-lg mb-2 ${
                isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
              }`}
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className={`text-sm ${textClass}`}>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OceanHealthScoring;