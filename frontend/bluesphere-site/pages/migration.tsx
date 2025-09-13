import Layout from '../components/Layout';
import MarineLifeTracker from '../components/MarineLifeTracker';

const MigrationPage = () => {
  return (
    <Layout title="Marine Life Migration - BlueSphere">
      <MarineLifeTracker isDarkMode={false} />
    </Layout>
  );
};

export default MigrationPage;