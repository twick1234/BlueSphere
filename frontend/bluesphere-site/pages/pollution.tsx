import Layout from '../components/Layout';
import PollutionDetection from '../components/PollutionDetection';

const PollutionPage = () => {
  return (
    <Layout title="Ocean Pollution Detection - BlueSphere">
      <PollutionDetection isDarkMode={false} />
    </Layout>
  );
};

export default PollutionPage;