import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon } from '@heroicons/react/24/outline';

interface TemperatureDataPoint {
  timestamp: string;
  temperature: number;
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  anomaly?: number;
}

interface TimeSeriesData {
  date: string;
  globalAverage: number;
  regions: {
    [regionName: string]: {
      temperature: number;
      anomaly: number;
      coordinates: { lat: number; lon: number };
    };
  };
}

interface TimeLapseVisualizationProps {
  isDarkMode: boolean;
  selectedRegion?: string;
  timeRange: 'week' | 'month' | 'year' | '5years';
}

const TimeLapseVisualization: React.FC<TimeLapseVisualizationProps> = ({
  isDarkMode,
  selectedRegion,
  timeRange
}) => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const regions = [
    { name: 'Great Barrier Reef', lat: -16.3, lon: 145.8, color: '#FF6B6B' },
    { name: 'Caribbean Sea', lat: 15.0, lon: -75.0, color: '#4ECDC4' },
    { name: 'Mediterranean Sea', lat: 40.0, lon: 15.0, color: '#45B7D1' },
    { name: 'North Sea', lat: 56.5, lon: 3.0, color: '#96CEB4' },
    { name: 'Red Sea', lat: 22.0, lon: 38.0, color: '#FFEAA7' },
    { name: 'Gulf of Mexico', lat: 25.0, lon: -90.0, color: '#DDA0DD' },
    { name: 'Baltic Sea', lat: 58.0, lon: 19.0, color: '#98D8C8' },
    { name: 'Coral Triangle', lat: -5.0, lon: 120.0, color: '#F06292' }
  ];

  useEffect(() => {
    generateTimeSeriesData();
  }, [timeRange]);

  useEffect(() => {
    if (timeSeriesData.length > 0) {
      drawVisualization();
    }
  }, [currentIndex, timeSeriesData, isDarkMode]);

  useEffect(() => {
    if (isPlaying && timeSeriesData.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= timeSeriesData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, timeSeriesData.length]);

  const generateTimeSeriesData = () => {
    setLoading(true);
    
    // Generate synthetic time series data
    const data: TimeSeriesData[] = [];
    const now = new Date();
    let dataPoints: number;
    let interval: number; // in days
    
    switch (timeRange) {
      case 'week':
        dataPoints = 7;
        interval = 1;
        break;
      case 'month':
        dataPoints = 30;
        interval = 1;
        break;
      case 'year':
        dataPoints = 52;
        interval = 7;
        break;
      case '5years':
        dataPoints = 60;
        interval = 30;
        break;
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * interval));
      
      // Generate seasonal temperature variations
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
      const seasonalVariation = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 3;
      
      // Add climate change trend (warming over time)
      const climateChangeTrend = ((dataPoints - i) / dataPoints) * 0.5;
      
      // Add random noise
      const randomNoise = (Math.random() - 0.5) * 2;
      
      const baseTemp = 26.5; // Base ocean temperature
      const globalAverage = baseTemp + seasonalVariation + climateChangeTrend + randomNoise;
      
      const regionData: { [key: string]: any } = {};
      
      regions.forEach(region => {
        // Each region has its own characteristics
        const regionModifier = (Math.random() - 0.5) * 4;
        const latitudeEffect = Math.abs(region.lat) / 90 * -3; // Colder at higher latitudes
        
        const regionalTemp = globalAverage + regionModifier + latitudeEffect;
        const anomaly = regionalTemp - (baseTemp + latitudeEffect); // Anomaly from expected
        
        regionData[region.name] = {
          temperature: Math.max(regionalTemp, 0),
          anomaly: anomaly,
          coordinates: { lat: region.lat, lon: region.lon }
        };
      });
      
      data.push({
        date: date.toISOString().split('T')[0],
        globalAverage: Math.max(globalAverage, 0),
        regions: regionData
      });
    }
    
    setTimeSeriesData(data);
    setCurrentIndex(0);
    setLoading(false);
  };

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !timeSeriesData[currentIndex]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    const currentData = timeSeriesData[currentIndex];
    
    // Draw world map outline (simplified)
    drawWorldMapOutline(ctx, width, height);
    
    // Draw temperature data points
    Object.entries(currentData.regions).forEach(([regionName, regionData]) => {
      const region = regions.find(r => r.name === regionName);
      if (!region) return;

      // Convert lat/lon to canvas coordinates (simplified projection)
      const x = ((region.lon + 180) / 360) * width;
      const y = ((90 - region.lat) / 180) * height;

      // Color based on temperature anomaly
      const anomaly = regionData.anomaly;
      const intensity = Math.min(Math.abs(anomaly) / 3, 1); // Normalize to 0-1
      
      let color;
      if (anomaly > 0) {
        // Warm anomaly - red
        const red = Math.floor(255 * intensity);
        color = `rgba(${red}, ${100 - red * 0.3}, 50, 0.8)`;
      } else {
        // Cold anomaly - blue
        const blue = Math.floor(255 * intensity);
        color = `rgba(50, ${100 - blue * 0.3}, ${blue}, 0.8)`;
      }

      // Draw temperature point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(5, intensity * 15), 0, 2 * Math.PI);
      ctx.fill();

      // Draw temperature label
      if (selectedRegion === regionName || !selectedRegion) {
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(
          `${regionData.temperature.toFixed(1)}°C`,
          x + 8,
          y - 8
        );
      }
    });

    // Draw legend
    drawLegend(ctx, width, height);
  };

  const drawWorldMapOutline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = isDarkMode ? '#4b5563' : '#d1d5db';
    ctx.lineWidth = 1;
    
    // Simplified continents outline
    const continents = [
      // North America
      { x: 0.15, y: 0.2, w: 0.25, h: 0.35 },
      // South America
      { x: 0.2, y: 0.45, w: 0.15, h: 0.4 },
      // Europe
      { x: 0.45, y: 0.15, w: 0.1, h: 0.2 },
      // Africa
      { x: 0.45, y: 0.25, w: 0.15, h: 0.45 },
      // Asia
      { x: 0.55, y: 0.1, w: 0.35, h: 0.4 },
      // Australia
      { x: 0.75, y: 0.65, w: 0.15, h: 0.1 }
    ];

    continents.forEach(continent => {
      ctx.fillStyle = isDarkMode ? '#374151' : '#e5e7eb';
      ctx.fillRect(
        continent.x * width,
        continent.y * height,
        continent.w * width,
        continent.h * height
      );
      ctx.strokeRect(
        continent.x * width,
        continent.y * height,
        continent.w * width,
        continent.h * height
      );
    });
  };

  const drawLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const legendX = width - 150;
    const legendY = 20;
    
    // Background
    ctx.fillStyle = isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(249, 250, 251, 0.9)';
    ctx.fillRect(legendX - 10, legendY - 10, 140, 120);
    
    ctx.strokeStyle = isDarkMode ? '#4b5563' : '#d1d5db';
    ctx.strokeRect(legendX - 10, legendY - 10, 140, 120);
    
    // Title
    ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Temperature Anomaly', legendX, legendY + 10);
    
    // Legend items
    const legendItems = [
      { color: 'rgba(255, 50, 50, 0.8)', label: '+3°C Above Normal' },
      { color: 'rgba(255, 150, 50, 0.8)', label: '+1°C Above Normal' },
      { color: 'rgba(100, 100, 100, 0.8)', label: 'Normal' },
      { color: 'rgba(50, 150, 255, 0.8)', label: '-1°C Below Normal' },
      { color: 'rgba(50, 50, 255, 0.8)', label: '-3°C Below Normal' }
    ];
    
    ctx.font = '11px Arial';
    legendItems.forEach((item, index) => {
      const y = legendY + 30 + (index * 18);
      
      // Color circle
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX + 8, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Label
      ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
      ctx.fillText(item.label, legendX + 20, y + 4);
    });
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const stepForward = () => {
    setCurrentIndex(prev => Math.min(prev + 1, timeSeriesData.length - 1));
  };

  const stepBackward = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const resetToStart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(parseInt(e.target.value));
  };

  const containerClass = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className={`rounded-lg border ${containerClass} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${textClass}`}>
          Ocean Temperature Time-lapse
        </h2>
        <div className="flex items-center space-x-3">
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className={`px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
          >
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1x Speed</option>
            <option value={2}>2x Speed</option>
            <option value={4}>4x Speed</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && timeSeriesData.length > 0 && (
        <>
          {/* Visualization Canvas */}
          <div className="relative mb-6">
            <canvas
              ref={canvasRef}
              className={`w-full h-96 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
              style={{ maxWidth: '100%' }}
            />
            
            {/* Current Date Overlay */}
            <div className={`absolute top-4 left-4 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-white'} bg-opacity-90 ${textClass} font-semibold`}>
              {timeSeriesData[currentIndex]?.date}
            </div>

            {/* Global Average Overlay */}
            <div className={`absolute top-4 right-4 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-white'} bg-opacity-90 ${textClass}`}>
              Global Avg: {timeSeriesData[currentIndex]?.globalAverage.toFixed(2)}°C
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Timeline Slider */}
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${secondaryTextClass} min-w-0 flex-shrink-0`}>
                {timeSeriesData[0]?.date}
              </span>
              <input
                type="range"
                min="0"
                max={timeSeriesData.length - 1}
                value={currentIndex}
                onChange={handleSliderChange}
                className="flex-1"
              />
              <span className={`text-sm ${secondaryTextClass} min-w-0 flex-shrink-0`}>
                {timeSeriesData[timeSeriesData.length - 1]?.date}
              </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={resetToStart}
                className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                title="Reset to Start"
              >
                ⏮
              </button>
              
              <button
                onClick={stepBackward}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                title="Step Backward"
              >
                <BackwardIcon className="h-5 w-5" />
              </button>

              <button
                onClick={togglePlayback}
                disabled={currentIndex >= timeSeriesData.length - 1}
                className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>

              <button
                onClick={stepForward}
                disabled={currentIndex >= timeSeriesData.length - 1}
                className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                title="Step Forward"
              >
                <ForwardIcon className="h-5 w-5" />
              </button>

              <div className={`text-sm ${secondaryTextClass}`}>
                {currentIndex + 1} / {timeSeriesData.length}
              </div>
            </div>
          </div>

          {/* Current Data Summary */}
          {timeSeriesData[currentIndex] && (
            <div className="mt-6">
              <h3 className={`text-lg font-medium mb-3 ${textClass}`}>
                Regional Data - {timeSeriesData[currentIndex].date}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(timeSeriesData[currentIndex].regions).map(([regionName, regionData]) => {
                  const anomaly = regionData.anomaly;
                  const anomalyColor = anomaly > 0 
                    ? 'text-red-600' 
                    : anomaly < -0.5 
                      ? 'text-blue-600' 
                      : 'text-gray-600';
                  
                  return (
                    <div
                      key={regionName}
                      className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className={`font-medium ${textClass} text-sm`}>
                        {regionName}
                      </div>
                      <div className={`text-lg font-bold ${textClass}`}>
                        {regionData.temperature.toFixed(1)}°C
                      </div>
                      <div className={`text-sm ${anomalyColor}`}>
                        {anomaly >= 0 ? '+' : ''}{anomaly.toFixed(1)}°C anomaly
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimeLapseVisualization;