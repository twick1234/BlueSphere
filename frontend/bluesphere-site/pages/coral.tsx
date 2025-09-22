import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';
import CoralReefMonitoring from '../components/CoralReefMonitoring';

const CoralPage = () => {
  return (
    <WorldClassLayout title="Coral Reef Monitoring - BlueSphere">
      <CoralReefMonitoring isDarkMode={false} />
    </WorldClassLayout>
  );
};

export default CoralPage;