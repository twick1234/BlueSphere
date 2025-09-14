/*
 * BlueSphere Historical Data Cycling Component
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * 5-Year Historical Data Cycling Feature
 * Displays animated visualization of ocean temperature changes over 5-year periods
 */

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HistoricalDataPoint {
  year: number;
  month: number;
  day: number;
  temperature: number;
  anomaly: number;
  station_id: string;
  lat: number;
  lon: number;
}

interface HistoricalDataCyclerProps {
  startYear?: number;
  endYear?: number;
  cycleSpeed?: number; // milliseconds per year
  stations?: string[]; // specific stations to include
  showAnomaly?: boolean;
  autoPlay?: boolean;
  onYearChange?: (year: number) => void;
  className?: string;
}

const HistoricalDataCycler: React.FC<HistoricalDataCyclerProps> = ({
  startYear = 2019,
  endYear = 2024,
  cycleSpeed = 2000,
  stations = ['41001', '41002', '46001', '46002', '42001'],
  showAnomaly = true,
  autoPlay = true,
  onYearChange,
  className = ''
}) => {
  const [currentYear, setCurrentYear] = useState(startYear);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate mock historical data (in production, this would fetch from API)
  const generateHistoricalData = (): HistoricalDataPoint[] => {
    const mockData: HistoricalDataPoint[] = [];
    const stationCoords = {
      '41001': { lat: 34.7, lon: -72.7, baseTemp: 20 },
      '41002': { lat: 32.3, lon: -75.4, baseTemp: 22 },
      '46001': { lat: 56.3, lon: -148.1, baseTemp: 8 },
      '46002': { lat: 42.6, lon: -130.2, baseTemp: 12 },
      '42001': { lat: 25.9, lon: -89.7, baseTemp: 26 }
    };

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day += 7) { // Weekly data points
          stations.forEach(stationId => {
            const coords = stationCoords[stationId as keyof typeof stationCoords];
            if (!coords) return;

            // Simulate seasonal temperature variation
            const dayOfYear = new Date(year, month - 1, day).getTime();
            const yearStart = new Date(year, 0, 1).getTime();
            const dayOfYearNormalized = (dayOfYear - yearStart) / (1000 * 60 * 60 * 24);
            const seasonalVariation = Math.sin((dayOfYearNormalized / 365) * 2 * Math.PI) * 8;

            // Simulate climate change warming trend (0.18°C per decade)
            const warmingTrend = (year - 2019) * 0.018;

            // Add some random variation
            const randomVariation = (Math.random() - 0.5) * 4;

            const temperature = coords.baseTemp + seasonalVariation + warmingTrend + randomVariation;

            // Calculate anomaly from 1990-2020 baseline
            const baselineTemp = coords.baseTemp + seasonalVariation;
            const anomaly = temperature - baselineTemp;

            mockData.push({
              year,
              month,
              day,
              temperature: Math.round(temperature * 100) / 100,
              anomaly: Math.round(anomaly * 100) / 100,
              station_id: stationId,
              lat: coords.lat,
              lon: coords.lon
            });
          });
        }
      }
    }

    return mockData;
  };

  // Load historical data
  useEffect(() => {
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      try {
        const historicalData = generateHistoricalData();
        setData(historicalData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load historical data');
        setLoading(false);
      }
    }, 1000);
  }, [startYear, endYear, stations.join(',')]);

  // Auto-play cycling
  useEffect(() => {
    if (!isPlaying || loading) return;

    intervalRef.current = setInterval(() => {
      setCurrentYear(prev => {
        const nextYear = prev >= endYear ? startYear : prev + 1;
        onYearChange?.(nextYear);
        return nextYear;
      });
    }, cycleSpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, loading, cycleSpeed, startYear, endYear, onYearChange]);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || loading || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const width = 800;
    const height = 400;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Filter data for current year
    const yearData = data.filter(d => d.year === currentYear);

    if (yearData.length === 0) return;

    // Group by station and calculate monthly averages
    const stationData = stations.map(stationId => {
      const stationPoints = yearData.filter(d => d.station_id === stationId);
      const monthlyAvgs = [];

      for (let month = 1; month <= 12; month++) {
        const monthPoints = stationPoints.filter(d => d.month === month);
        if (monthPoints.length > 0) {
          const avgTemp = d3.mean(monthPoints, d => d.temperature) || 0;
          const avgAnomaly = d3.mean(monthPoints, d => d.anomaly) || 0;
          monthlyAvgs.push({
            month,
            temperature: avgTemp,
            anomaly: avgAnomaly,
            station_id: stationId,
            lat: monthPoints[0].lat,
            lon: monthPoints[0].lon
          });
        }
      }

      return { stationId, data: monthlyAvgs };
    });

    // Set up scales
    const xScale = d3.scaleLinear()
      .domain([1, 12])
      .range([0, innerWidth]);

    const tempExtent = d3.extent(yearData, d => d.temperature) as [number, number];
    const yScale = d3.scaleLinear()
      .domain(tempExtent)
      .nice()
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3);

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.month))
      .y(d => yScale(showAnomaly ? d.anomaly : d.temperature))
      .curve(d3.curveMonotoneX);

    // Add lines for each station
    stationData.forEach((station, index) => {
      if (station.data.length === 0) return;

      g.append('path')
        .datum(station.data)
        .attr('fill', 'none')
        .attr('stroke', colorScale(station.stationId))
        .attr('stroke-width', 3)
        .attr('opacity', 0)
        .attr('d', line)
        .transition()
        .duration(500)
        .attr('opacity', 0.8);

      // Add data points
      g.selectAll(`.points-${station.stationId}`)
        .data(station.data)
        .enter()
        .append('circle')
        .attr('class', `points-${station.stationId}`)
        .attr('cx', d => xScale(d.month))
        .attr('cy', d => yScale(showAnomaly ? d.anomaly : d.temperature))
        .attr('r', 0)
        .attr('fill', colorScale(station.stationId))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .transition()
        .delay((d, i) => i * 50)
        .duration(300)
        .attr('r', 5);
    });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => {
        const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[d as number] || '';
      }));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text(showAnomaly ? 'Temperature Anomaly (°C)' : 'Temperature (°C)');

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('Month');

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 150}, 20)`);

    stationData.forEach((station, index) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${index * 25})`);

      legendRow.append('circle')
        .attr('r', 6)
        .attr('fill', colorScale(station.stationId));

      legendRow.append('text')
        .attr('x', 15)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('fill', '#374151')
        .text(`Station ${station.stationId}`);
    });

  }, [currentYear, data, loading, showAnomaly, stations]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
    onYearChange?.(year);
  };

  if (loading) {
    return (
      <div className={`bs-premium-card p-8 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="flex space-x-2">
            <div className="h-10 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bs-premium-card p-8 ${className}`}>
        <div className="text-center text-red-600">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-lg font-semibold mb-2">Error Loading Historical Data</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bs-premium-card p-8 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="bs-heading-3 mb-2">
            🕰️ Historical Ocean Temperatures ({startYear}-{endYear})
          </h3>
          <p className="bs-text-body">
            5-year cycling visualization showing {showAnomaly ? 'temperature anomalies' : 'absolute temperatures'}
            across {stations.length} monitoring stations
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-blue-600">
            {currentYear}
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showAnomaly}
              onChange={(e) => {
                // This would need to be passed up to parent or managed in state
              }}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-sm">Show Anomalies</span>
          </label>
        </div>
      </div>

      {/* Visualization */}
      <div className="mb-6">
        <svg
          ref={svgRef}
          width={800}
          height={400}
          className="w-full h-auto border rounded-lg bg-white"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            className="bs-btn-primary flex items-center space-x-2"
          >
            <span>{isPlaying ? '⏸️' : '▶️'}</span>
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <label className="bs-text-small font-medium">Speed:</label>
            <input
              type="range"
              min="500"
              max="5000"
              step="500"
              value={cycleSpeed}
              onChange={(e) => {
                // Would need to update speed - could pass to parent
              }}
              className="w-24"
            />
            <span className="bs-text-small">{cycleSpeed/1000}s</span>
          </div>
        </div>

        {/* Year selector */}
        <div className="flex items-center space-x-2">
          <label className="bs-text-small font-medium">Year:</label>
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="bs-premium-card px-3 py-2 text-sm border-0"
          >
            {Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data.filter(d => d.year === currentYear).length}
          </div>
          <div className="bs-text-small">Data Points</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stations.length}
          </div>
          <div className="bs-text-small">Stations</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {(() => {
              const yearData = data.filter(d => d.year === currentYear);
              const avgTemp = d3.mean(yearData, d => d.temperature) || 0;
              return avgTemp.toFixed(1);
            })()}°C
          </div>
          <div className="bs-text-small">Avg Temperature</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {(() => {
              const yearData = data.filter(d => d.year === currentYear);
              const avgAnomaly = d3.mean(yearData, d => d.anomaly) || 0;
              return avgAnomaly > 0 ? '+' + avgAnomaly.toFixed(2) : avgAnomaly.toFixed(2);
            })()}°C
          </div>
          <div className="bs-text-small">Avg Anomaly</div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalDataCycler;