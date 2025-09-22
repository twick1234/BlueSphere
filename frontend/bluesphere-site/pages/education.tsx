import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';
import EducationalResourceCenter from '../components/EducationalResourceCenter';

const EducationPage = () => {
  return (
    <WorldClassLayout title="Educational Resource Center - BlueSphere">
      <EducationalResourceCenter isDarkMode={false} />
    </WorldClassLayout>
  );
};

export default EducationPage;