import Layout from '../components/Layout';
import OceanHealthScoring from '../components/OceanHealthScoring';

const HealthPage = () => {
  return (
    <Layout title="Ocean Health Assessment - BlueSphere">
      <OceanHealthScoring isDarkMode={false} />
    </Layout>
  );
};

export default HealthPage;