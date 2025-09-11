import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import TimeLapseVisualization from '../components/TimeLapseVisualization';
import Layout from '../components/Layout';

const TimeLapsePage = () => {
  const { isDarkMode } = useTheme();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | '5years'>('month');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const containerClass = isDarkMode 
    ? 'bg-gray-900 min-h-screen' 
    : 'bg-gray-50 min-h-screen';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900';

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

  return (
    <Layout>
      <div className={containerClass}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-4 ${textClass}`}>
                Ocean Temperature Time-lapse
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Visualize ocean temperature changes over time to understand climate patterns and warming trends
              </p>
            </div>

            {/* Controls */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-3">
                <label className={`text-sm font-medium ${textClass}`}>
                  Time Range:
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                >
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                  <option value="5years">Past 5 Years</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className={`text-sm font-medium ${textClass}`}>
                  Focus Region:
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
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
              <div className={`rounded-lg border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${textClass}`}>
                  Understanding the Visualization
                </h3>
                <div className={`space-y-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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

              <div className={`rounded-lg border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${textClass}`}>
                  Climate Impact Indicators
                </h3>
                <div className={`space-y-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
            <div className={`mt-8 rounded-lg border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>
                Key Climate Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">+0.8°C</div>
                  <div className={`text-sm ${textClass} font-medium`}>Ocean Warming</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Since 1970s</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">3x</div>
                  <div className={`text-sm ${textClass} font-medium`}>Marine Heatwaves</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Frequency increase</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">50%</div>
                  <div className={`text-sm ${textClass} font-medium`}>Coral Bleaching</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Global reef impact</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TimeLapsePage;