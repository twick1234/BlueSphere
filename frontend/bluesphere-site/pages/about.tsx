/*
 * BlueSphere About Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import Layout from '../components/Layout';

const AboutPage = () => {
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
          padding: 6rem 0;
          margin: -24px -16px 0;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-effects {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%);
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
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 800;
          margin-bottom: 1.5rem;
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

        .content-section {
          padding: 4rem 0;
          margin: 0 -16px;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1.5rem;
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
        }

        .creator-card {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-radius: 24px;
          padding: 3rem;
          margin-bottom: 4rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .creator-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .creator-name {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .creator-title {
          font-size: 1.25rem;
          color: #3b82f6;
          font-weight: 600;
        }

        .creator-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .info-card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-list {
          list-style: none;
          padding: 0;
        }

        .info-list li {
          margin-bottom: 0.75rem;
          color: #64748b;
          line-height: 1.6;
          padding-left: 1.5rem;
          position: relative;
        }

        .info-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #3b82f6;
          font-weight: 600;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .value-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 20px;
          padding: 2.5rem;
          border: 1px solid #bae6fd;
          transition: all 0.3s ease;
        }

        .value-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.1);
        }

        .value-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .value-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 1rem;
        }

        .value-desc {
          color: #475569;
          line-height: 1.6;
        }

        .goals-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 4rem 0;
          margin: 0 -16px;
        }

        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .goal-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .goal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 1rem;
        }

        .goal-list {
          list-style: none;
          padding: 0;
        }

        .goal-list li {
          margin-bottom: 0.75rem;
          color: #64748b;
          line-height: 1.6;
          padding-left: 1.5rem;
          position: relative;
        }

        .goal-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: 600;
        }

        .tech-section {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 4rem 0;
          margin: 0 -16px;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .tech-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tech-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #38bdf8;
          margin-bottom: 1rem;
        }

        .cta-section {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 4rem 0;
          margin: 0 -16px;
          text-align: center;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cta-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .cta-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          text-decoration: none;
          color: white;
        }

        @media (max-width: 768px) {
          .hero-content, .content-wrapper {
            padding: 0 1rem;
          }

          .creator-content {
            grid-template-columns: 1fr;
          }

          .values-grid, .goals-grid, .tech-grid {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .section-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <Layout title="About BlueSphere - Ocean Monitoring Platform">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-effects"></div>
          <div className="hero-content">
            <h1 className="hero-title">About BlueSphere</h1>
            <p className="hero-subtitle">
              BlueSphere is a comprehensive ocean monitoring platform that democratizes access to critical marine data,
              empowering researchers, educators, policymakers, and citizens to understand and protect our oceans
              in the face of climate change.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="content-section">
          <div className="content-wrapper">
            <h2 className="section-title">🌊 Our Mission</h2>
            <p className="section-subtitle">
              We bring together open ocean data to power climate action, education, and research through
              real-time monitoring, predictive analytics, and accessible visualization tools that make
              complex oceanographic data understandable and actionable.
            </p>
          </div>
        </section>

        {/* Creator Section */}
        <section className="content-section">
          <div className="content-wrapper">
            <div className="creator-card">
              <div className="creator-header">
                <h3 className="creator-name">Mark Lindon</h3>
                <p className="creator-title">Founder & Lead Developer</p>
              </div>

              <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6', textAlign: 'center', marginBottom: '2rem' }}>
                Mark Lindon is a passionate ocean advocate and software engineer who combines deep technical expertise
                with environmental stewardship to create impactful solutions for climate monitoring and marine conservation.
              </p>

              <div className="creator-content">
                <div className="info-card">
                  <h4 className="info-card-title">🎯 Background</h4>
                  <ul className="info-list">
                    <li>Marine Science Advocate with expertise in climate data analysis and ocean monitoring systems</li>
                    <li>Full-stack software engineer specializing in real-time data visualization and environmental applications</li>
                    <li>Open-source contributor focused on democratizing access to critical climate and oceanographic data</li>
                    <li>Advocate for data-driven climate action and environmental education</li>
                  </ul>
                </div>

                <div className="info-card">
                  <h4 className="info-card-title">🛠️ Technical Expertise</h4>
                  <ul className="info-list">
                    <li>Real-time ocean data processing and visualization</li>
                    <li>Machine learning applications for environmental prediction</li>
                    <li>Full-stack web development with focus on scientific applications</li>
                    <li>API design for complex oceanographic data systems</li>
                    <li>DevOps and cloud infrastructure for high-availability monitoring systems</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', padding: '2rem', marginTop: '2rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <h4 style={{ color: '#1e40af', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>🔮 Vision</h4>
                <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  Mark believes that making ocean data accessible and understandable is crucial for addressing climate change
                  and protecting marine ecosystems. Through BlueSphere, he aims to bridge the gap between complex scientific
                  data and practical applications for research, education, and policy-making.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="content-section">
          <div className="content-wrapper">
            <h2 className="section-title">💝 Core Values & Principles</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🌊</div>
                <h3 className="value-title">Stewardship</h3>
                <p className="value-desc">
                  Protecting our oceans through responsible data management and environmental advocacy
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3 className="value-title">Inclusion</h3>
                <p className="value-desc">
                  Making ocean science accessible to everyone, regardless of technical background
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">🔍</div>
                <h3 className="value-title">Transparency</h3>
                <p className="value-desc">
                  Open-source development and clear, honest communication about data quality and limitations
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">♻️</div>
                <h3 className="value-title">Sustainability</h3>
                <p className="value-desc">
                  Building systems designed for long-term environmental and operational sustainability
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">📊</div>
                <h3 className="value-title">Data Quality First</h3>
                <p className="value-desc">
                  Rigorous quality control and validation procedures for all ocean data
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">🚀</div>
                <h3 className="value-title">Real-time Accessibility</h3>
                <p className="value-desc">
                  Providing immediate access to critical ocean monitoring information
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Goals Section */}
        <section className="goals-section">
          <div className="content-wrapper">
            <h2 className="section-title">🎯 Project Goals</h2>
            <div className="goals-grid">
              <div className="goal-card">
                <h3 className="goal-title">🎯 Short-term Objectives</h3>
                <ul className="goal-list">
                  <li>Provide real-time access to global ocean temperature and marine heatwave data</li>
                  <li>Develop early warning systems for coral bleaching and marine ecosystem stress</li>
                  <li>Create educational resources for ocean science and climate change education</li>
                  <li>Build a community of ocean data users and contributors</li>
                </ul>
              </div>

              <div className="goal-card">
                <h3 className="goal-title">🔮 Long-term Vision</h3>
                <ul className="goal-list">
                  <li>Establish BlueSphere as a premier platform for ocean monitoring and climate research</li>
                  <li>Expand coverage to include comprehensive marine ecosystem health indicators</li>
                  <li>Integrate predictive modeling for climate change impact assessment</li>
                  <li>Foster international collaboration in ocean conservation and research</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="tech-section">
          <div className="content-wrapper">
            <h2 className="section-title" style={{ color: 'white' }}>⚡ Technology & Innovation</h2>
            <div className="tech-grid">
              <div className="tech-card">
                <h3 className="tech-title">🏗️ Platform Architecture</h3>
                <ul className="info-list">
                  <li>Modern Web Technologies: React, Next.js, and TypeScript</li>
                  <li>Real-time Data Processing: Node.js and Python backends</li>
                  <li>Interactive Visualization: Leaflet and D3.js for dynamic maps</li>
                  <li>Cloud Infrastructure: Scalable deployment on modern platforms</li>
                  <li>API-First Design: RESTful APIs enabling third-party integration</li>
                </ul>
              </div>

              <div className="tech-card">
                <h3 className="tech-title">🛰️ Data Integration</h3>
                <ul className="info-list">
                  <li>Multi-source Validation: Satellite, buoy, and Argo float observations</li>
                  <li>Quality Assurance: Automated and manual quality control procedures</li>
                  <li>Historical Context: Long-term climate data for trend analysis</li>
                  <li>Predictive Analytics: Machine learning models for forecasting</li>
                </ul>
              </div>

              <div className="tech-card">
                <h3 className="tech-title">🔬 Data Sources</h3>
                <ul className="info-list">
                  <li>NOAA: National Ocean Service and National Data Buoy Center</li>
                  <li>NASA: Satellite-based sea surface temperature observations</li>
                  <li>Argo Float Network: International ocean profiling program</li>
                  <li>Global Ocean Observing System: Coordinated international monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source Commitment */}
        <section className="content-section">
          <div className="content-wrapper">
            <h2 className="section-title">💻 Open Source Commitment</h2>
            <p className="section-subtitle">
              BlueSphere is built on open-source principles, ensuring transparency, reproducibility,
              and community collaboration in ocean science and climate research.
            </p>

            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🔓</div>
                <h3 className="value-title">Transparency</h3>
                <p className="value-desc">
                  All code is publicly available for review and contribution
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">🔄</div>
                <h3 className="value-title">Reproducibility</h3>
                <p className="value-desc">
                  Scientific analyses can be independently verified and reproduced
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3 className="value-title">Community</h3>
                <p className="value-desc">
                  Researchers and developers worldwide can contribute improvements
                </p>
              </div>

              <div className="value-card">
                <div className="value-icon">🎓</div>
                <h3 className="value-title">Education</h3>
                <p className="value-desc">
                  Students and educators can learn from real-world environmental applications
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="content-wrapper">
            <h2 className="cta-title">Join Our Mission</h2>
            <p className="cta-subtitle">
              Together, we can build a better understanding of our oceans and take meaningful action
              to protect them for future generations.
            </p>
            <div className="cta-buttons">
              <a href="/map" className="cta-btn">🌊 Explore Ocean Data</a>
              <a href="/stories" className="cta-btn">📚 Learn More</a>
              <a href="/crisis" className="cta-btn">🚨 Current Crises</a>
              <a href="https://github.com/twick1234/BlueSphere" className="cta-btn" target="_blank" rel="noopener noreferrer">💻 Contribute</a>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default AboutPage;