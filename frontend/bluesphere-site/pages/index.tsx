/*
 * BlueSphere Homepage - World-Class Design
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import Link from 'next/link';
import WorldClassLayout from '../components/WorldClassLayout';
import {
  MapIcon,
  BeakerIcon,
  ChartBarIcon,
  HeartIcon,
  GlobeAltIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  return (
    <WorldClassLayout
      title="BlueSphere — Global Ocean Monitoring Platform"
      description="Real-time ocean temperature monitoring, shark tracking, and climate data from 15,000+ sensors worldwide. Open-source marine conservation platform for researchers and educators."
      keywords="ocean monitoring, marine data, sea temperature, ocean currents, oceanography, marine biology, climate data, ocean sensors, marine ecosystem"
    >
      <style jsx>{`
        /* Hero Section */
        .hero {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          padding: 120px 0 100px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.6;
        }

        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        .hero-title {
          font-size: 72px;
          font-weight: 800;
          line-height: 1.1;
          color: #1a202c;
          margin: 0 0 24px 0;
          letter-spacing: -0.025em;
        }

        .hero-subtitle {
          font-size: 24px;
          color: #64748b;
          margin: 0 0 48px 0;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.4;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 80px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #374151;
          padding: 16px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        /* Stats Section */
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 800;
          color: #1a202c;
          display: block;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 16px;
          color: #64748b;
          font-weight: 500;
        }

        /* Features Section */
        .features {
          padding: 120px 0;
          background: white;
        }

        .features-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-title {
          font-size: 48px;
          font-weight: 800;
          color: #1a202c;
          margin: 0 0 16px 0;
          letter-spacing: -0.025em;
        }

        .section-subtitle {
          font-size: 20px;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .feature {
          text-align: center;
          padding: 40px 32px;
          border-radius: 16px;
          background: #f8fafc;
          transition: all 0.3s ease;
        }

        .feature:hover {
          background: white;
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          padding: 16px;
          border-radius: 16px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .feature-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 12px 0;
        }

        .feature-description {
          color: #64748b;
          line-height: 1.6;
        }

        /* Call to Action Section */
        .cta-section {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          padding: 120px 0;
          text-align: center;
          color: white;
        }

        .cta-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .cta-title {
          font-size: 48px;
          font-weight: 800;
          margin: 0 0 24px 0;
          letter-spacing: -0.025em;
        }

        .cta-subtitle {
          font-size: 20px;
          color: #cbd5e1;
          margin: 0 0 48px 0;
          line-height: 1.6;
        }

        .btn-cta {
          background: white;
          color: #1e293b;
          padding: 16px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 48px;
          }

          .hero-subtitle {
            font-size: 18px;
          }

          .hero-cta {
            flex-direction: column;
            align-items: stretch;
            max-width: 300px;
            margin: 0 auto 80px;
          }

          .section-title {
            font-size: 36px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }

          .stat-number {
            font-size: 36px;
          }

          .cta-title {
            font-size: 36px;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Monitor Our Oceans.
            <br />
            Protect Marine Life.
          </h1>
          <p className="hero-subtitle">
            Real-time ocean monitoring and marine conservation platform powered by AI
            and data from 15,000+ sensors worldwide. Join the mission to protect our blue planet.
          </p>

          <div className="hero-cta">
            <Link href="/map" className="btn-primary">
              <MapIcon className="w-5 h-5" />
              Explore Ocean Map
            </Link>
            <Link href="/species-ai" className="btn-secondary">
              <PlayIcon className="w-5 h-5" />
              Watch Demo
            </Link>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-number">15K+</span>
              <span className="stat-label">Ocean Sensors</span>
            </div>
            <div className="stat">
              <span className="stat-number">2.4M</span>
              <span className="stat-label">Data Points</span>
            </div>
            <div className="stat">
              <span className="stat-number">40K+</span>
              <span className="stat-label">Tracked Animals</span>
            </div>
            <div className="stat">
              <span className="stat-number">85</span>
              <span className="stat-label">Countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-content">
          <div className="section-header">
            <h2 className="section-title">Platform Capabilities</h2>
            <p className="section-subtitle">
              Comprehensive tools for marine research, conservation, and education
              powered by cutting-edge technology and global collaboration.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <MapIcon className="w-full h-full" />
              </div>
              <h3 className="feature-title">Real-time Ocean Mapping</h3>
              <p className="feature-description">
                Interactive global maps with live data from thousands of sensors,
                tracking temperature, currents, and marine life movements.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <BeakerIcon className="w-full h-full" />
              </div>
              <h3 className="feature-title">AI Species Recognition</h3>
              <p className="feature-description">
                Advanced computer vision technology for instant marine life identification
                with 95.2% accuracy across 2,847+ species.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <ChartBarIcon className="w-full h-full" />
              </div>
              <h3 className="feature-title">Shark Tracking</h3>
              <p className="feature-description">
                Monitor 40,000+ tagged sharks globally with migration patterns,
                behavior analysis, and conservation status tracking.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <GlobeAltIcon className="w-full h-full" />
              </div>
              <h3 className="feature-title">Climate Analysis</h3>
              <p className="feature-description">
                Comprehensive climate data analysis with predictive modeling
                for ocean temperature trends and ecosystem changes.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <HeartIcon className="w-full h-full" />
              </div>
              <h3 className="feature-title">Conservation Action</h3>
              <p className="feature-description">
                Direct support for marine conservation efforts with real-time
                crisis response and community-driven action campaigns.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <BeakerIcon className="w-full h-full" />
              </div>
              <h3 className="feature-title">Research Collaboration</h3>
              <p className="feature-description">
                Open platform for marine researchers with data sharing,
                collaborative tools, and scientific publication support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Make a Difference?</h2>
          <p className="cta-subtitle">
            Join thousands of researchers, educators, and ocean enthusiasts
            using BlueSphere to monitor and protect our marine ecosystems.
          </p>
          <Link href="/map" className="btn-cta">
            <MapIcon className="w-5 h-5" />
            Start Exploring
          </Link>
        </div>
      </section>
    </WorldClassLayout>
  );
};

export default HomePage;