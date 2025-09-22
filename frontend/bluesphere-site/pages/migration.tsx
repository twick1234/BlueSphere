import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';
import MarineLifeTracker from '../components/MarineLifeTracker';

const MigrationPage = () => {
  return (
    <WorldClassLayout title="Marine Life Migration - BlueSphere">
      <MarineLifeTracker isDarkMode={false} />
    </WorldClassLayout>
  );
};

export default MigrationPage;