/*
 * Marine Species AI Recognition Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';
import MarineBiodiversityAI from '../components/MarineBiodiversityAI';

const SpeciesAIPage = () => {
  return (
    <WorldClassLayout
      title="AI Species Recognition — Marine Life Identification | BlueSphere"
      description="Upload photos of marine life for instant AI-powered species identification. Contribute to global biodiversity databases and learn about ocean conservation through cutting-edge computer vision technology."
    >
      <style jsx>{`
        .page-container {
          padding: 2rem 1rem;
          min-height: calc(100vh - 64px);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .stats-section {
          max-width: 1200px;
          margin: 0 auto 4rem;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }

        .stat-card {
          text-align: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 12px;
          border: 1px solid #bae6fd;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0369a1;
          display: block;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
        }

        .features-section {
          max-width: 1200px;
          margin: 0 auto 4rem;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .feature-card {
          padding: 1.5rem;
          background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
          border-radius: 12px;
          border: 1px solid #fed7aa;
        }

        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
          display: block;
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .feature-description {
          color: #64748b;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 1rem 0.5rem;
          }

          .stats-section,
          .features-section {
            margin: 0 0.5rem 2rem;
            padding: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-container">
        {/* Statistics Section */}
        <section className="stats-section" aria-labelledby="stats-heading">
          <div className="text-center mb-6">
            <h2 id="stats-heading" className="text-2xl font-bold text-gray-900 mb-2">
              🌊 Global Marine Biodiversity Database
            </h2>
            <p className="text-gray-600">
              Powered by artificial intelligence and community contributions
            </p>
          </div>

          <div className="stats-grid" role="list" aria-label="Marine biodiversity statistics">
            <div className="stat-card" role="listitem">
              <span className="stat-number" aria-label="2,847 species">2,847</span>
              <span className="stat-label">Species in Database</span>
            </div>
            <div className="stat-card" role="listitem">
              <span className="stat-number" aria-label="95.2 percent accuracy">95.2%</span>
              <span className="stat-label">AI Accuracy Rate</span>
            </div>
            <div className="stat-card" role="listitem">
              <span className="stat-number" aria-label="156 thousand plus photos">156K+</span>
              <span className="stat-label">Photos Analyzed</span>
            </div>
            <div className="stat-card" role="listitem">
              <span className="stat-number" aria-label="89 countries">89</span>
              <span className="stat-label">Countries Covered</span>
            </div>
          </div>
        </section>

        {/* Main AI Component */}
        <MarineBiodiversityAI />

        {/* Features Section */}
        <section className="features-section" aria-labelledby="features-heading">
          <div className="text-center mb-6">
            <h2 id="features-heading" className="text-2xl font-bold text-gray-900 mb-2">
              🤖 Advanced AI Capabilities
            </h2>
            <p className="text-gray-600">
              State-of-the-art computer vision technology for marine life identification
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🧠</span>
              <h3 className="feature-title">Deep Learning Recognition</h3>
              <p className="feature-description">
                Advanced neural networks trained on millions of marine life images
                for accurate species identification across diverse ocean environments.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3 className="feature-title">Conservation Status Integration</h3>
              <p className="feature-description">
                Real-time conservation status updates from IUCN Red List and local
                conservation databases to track species protection needs.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">🌐</span>
              <h3 className="feature-title">Global Database Contribution</h3>
              <p className="feature-description">
                Every identification contributes to our global marine biodiversity
                database, supporting research and conservation efforts worldwide.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">📱</span>
              <h3 className="feature-title">Mobile-First Design</h3>
              <p className="feature-description">
                Optimized for field use with offline capabilities, GPS integration,
                and camera access for underwater photography.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">🔬</span>
              <h3 className="feature-title">Expert Verification</h3>
              <p className="feature-description">
                Marine biologists review uncertain identifications to continuously
                improve accuracy and validate new species discoveries.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">📈</span>
              <h3 className="feature-title">Population Tracking</h3>
              <p className="feature-description">
                Aggregate sighting data to monitor species population trends,
                migration patterns, and habitat distribution changes over time.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12" aria-labelledby="cta-heading">
          <div className="max-w-2xl mx-auto">
            <h2 id="cta-heading" className="text-3xl font-bold text-gray-900 mb-4">
              🌊 Ready to Contribute to Marine Science?
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              Upload your marine life photos and help scientists monitor ocean
              biodiversity. Every identification makes a difference in understanding
              and protecting our marine ecosystems.
            </p>
            <div className="flex gap-4 justify-center flex-wrap" role="group" aria-label="Call to action buttons">
              <a
                href="#top"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                aria-label="Go to top of page to start identifying species"
              >
                🚀 Start Identifying Species
              </a>
              <a
                href="/conservation"
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                aria-label="Navigate to conservation information page"
              >
                🌱 Learn About Conservation
              </a>
            </div>
          </div>
        </section>
      </div>
    </WorldClassLayout>
  );
};

export default SpeciesAIPage;