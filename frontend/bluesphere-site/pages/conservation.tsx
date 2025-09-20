/*
 * BlueSphere Conservation Action Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import Layout from '../components/Layout';
import ConservationActionCenter from '../components/ConservationActionCenter';

const ConservationPage = () => {
  return (
    <>
      <style jsx>{`
        /* Safari-specific fixes */
        .hero-section {
          background: linear-gradient(135deg,
            #10b981 0%,
            #059669 25%,
            #047857 50%,
            #064e3b 100%
          );
          color: white;
          padding: 4rem 0;
          margin: -24px -16px 0;
          position: relative;
          overflow: hidden;
          /* Safari fix for gradient background */
          -webkit-background-size: 100% 100%;
          background-attachment: scroll;
        }

        .hero-bg-effects {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(34, 197, 94, 0.2) 0%, transparent 50%);
          /* Safari fixes */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 2rem;
          /* Safari text rendering fix */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 50%, #b3e5fc 100%);
          /* Safari-specific text gradient fixes */
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          /* Fallback for older Safari versions */
          color: white;
          letter-spacing: -0.02em;
          /* Force hardware acceleration */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        /* Safari fallback - if gradient text isn't supported */
        @supports not (-webkit-background-clip: text) {
          .hero-title {
            color: white !important;
          }
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.95);
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
          /* Safari text rendering */
          -webkit-font-smoothing: antialiased;
        }

        .stats-banner {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          /* Safari fallback for backdrop-filter */
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.25);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem auto 0;
          max-width: 800px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          /* Force hardware acceleration */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 2rem;
          /* Safari grid fixes */
          -webkit-grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .stat-item {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          /* Safari compatibility */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          display: block;
          margin-bottom: 0.25rem;
          /* Safari number rendering */
          font-variant-numeric: tabular-nums;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
        }

        .cta-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.3);
          /* Safari button fixes */
          -webkit-appearance: none;
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          /* Force hardware acceleration */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        .cta-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          text-decoration: none;
          color: white;
          /* Safari hover fix */
          -webkit-transform: translateY(-2px) translateZ(0);
        }

        .conservation-section {
          margin: 0 -16px;
          /* Safari margin fix */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        .impact-section {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 4rem 0;
          margin: 0 -16px;
          /* Safari gradient fix */
          -webkit-background-size: 100% 100%;
          background-attachment: scroll;
        }

        .impact-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          text-align: center;
        }

        .impact-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
          /* Safari text rendering */
          -webkit-font-smoothing: antialiased;
        }

        .impact-subtitle {
          font-size: 1.25rem;
          color: #64748b;
          margin-bottom: 3rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .impact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          /* Safari grid compatibility */
          -webkit-grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .impact-card {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          /* Safari compatibility */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        .impact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          /* Safari hover fix */
          -webkit-transform: translateY(-5px) translateZ(0);
        }

        .impact-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .impact-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
        }

        .impact-card-desc {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .impact-stat {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.9rem;
          display: inline-block;
          /* Safari inline-block fix */
          vertical-align: top;
        }

        /* Mobile responsiveness for Safari */
        @media (max-width: 768px) {
          .hero-content {
            padding: 0 1rem;
          }

          .stats-banner {
            margin: 2rem 1rem 0;
            padding: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }

          .cta-btn {
            width: 100%;
            max-width: 300px;
          }

          .impact-content {
            padding: 0 1rem;
          }

          .impact-grid {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .impact-title {
            font-size: 2rem;
          }
        }

        /* Safari-specific media queries */
        @media not all and (min-resolution:.001dpcm) {
          @supports (-webkit-appearance:none) {
            .hero-title {
              /* Additional Safari fallbacks */
              color: white !important;
              -webkit-text-fill-color: initial;
            }
          }
        }
      `}</style>

      <Layout title="Conservation Action Center - BlueSphere">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-effects"></div>
          <div className="hero-content">
            <h1 className="hero-title">🌍 Take Action for Our Oceans</h1>
            <p className="hero-subtitle">
              Join the global movement to protect marine ecosystems through direct action,
              scientific research, and community engagement. Every contribution matters
              in the fight against climate change and ocean degradation.
            </p>

            <div className="stats-banner">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">10,000+</span>
                  <span className="stat-label">Active Volunteers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Active Projects</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">25</span>
                  <span className="stat-label">Countries</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">500km²</span>
                  <span className="stat-label">Protected</span>
                </div>
              </div>
            </div>

            <div className="cta-buttons">
              <a href="#actions" className="cta-btn">🚀 View Actions</a>
              <a href="/gallery" className="cta-btn">📸 See Impact</a>
              <a href="/map" className="cta-btn">🗺️ Live Data</a>
            </div>
          </div>
        </section>

        {/* Conservation Actions */}
        <section className="conservation-section" id="actions">
          <ConservationActionCenter showFilters={true} maxActions={12} />
        </section>

        {/* Impact Section */}
        <section className="impact-section">
          <div className="impact-content">
            <h2 className="impact-title">🎯 Our Collective Impact</h2>
            <p className="impact-subtitle">
              Together, we're making measurable differences in ocean health and marine conservation.
              See the real-world impact of community-driven environmental action.
            </p>

            <div className="impact-grid">
              <div className="impact-card">
                <div className="impact-icon">🌊</div>
                <h3 className="impact-card-title">Ocean Cleanup</h3>
                <p className="impact-card-desc">
                  Volunteers have removed plastic waste and debris from critical marine habitats worldwide.
                </p>
                <div className="impact-stat">2.5M kg Removed</div>
              </div>

              <div className="impact-card">
                <div className="impact-icon">🪸</div>
                <h3 className="impact-card-title">Coral Restoration</h3>
                <p className="impact-card-desc">
                  Supporting coral restoration projects in bleached and damaged reef systems.
                </p>
                <div className="impact-stat">150 Hectares Restored</div>
              </div>

              <div className="impact-card">
                <div className="impact-icon">🐠</div>
                <h3 className="impact-card-title">Marine Protected Areas</h3>
                <p className="impact-card-desc">
                  Advocacy efforts have contributed to establishing new marine sanctuaries.
                </p>
                <div className="impact-stat">12 New MPAs</div>
              </div>

              <div className="impact-card">
                <div className="impact-icon">📚</div>
                <h3 className="impact-card-title">Education Outreach</h3>
                <p className="impact-card-desc">
                  Educational programs have reached students and communities globally.
                </p>
                <div className="impact-stat">100K+ Students</div>
              </div>

              <div className="impact-card">
                <div className="impact-icon">🔬</div>
                <h3 className="impact-card-title">Research Support</h3>
                <p className="impact-card-desc">
                  Citizen science programs contributing valuable data to marine research.
                </p>
                <div className="impact-stat">50K+ Data Points</div>
              </div>

              <div className="impact-card">
                <div className="impact-icon">💡</div>
                <h3 className="impact-card-title">Policy Change</h3>
                <p className="impact-card-desc">
                  Successful campaigns influencing marine protection legislation.
                </p>
                <div className="impact-stat">8 Bills Passed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          color: 'white',
          padding: '4rem 0',
          margin: '0 -16px',
          textAlign: 'center',
          WebkitBackgroundSize: '100% 100%',
          backgroundAttachment: 'scroll'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 2rem',
            WebkitFontSmoothing: 'antialiased'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)'
            }}>
              🌊 Ready to Make a Difference?
            </h2>
            <p style={{
              fontSize: '1.25rem',
              marginBottom: '2rem',
              opacity: '0.95',
              lineHeight: '1.6'
            }}>
              Join thousands of ocean advocates taking action to protect marine ecosystems.
              Every action, no matter how small, contributes to our collective impact.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a
                href="#actions"
                className="cta-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              >
                🚀 Start Taking Action
              </a>
              <a
                href="/about"
                className="cta-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              >
                🤝 Learn About Our Mission
              </a>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default ConservationPage;