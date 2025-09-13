import Layout from '../components/Layout';
import CoralReefMonitoring from '../components/CoralReefMonitoring';

const CoralPage = () => {
  return (
    <Layout title="Coral Reef Monitoring - BlueSphere">
      <CoralReefMonitoring isDarkMode={false} />
    </Layout>
  );
};

export default CoralPage;