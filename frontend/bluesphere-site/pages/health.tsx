import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';
import OceanHealthScoring from '../components/OceanHealthScoring';

const HealthPage = () => {
  return (
    <WorldClassLayout title="Ocean Health Assessment - BlueSphere">
      <OceanHealthScoring isDarkMode={false} />
    </WorldClassLayout>
  );
};

export default HealthPage;