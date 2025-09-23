/*
 * Advanced Marine Mapping Page
 * Google Maps-style interface for marine data visualization
 */

import React from 'react';
import dynamic from 'next/dynamic';
import WorldClassLayout from '../components/WorldClassLayout';

// Dynamic import to prevent SSR issues with Leaflet
const LayeredMapInterface = dynamic(
  () => import('../components/advanced-mapping').then(mod => ({ default: mod.LayeredMapInterface })),
  {
    ssr: false,
    loading: () => <div style={{height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading Map...</div>
  }
);

const MappingPage = () => {
  return (
    <WorldClassLayout
      title="Advanced Marine Mapping — Interactive Ocean Data Visualization | BlueSphere"
      description="Explore interactive marine data layers including shark tracking, protected areas, research stations, and ocean conditions. Google Maps-style interface for comprehensive ocean monitoring."
      keywords="marine mapping, ocean data, shark tracking, interactive maps, marine protected areas, research stations"
    >
      <style jsx>{`
        .mapping-page {
          min-height: calc(100vh - 64px);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .hero-section {
          background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
          color: white;
          padding: 4rem 2rem;
          text-align: center;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .hero-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          max-width: 800px;
          margin: 0 auto 2rem;
          line-height: 1.6;
        }

        .feature-highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .feature-highlight {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          display: block;
        }

        .feature-name {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .feature-description {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .mapping-section {
          padding: 4rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1rem;
        }

        .section-description {
          font-size: 1.1rem;
          color: #64748b;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .controls-section {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .control-group {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .control-title {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-description {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .data-stats {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          border: 1px solid #fbbf24;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: #92400e;
          display: block;
        }

        .stat-label {
          color: #78350f;
          font-size: 0.9rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .mapping-section {
            padding: 2rem 1rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .feature-highlights {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .controls-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="mapping-page">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            🗺️ Advanced Marine Mapping
          </h1>
          <p className="hero-subtitle">
            Explore comprehensive ocean data through interactive, layered mapping technology.
            Toggle between shark tracking, protected areas, research stations, and environmental conditions
            with Google Maps-style controls.
          </p>

          <div className="feature-highlights">
            <div className="feature-highlight">
              <span className="feature-icon">🦈</span>
              <div className="feature-name">Live Shark Tracking</div>
              <div className="feature-description">500+ tagged sharks worldwide</div>
            </div>
            <div className="feature-highlight">
              <span className="feature-icon">🛡️</span>
              <div className="feature-name">Protected Areas</div>
              <div className="feature-description">Marine conservation zones</div>
            </div>
            <div className="feature-highlight">
              <span className="feature-icon">🔬</span>
              <div className="feature-name">Research Stations</div>
              <div className="feature-description">Global monitoring network</div>
            </div>
            <div className="feature-highlight">
              <span className="feature-icon">🌡️</span>
              <div className="feature-name">Ocean Temperature</div>
              <div className="feature-description">Real-time thermal data</div>
            </div>
            <div className="feature-highlight">
              <span className="feature-icon">🚢</span>
              <div className="feature-name">Shipping Routes</div>
              <div className="feature-description">Maritime traffic patterns</div>
            </div>
            <div className="feature-highlight">
              <span className="feature-icon">☠️</span>
              <div className="feature-name">Pollution Zones</div>
              <div className="feature-description">Environmental impact areas</div>
            </div>
          </div>
        </section>

        {/* Main Mapping Section */}
        <section className="mapping-section">
          <div className="section-header">
            <h2 className="section-title">Interactive Ocean Map</h2>
            <p className="section-description">
              Toggle data layers on and off to customize your view. Adjust opacity levels for optimal
              data visualization. Click on markers for detailed information about marine life,
              research activities, and environmental conditions.
            </p>
          </div>

          {/* Data Statistics */}
          <div className="data-stats">
            <div className="stats-grid">
              <div>
                <span className="stat-number">500+</span>
                <span className="stat-label">Tracked Sharks</span>
              </div>
              <div>
                <span className="stat-number">50+</span>
                <span className="stat-label">Protected Areas</span>
              </div>
              <div>
                <span className="stat-number">25+</span>
                <span className="stat-label">Research Stations</span>
              </div>
              <div>
                <span className="stat-number">1000+</span>
                <span className="stat-label">Data Points</span>
              </div>
              <div>
                <span className="stat-number">24/7</span>
                <span className="stat-label">Live Monitoring</span>
              </div>
              <div>
                <span className="stat-number">Global</span>
                <span className="stat-label">Ocean Coverage</span>
              </div>
            </div>
          </div>

          {/* Control Instructions */}
          <div className="controls-section">
            <div className="controls-grid">
              <div className="control-group">
                <div className="control-title">
                  🎛️ Layer Controls
                </div>
                <div className="control-description">
                  Use the layer panel (top-right) to toggle different data sets on and off.
                  Adjust opacity sliders to blend multiple layers for comprehensive analysis.
                </div>
              </div>

              <div className="control-group">
                <div className="control-title">
                  🔍 Interactive Features
                </div>
                <div className="control-description">
                  Click on any marker or area to view detailed information. Zoom and pan
                  to explore different ocean regions and discover marine life patterns.
                </div>
              </div>

              <div className="control-group">
                <div className="control-title">
                  📊 Data Analysis
                </div>
                <div className="control-description">
                  Compare multiple data layers to identify correlations between shark movements,
                  temperature changes, and conservation areas.
                </div>
              </div>

              <div className="control-group">
                <div className="control-title">
                  📱 Mobile Optimized
                </div>
                <div className="control-description">
                  Touch-friendly controls and responsive design ensure optimal viewing
                  on smartphones and tablets for field research.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map */}
          <LayeredMapInterface />
        </section>

        {/* Additional Information */}
        <section className="mapping-section" style={{ paddingTop: '2rem' }}>
          <div className="section-header">
            <h2 className="section-title">🌊 Understanding Ocean Data</h2>
            <p className="section-description">
              Our interactive mapping platform integrates real-time data from satellite imagery,
              research vessels, tagged marine animals, and monitoring stations worldwide.
              This comprehensive approach provides unprecedented insights into ocean health
              and marine ecosystem dynamics.
            </p>
          </div>

          <div className="controls-section">
            <div className="controls-grid">
              <div className="control-group">
                <div className="control-title">
                  🛰️ Satellite Integration
                </div>
                <div className="control-description">
                  Real-time data from NOAA, NASA, and ESA satellites providing temperature,
                  chlorophyll levels, and weather patterns across global ocean systems.
                </div>
              </div>

              <div className="control-group">
                <div className="control-title">
                  🔬 Scientific Collaboration
                </div>
                <div className="control-description">
                  Data contributed by marine research institutions, universities, and
                  conservation organizations from around the world.
                </div>
              </div>

              <div className="control-group">
                <div className="control-title">
                  🤝 Citizen Science
                </div>
                <div className="control-description">
                  Community-contributed sightings and environmental observations
                  verified by marine biology experts and research teams.
                </div>
              </div>

              <div className="control-group">
                <div className="control-title">
                  📈 Predictive Analytics
                </div>
                <div className="control-description">
                  Machine learning algorithms analyze patterns to predict migration routes,
                  breeding areas, and environmental changes affecting marine life.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </WorldClassLayout>
  );
};

export default MappingPage;