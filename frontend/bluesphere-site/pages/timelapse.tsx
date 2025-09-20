import { useState, useEffect } from 'react';
import TimeLapseVisualization from '../components/TimeLapseVisualization';
import Layout from '../components/Layout';

const TimeLapsePage = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | '5years'>('month');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect system color scheme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const regions = [
    'Great Barrier Reef',
    'Caribbean Sea',
    'Mediterranean Sea',
    'North Sea',
    'Red Sea',
    'Gulf of Mexico',
    'Baltic Sea',
    'Coral Triangle'
  ];

  const TimeLapseContent = () => (
    <>
      <style jsx>{`
        /* Dark mode styles for Safari compatibility */
        @media (prefers-color-scheme: dark) {
          .page-container {
            background: #111827;
            color: white;
          }
          .control-select {
            background: #374151 !important;
            border-color: #4b5563 !important;
            color: #f9fafb !important;
          }
          .info-card {
            background: #1f2937 !important;
            border-color: #374151 !important;
            color: #f9fafb !important;
          }
          .info-card h3 {
            color: #f9fafb !important;
          }
          .info-card p {
            color: #d1d5db !important;
          }
          .info-card span {
            color: #d1d5db !important;
          }
          .page-title {
            color: #f9fafb !important;
          }
          .page-subtitle {
            color: #d1d5db !important;
          }
          .control-label {
            color: #f9fafb !important;
          }
        }

        @media (prefers-color-scheme: light) {
          .page-container {
            background: #ffffff;
            color: #111827;
          }
          .control-select {
            background: #ffffff !important;
            border-color: #d1d5db !important;
            color: #111827 !important;
          }
          .info-card {
            background: #ffffff !important;
            border-color: #e5e7eb !important;
            color: #111827 !important;
          }
          .info-card h3 {
            color: #111827 !important;
          }
          .info-card p {
            color: #6b7280 !important;
          }
          .info-card span {
            color: #6b7280 !important;
          }
          .page-title {
            color: #111827 !important;
          }
          .page-subtitle {
            color: #6b7280 !important;
          }
          .control-label {
            color: #111827 !important;
          }
        }

        /* Safari-specific fixes */
        .page-container {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>

      <div className="page-container">
        <div className="mb-8">
          <h1 className="page-title text-3xl font-bold mb-4">
            Ocean Temperature Time-lapse
          </h1>
          <p className="page-subtitle text-lg">
            Visualize ocean temperature changes over time to understand climate patterns and warming trends
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-3">
            <label className="control-label text-sm font-medium">
              Time Range:
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="control-select px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="year">Past Year</option>
              <option value="5years">Past 5 Years</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <label className="control-label text-sm font-medium">
              Focus Region:
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="control-select px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time-lapse Component */}
        <div className="mb-8">
          <TimeLapseVisualization
            isDarkMode={isDarkMode}
            selectedRegion={selectedRegion}
            timeRange={timeRange}
          />
        </div>

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="info-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-3">
              Understanding the Visualization
            </h3>
            <div className="space-y-3 text-sm">
            <p>
              <strong>Temperature Anomaly:</strong> Shows how current temperatures compare to the historical average for each region.
            </p>
            <p>
              <strong>Color Coding:</strong> Red indicates warmer than normal conditions, blue indicates cooler than normal, with intensity showing the magnitude of deviation.
            </p>
            <p>
              <strong>Global Average:</strong> The worldwide ocean surface temperature average for the current time frame.
            </p>
            <p>
              <strong>Regional Data:</strong> Specific temperature measurements from key marine ecosystems and monitoring stations.
            </p>
          </div>
        </div>

          <div className="info-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-3">
              Climate Impact Indicators
            </h3>
            <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span><strong>+2°C or more:</strong> Severe marine heatwave conditions, coral bleaching likely</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span><strong>+1°C to +2°C:</strong> Elevated temperatures, ecosystem stress possible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span><strong>Normal:</strong> Within expected temperature range</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span><strong>Below Normal:</strong> Cooler than average, may indicate climate pattern shifts</span>
            </div>
          </div>
        </div>
      </div>

        {/* Key Insights */}
        <div className="info-card mt-8 rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">
            Key Climate Trends
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">+0.8°C</div>
            <div className="text-sm font-medium">Ocean Warming</div>
            <div className="text-xs opacity-75">Since 1970s</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">3x</div>
            <div className="text-sm font-medium">Marine Heatwaves</div>
            <div className="text-xs opacity-75">Frequency increase</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">50%</div>
            <div className="text-sm font-medium">Coral Bleaching</div>
            <div className="text-xs opacity-75">Global reef impact</div>
          </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Layout title="Ocean Temperature Time-lapse - BlueSphere">
      <TimeLapseContent />
    </Layout>
  );
};

export default TimeLapsePage;