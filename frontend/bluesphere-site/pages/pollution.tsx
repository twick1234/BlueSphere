import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import PollutionDetection from '../components/PollutionDetection';

const PollutionPage = () => {
  const { isDarkMode } = useTheme();
  
  const containerClass = isDarkMode 
    ? 'bg-gray-900 min-h-screen' 
    : 'bg-gray-50 min-h-screen';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className={containerClass}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-4 ${textClass}`}>
              Ocean Pollution Detection & Monitoring
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Real-time detection and analysis of marine pollution incidents with automated alert systems
            </p>
          </div>

          <PollutionDetection isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default PollutionPage;