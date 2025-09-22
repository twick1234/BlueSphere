import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';
import PollutionDetection from '../components/PollutionDetection';

const PollutionPage = () => {
  return (
    <WorldClassLayout title="Ocean Pollution Detection - BlueSphere">
      <PollutionDetection isDarkMode={false} />
    </WorldClassLayout>
  );
};

export default PollutionPage;