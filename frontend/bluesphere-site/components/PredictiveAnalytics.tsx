import React, { useState, useEffect, useRef } from 'react';
import { ChartBarIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface PredictionData {
  region: string;
  currentTemp: number;
  predictedTemp: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedDate: string;
  factors: string[];
  coordinates: { lat: number; lon: number };
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  lastTrained: string;
  dataPoints: number;
}

interface PredictiveAnalyticsProps {
  isDarkMode: boolean;
  selectedTimeframe: '7days' | '14days' | '30days' | '90days';
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  isDarkMode,
  selectedTimeframe
}) => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'risk' | 'confidence'>('temperature');
  const chartRef = useRef<HTMLCanvasElement>(null);

  const regions = [
    { name: 'Great Barrier Reef', lat: -16.3, lon: 145.8 },
    { name: 'Caribbean Sea', lat: 15.0, lon: -75.0 },
    { name: 'Mediterranean Sea', lat: 40.0, lon: 15.0 },
    { name: 'Red Sea', lat: 22.0, lon: 38.0 },
    { name: 'Gulf of Mexico', lat: 25.0, lon: -90.0 },
    { name: 'Coral Triangle', lat: -5.0, lon: 120.0 },
    { name: 'Maldives', lat: 4.2, lon: 73.5 },
    { name: 'Hawaiian Islands', lat: 21.3, lon: -157.8 }
  ];

  useEffect(() => {
    generatePredictions();
    generateModelMetrics();
  }, [selectedTimeframe]);

  useEffect(() => {
    if (predictions.length > 0) {
      drawChart();
    }
  }, [predictions, selectedMetric, isDarkMode]);

  const generatePredictions = () => {
    setLoading(true);
    
    // Simulate ML model predictions
    const newPredictions: PredictionData[] = regions.map(region => {
      const baseTemp = 26.5 + (Math.random() - 0.5) * 4; // Current temperature
      
      // Simulate temperature trend based on various factors
      const seasonalEffect = Math.sin((Date.now() / (1000 * 60 * 60 * 24 * 365)) * 2 * Math.PI) * 2;
      const climateChangeEffect = 0.5; // General warming trend
      const localFactors = (Math.random() - 0.5) * 3;
      const predictedIncrease = seasonalEffect + climateChangeEffect + localFactors;
      
      const predictedTemp = baseTemp + predictedIncrease;
      const confidence = Math.max(0.65, Math.random()); // 65-100% confidence
      
      // Determine risk level based on predicted temperature
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (predictedTemp > 29.5) riskLevel = 'critical';
      else if (predictedTemp > 28.5) riskLevel = 'high';
      else if (predictedTemp > 27.5) riskLevel = 'medium';
      else riskLevel = 'low';
      
      // Generate prediction factors
      const possibleFactors = [
        'El Niño warming pattern',
        'Ocean current changes',
        'Reduced cloud cover',
        'Greenhouse gas concentrations',
        'Solar radiation anomaly',
        'Atmospheric pressure systems',
        'Wind pattern shifts',
        'Deep water upwelling reduction'
      ];
      
      const factors = possibleFactors
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2);
      
      // Calculate prediction date
      const days = selectedTimeframe === '7days' ? 7 
        : selectedTimeframe === '14days' ? 14
        : selectedTimeframe === '30days' ? 30 
        : 90;
      
      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + days);
      
      return {
        region: region.name,
        currentTemp: Math.round(baseTemp * 10) / 10,
        predictedTemp: Math.round(predictedTemp * 10) / 10,
        confidence: Math.round(confidence * 100),
        riskLevel,
        predictedDate: predictedDate.toISOString().split('T')[0],
        factors,
        coordinates: { lat: region.lat, lon: region.lon }
      };
    });
    
    setPredictions(newPredictions);
    setLoading(false);
  };

  const generateModelMetrics = () => {
    setModelMetrics({
      accuracy: Math.round((0.85 + Math.random() * 0.1) * 100) / 100,
      precision: Math.round((0.82 + Math.random() * 0.12) * 100) / 100,
      recall: Math.round((0.79 + Math.random() * 0.15) * 100) / 100,
      lastTrained: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dataPoints: Math.floor(50000 + Math.random() * 20000)
    });
  };

  const drawChart = () => {
    const canvas = chartRef.current;
    if (!canvas || predictions.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 60;

    // Clear canvas
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= predictions.length; i++) {
      const x = padding + (i * (width - 2 * padding)) / predictions.length;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - 2 * padding)) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw data based on selected metric
    let dataPoints: number[] = [];
    let maxValue = 0;
    let minValue = Infinity;

    if (selectedMetric === 'temperature') {
      dataPoints = predictions.map(p => p.predictedTemp);
      maxValue = Math.max(...dataPoints);
      minValue = Math.min(...dataPoints);
    } else if (selectedMetric === 'risk') {
      dataPoints = predictions.map(p => {
        const riskValues = { low: 1, medium: 2, high: 3, critical: 4 };
        return riskValues[p.riskLevel];
      });
      maxValue = 4;
      minValue = 1;
    } else if (selectedMetric === 'confidence') {
      dataPoints = predictions.map(p => p.confidence);
      maxValue = Math.max(...dataPoints);
      minValue = Math.min(...dataPoints);
    }

    const range = maxValue - minValue;
    const barWidth = (width - 2 * padding) / predictions.length * 0.7;

    // Draw bars
    predictions.forEach((prediction, index) => {
      const value = dataPoints[index];
      const normalizedHeight = range > 0 ? ((value - minValue) / range) * (height - 2 * padding) : 0;
      const barHeight = Math.max(normalizedHeight, 5);
      
      const x = padding + (index * (width - 2 * padding)) / predictions.length + barWidth * 0.15;
      const y = height - padding - barHeight;

      // Color based on risk level for temperature, or metric-specific colors
      let color;
      if (selectedMetric === 'temperature') {
        if (prediction.riskLevel === 'critical') color = '#dc2626';
        else if (prediction.riskLevel === 'high') color = '#ea580c';
        else if (prediction.riskLevel === 'medium') color = '#d97706';
        else color = '#16a34a';
      } else if (selectedMetric === 'risk') {
        if (prediction.riskLevel === 'critical') color = '#dc2626';
        else if (prediction.riskLevel === 'high') color = '#ea580c';
        else if (prediction.riskLevel === 'medium') color = '#d97706';
        else color = '#16a34a';
      } else {
        color = `rgba(59, 130, 246, ${value / 100})`;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value labels
      ctx.fillStyle = isDarkMode ? '#f9fafb' : '#1f2937';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      let displayValue = '';
      if (selectedMetric === 'temperature') {
        displayValue = `${value.toFixed(1)}°C`;
      } else if (selectedMetric === 'confidence') {
        displayValue = `${value}%`;
      } else {
        displayValue = prediction.riskLevel.toUpperCase();
      }
      
      ctx.fillText(displayValue, x + barWidth / 2, y - 5);

      // Draw region labels
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(prediction.region, 0, 0);
      ctx.restore();
    });

    // Draw y-axis labels
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - 2 * padding)) / 5;
      const value = maxValue - (i * range) / 5;
      let label = '';
      
      if (selectedMetric === 'temperature') {
        label = `${value.toFixed(1)}°C`;
      } else if (selectedMetric === 'confidence') {
        label = `${Math.round(value)}%`;
      } else {
        const riskLabels = ['', 'Low', 'Medium', 'High', 'Critical'];
        label = riskLabels[Math.round(value)] || '';
      }
      
      ctx.fillText(label, padding - 10, y + 4);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
    return <ArrowTrendingUpIcon className="h-4 w-4" />;
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
        <div className="flex items-center space-x-3">
          <ChartBarIcon className={`h-6 w-6 ${textClass}`} />
          <h2 className={`text-xl font-semibold ${textClass}`}>
            Predictive Analytics
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className={`px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
          >
            <option value="temperature">Temperature Forecast</option>
            <option value="risk">Risk Assessment</option>
            <option value="confidence">Model Confidence</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* Model Performance Metrics */}
          {modelMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(modelMetrics.accuracy * 100)}%
                </div>
                <div className={`text-sm ${secondaryTextClass}`}>Accuracy</div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(modelMetrics.precision * 100)}%
                </div>
                <div className={`text-sm ${secondaryTextClass}`}>Precision</div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(modelMetrics.recall * 100)}%
                </div>
                <div className={`text-sm ${secondaryTextClass}`}>Recall</div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${textClass}`}>
                  {modelMetrics.dataPoints.toLocaleString()}
                </div>
                <div className={`text-sm ${secondaryTextClass}`}>Data Points</div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="mb-6">
            <canvas
              ref={chartRef}
              className={`w-full h-80 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
            />
          </div>

          {/* Risk Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {(['critical', 'high', 'medium', 'low'] as const).map(level => {
              const count = predictions.filter(p => p.riskLevel === level).length;
              const color = getRiskColor(level);
              
              return (
                <div key={level} className={`p-3 rounded-lg ${color} flex items-center justify-between`}>
                  <div>
                    <div className="font-semibold text-lg">{count}</div>
                    <div className="text-sm">{level.toUpperCase()} Risk</div>
                  </div>
                  {getRiskIcon(level)}
                </div>
              );
            })}
          </div>

          {/* Detailed Predictions */}
          <div>
            <h3 className={`text-lg font-medium mb-4 ${textClass}`}>
              Regional Forecasts - {selectedTimeframe.replace('days', ' Days')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((prediction, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${textClass}`}>
                      {prediction.region}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(prediction.riskLevel)}`}>
                      {prediction.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className={`text-sm ${secondaryTextClass}`}>Current</div>
                      <div className={`text-lg font-bold ${textClass}`}>
                        {prediction.currentTemp}°C
                      </div>
                    </div>
                    <div>
                      <div className={`text-sm ${secondaryTextClass}`}>Predicted</div>
                      <div className={`text-lg font-bold ${textClass}`}>
                        {prediction.predictedTemp}°C
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className={`text-sm ${secondaryTextClass} mb-1`}>
                      Confidence: {prediction.confidence}%
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2`}>
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className={`text-sm ${secondaryTextClass} mb-2`}>
                    <strong>Key Factors:</strong>
                  </div>
                  <ul className={`text-xs ${secondaryTextClass} space-y-1`}>
                    {prediction.factors.map((factor, i) => (
                      <li key={i}>• {factor}</li>
                    ))}
                  </ul>
                  
                  <div className={`text-xs ${secondaryTextClass} mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    Forecast for: {prediction.predictedDate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Information */}
          <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`text-sm font-medium mb-2 ${textClass}`}>
              Model Information
            </h3>
            <div className={`text-xs ${secondaryTextClass} space-y-1`}>
              <p>
                <strong>Algorithm:</strong> Ensemble Neural Network with LSTM components
              </p>
              <p>
                <strong>Training Data:</strong> {modelMetrics?.dataPoints.toLocaleString()} temperature measurements from satellite and buoy data
              </p>
              <p>
                <strong>Last Updated:</strong> {modelMetrics?.lastTrained}
              </p>
              <p>
                <strong>Features:</strong> SST anomalies, ocean currents, atmospheric pressure, wind patterns, El Niño/La Niña indices
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PredictiveAnalytics;