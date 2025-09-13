import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import MarineLifeTracker from '../components/MarineLifeTracker';

const MigrationPage = () => {
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
              Marine Life Migration Patterns
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Track global migration routes of marine species with real-time positioning and behavioral analysis
            </p>
          </div>

          <MarineLifeTracker isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default MigrationPage;