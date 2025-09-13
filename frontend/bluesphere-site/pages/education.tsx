import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import EducationalResourceCenter from '../components/EducationalResourceCenter';

const EducationPage = () => {
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
              Educational Resource Center
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Comprehensive learning platform for ocean science, conservation, and marine research
            </p>
          </div>

          <EducationalResourceCenter isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default EducationPage;