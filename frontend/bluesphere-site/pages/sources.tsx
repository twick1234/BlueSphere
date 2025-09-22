/*
 * BlueSphere Data Sources Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';

interface DataSource {
  id: string;
  name: string;
  organization: string;
  type: 'satellite' | 'buoy' | 'argo' | 'research' | 'model';
  description: string;
  parameters: string[];
  coverage: string;
  updateFrequency: string;
  status: 'active' | 'maintenance' | 'offline';
  website: string;
  apiStatus: 'available' | 'limited' | 'unavailable';
  dataQuality: number; // 0-100 score
}

const SourcesPage = () => {
  const dataSources: DataSource[] = [
    {
      id: 'noaa-ndbc',
      name: 'National Data Buoy Center',
      organization: 'NOAA',
      type: 'buoy',
      description: 'Real-time ocean and weather observations from moored buoys, coastal stations, and ships',
      parameters: ['Sea Surface Temperature', 'Wave Height', 'Wind Speed', 'Air Temperature', 'Barometric Pressure'],
      coverage: 'Global Ocean Basins',
      updateFrequency: 'Hourly',
      status: 'active',
      website: 'https://www.ndbc.noaa.gov',
      apiStatus: 'available',
      dataQuality: 96
    },
    {
      id: 'nasa-modis',
      name: 'MODIS Aqua/Terra',
      organization: 'NASA',
      type: 'satellite',
      description: 'Moderate Resolution Imaging Spectroradiometer providing global sea surface temperature',
      parameters: ['Sea Surface Temperature', 'Chlorophyll-a', 'Ocean Color', 'Cloud Coverage'],
      coverage: 'Global',
      updateFrequency: 'Daily',
      status: 'active',
      website: 'https://modis.gsfc.nasa.gov',
      apiStatus: 'available',
      dataQuality: 94
    },
    {
      id: 'argo-global',
      name: 'Argo Global Ocean Observing System',
      organization: 'International Argo Program',
      type: 'argo',
      description: 'Global array of profiling floats measuring temperature and salinity',
      parameters: ['Temperature Profile', 'Salinity Profile', 'Pressure', 'Ocean Currents'],
      coverage: 'Global Ocean (0-2000m depth)',
      updateFrequency: '10 days per float',
      status: 'active',
      website: 'https://argo.ucsd.edu',
      apiStatus: 'available',
      dataQuality: 98
    },
    {
      id: 'noaa-ersst',
      name: 'Extended Reconstructed SST',
      organization: 'NOAA',
      type: 'model',
      description: 'Extended reconstructed sea surface temperature dataset with historical context',
      parameters: ['Sea Surface Temperature', 'Temperature Anomalies', 'Long-term Trends'],
      coverage: 'Global Ocean',
      updateFrequency: 'Monthly',
      status: 'active',
      website: 'https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation',
      apiStatus: 'available',
      dataQuality: 92
    },
    {
      id: 'copernicus-marine',
      name: 'Copernicus Marine Environment',
      organization: 'European Union',
      type: 'satellite',
      description: 'European satellite-based ocean monitoring and forecasting',
      parameters: ['Sea Level', 'Sea Surface Temperature', 'Ocean Currents', 'Sea Ice'],
      coverage: 'Global Ocean',
      updateFrequency: 'Daily',
      status: 'active',
      website: 'https://marine.copernicus.eu',
      apiStatus: 'limited',
      dataQuality: 91
    },
    {
      id: 'ocearch',
      name: 'OCEARCH Shark Tracker',
      organization: 'OCEARCH',
      type: 'research',
      description: 'Real-time tracking of marine life including great white sharks and other species',
      parameters: ['GPS Location', 'Dive Depth', 'Water Temperature', 'Species Behavior'],
      coverage: 'Atlantic, Pacific, and Indian Oceans',
      updateFrequency: 'Real-time (when surfaced)',
      status: 'active',
      website: 'https://www.ocearch.org',
      apiStatus: 'available',
      dataQuality: 89
    },
    {
      id: 'noaa-coral-reef',
      name: 'Coral Reef Watch',
      organization: 'NOAA',
      type: 'satellite',
      description: 'Satellite-based monitoring for coral reef health and bleaching events',
      parameters: ['Degree Heating Weeks', 'Sea Surface Temperature', 'Bleaching Risk', 'Thermal Stress'],
      coverage: 'Global Coral Reef Regions',
      updateFrequency: 'Daily',
      status: 'active',
      website: 'https://coralreefwatch.noaa.gov',
      apiStatus: 'available',
      dataQuality: 93
    },
    {
      id: 'ioc-gloss',
      name: 'Global Sea Level Observing System',
      organization: 'IOC-UNESCO',
      type: 'buoy',
      description: 'Global network of sea level monitoring stations',
      parameters: ['Sea Level', 'Tidal Data', 'Tsunami Detection', 'Storm Surge'],
      coverage: 'Global Coastal Regions',
      updateFrequency: 'Continuous',
      status: 'active',
      website: 'https://www.gloss-sealevel.org',
      apiStatus: 'limited',
      dataQuality: 95
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-500';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100 border-yellow-500';
      case 'offline': return 'text-red-600 bg-red-100 border-red-500';
      default: return 'text-gray-600 bg-gray-100 border-gray-500';
    }
  };

  const getApiStatusColor = (apiStatus: string) => {
    switch (apiStatus) {
      case 'available': return 'text-green-600';
      case 'limited': return 'text-yellow-600';
      case 'unavailable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'satellite': return '🛰️';
      case 'buoy': return '⚓';
      case 'argo': return '🌊';
      case 'research': return '🔬';
      case 'model': return '📊';
      default: return '📡';
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 95) return 'text-green-600';
    if (quality >= 90) return 'text-blue-600';
    if (quality >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <style jsx>{`
        .hero-section {
          background: linear-gradient(135deg,
            #0ea5e9 0%,
            #3b82f6 25%,
            #1e40af 50%,
            #0f172a 100%
          );
          color: white;
          padding: 4rem 0;
          margin: -24px -16px 0;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-effects {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 30% 80%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ffffff, #e0f2fe, #b3e5fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .stats-bar {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 2rem;
        }

        .stat-item {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          display: block;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .content-section {
          padding: 4rem 0;
          margin: 0 -16px;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
          text-align: center;
        }

        .section-subtitle {
          font-size: 1.25rem;
          color: #64748b;
          text-align: center;
          margin-bottom: 3rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .source-card {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .source-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .source-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .source-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .source-info h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .source-org {
          color: #3b82f6;
          font-weight: 600;
          font-size: 1rem;
        }

        .source-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid;
        }

        .quality-score {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .source-description {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .source-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-item {
          background: rgba(59, 130, 246, 0.05);
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .detail-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 0.9rem;
          color: #475569;
        }

        .parameters-list {
          margin-bottom: 1rem;
        }

        .parameters-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 0.5rem;
        }

        .parameters-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .parameter-tag {
          background: rgba(34, 197, 94, 0.1);
          color: #059669;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .source-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .api-status {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .source-link {
          background: #3b82f6;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .source-link:hover {
          background: #2563eb;
          transform: translateY(-1px);
          text-decoration: none;
          color: white;
        }

        .summary-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 4rem 0;
          margin: 0 -16px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .summary-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
          border: 1px solid #bae6fd;
        }

        .summary-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .summary-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .summary-desc {
          color: #64748b;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .sources-grid {
            grid-template-columns: 1fr;
          }

          .source-details {
            grid-template-columns: 1fr;
          }

          .stats-bar {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .stat-item {
            width: 100%;
            max-width: 200px;
          }

          .hero-content, .content-wrapper {
            padding: 0 1rem;
          }
        }
      `}</style>

      <WorldClassLayout title="Data Sources - BlueSphere">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-effects"></div>
          <div className="hero-content">
            <h1 className="hero-title">📡 Data Sources</h1>
            <p className="hero-subtitle">
              BlueSphere integrates high-quality ocean and climate data from leading scientific organizations
              worldwide, providing comprehensive real-time monitoring and historical analysis.
            </p>
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-number">{dataSources.length}</span>
                <span className="stat-label">Active Sources</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Real-time Updates</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">Global</span>
                <span className="stat-label">Coverage</span>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources Grid */}
        <section className="content-section">
          <div className="content-wrapper">
            <h2 className="section-title">🌐 Integrated Data Sources</h2>
            <p className="section-subtitle">
              Each data source undergoes rigorous quality control and validation to ensure
              scientific accuracy and reliability for research and monitoring applications.
            </p>

            <div className="sources-grid">
              {dataSources.map((source) => (
                <div key={source.id} className="source-card">
                  <div className="source-header">
                    <div className="source-icon">{getTypeIcon(source.type)}</div>
                    <div className="source-info">
                      <h3>{source.name}</h3>
                      <div className="source-org">{source.organization}</div>
                    </div>
                  </div>

                  <div className="source-status">
                    <span className={`status-badge ${getStatusColor(source.status)}`}>
                      {source.status.toUpperCase()}
                    </span>
                    <div className={`quality-score ${getQualityColor(source.dataQuality)}`}>
                      ⭐ {source.dataQuality}% Quality
                    </div>
                  </div>

                  <p className="source-description">{source.description}</p>

                  <div className="source-details">
                    <div className="detail-item">
                      <div className="detail-label">Coverage</div>
                      <div className="detail-value">{source.coverage}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Update Frequency</div>
                      <div className="detail-value">{source.updateFrequency}</div>
                    </div>
                  </div>

                  <div className="parameters-list">
                    <div className="parameters-title">📊 Measured Parameters</div>
                    <div className="parameters-tags">
                      {source.parameters.map((param, index) => (
                        <span key={index} className="parameter-tag">{param}</span>
                      ))}
                    </div>
                  </div>

                  <div className="source-footer">
                    <div className={`api-status ${getApiStatusColor(source.apiStatus)}`}>
                      API: {source.apiStatus.toUpperCase()}
                    </div>
                    <a
                      href={source.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      Visit Source →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Summary Section */}
        <section className="summary-section">
          <div className="content-wrapper">
            <h2 className="section-title">🔬 Data Integration Standards</h2>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">🎯</div>
                <h3 className="summary-title">Quality Control</h3>
                <p className="summary-desc">
                  Automated validation, outlier detection, and cross-source verification
                  ensure data integrity and scientific accuracy.
                </p>
              </div>

              <div className="summary-card">
                <div className="summary-icon">⚡</div>
                <h3 className="summary-title">Real-time Processing</h3>
                <p className="summary-desc">
                  Advanced data pipelines process ocean observations within minutes
                  of collection for immediate availability.
                </p>
              </div>

              <div className="summary-card">
                <div className="summary-icon">🌍</div>
                <h3 className="summary-title">Global Coverage</h3>
                <p className="summary-desc">
                  Comprehensive monitoring across all ocean basins with
                  coordinated international observation networks.
                </p>
              </div>

              <div className="summary-card">
                <div className="summary-icon">📈</div>
                <h3 className="summary-title">Historical Context</h3>
                <p className="summary-desc">
                  Long-term datasets provide crucial baseline data for
                  climate change analysis and trend identification.
                </p>
              </div>

              <div className="summary-card">
                <div className="summary-icon">🔒</div>
                <h3 className="summary-title">Open Access</h3>
                <p className="summary-desc">
                  All integrated data maintains open access principles
                  supporting scientific research and education.
                </p>
              </div>

              <div className="summary-card">
                <div className="summary-icon">🚀</div>
                <h3 className="summary-title">API Integration</h3>
                <p className="summary-desc">
                  Standardized APIs enable seamless integration with
                  research tools and third-party applications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="content-section">
          <div className="content-wrapper">
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '24px',
              padding: '3rem',
              textAlign: 'center',
              color: 'white'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
                🚀 Explore Our Data
              </h2>
              <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: '0.9' }}>
                Start exploring real-time ocean data and discover insights from our integrated monitoring network.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/map" className="cta-btn">🗺️ Interactive Map</a>
                <a href="/analytics" className="cta-btn">📊 Data Analytics</a>
                <a href="/alerts" className="cta-btn">🚨 Real-time Alerts</a>
                <a href="/docs" className="cta-btn">📚 Documentation</a>
              </div>
            </div>
          </div>
        </section>
      </WorldClassLayout>
    </>
  );
};

export default SourcesPage;