/*
 * BlueSphere Homepage - Complete Redesign
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import Layout from '../components/Layout';
import { PageHeader, PageSection, Card, Button, Grid, Stats } from '../components/PageLayout';

const HomePage = () => {
  const stats = [
    { label: 'Ocean Sensors', value: '15,000+', change: '+12% this month', trend: 'up' as const },
    { label: 'Data Points', value: '2.4M', change: '+8% this month', trend: 'up' as const },
    { label: 'Marine Species', value: '1,200+', change: 'New discoveries weekly', trend: 'neutral' as const },
    { label: 'Countries', value: '85', change: 'Global coverage', trend: 'neutral' as const }
  ];

  return (
    <Layout
      title="BlueSphere — Global Ocean Monitoring Platform"
      description="Real-time ocean temperature monitoring, shark tracking, and climate data from 15,000+ sensors worldwide. Open-source marine conservation platform for researchers and educators."
      keywords="ocean monitoring, marine data, sea temperature, ocean currents, oceanography, marine biology, climate data, ocean sensors, marine ecosystem"
    >
      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #f6f8fa 0%, #ffffff 100%);
          padding: 80px 24px 64px;
          text-align: center;
          border-bottom: 1px solid #d0d7de;
        }

        @media (prefers-color-scheme: dark) {
          .hero {
            background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
            border-bottom-color: #30363d;
          }
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 600;
          line-height: 1.1;
          color: #24292f;
          margin: 0 0 16px 0;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #656d76;
          margin: 0 0 32px 0;
          line-height: 1.4;
        }

        @media (prefers-color-scheme: dark) {
          .hero-title {
            color: #e6edf3;
          }
          .hero-subtitle {
            color: #7d8590;
          }
        }

        .hero-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #0969da, #0550ae);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          margin-bottom: 16px;
        }

        .feature-title {
          font-size: 18px;
          font-weight: 600;
          color: #24292f;
          margin: 0 0 8px 0;
        }

        .feature-description {
          color: #656d76;
          line-height: 1.5;
          margin: 0;
        }

        @media (prefers-color-scheme: dark) {
          .feature-title {
            color: #e6edf3;
          }
          .feature-description {
            color: #7d8590;
          }
        }

        .section-title {
          font-size: 32px;
          font-weight: 600;
          color: #24292f;
          margin: 0 0 16px 0;
          text-align: center;
        }

        .section-subtitle {
          font-size: 16px;
          color: #656d76;
          text-align: center;
          margin: 0 0 48px 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (prefers-color-scheme: dark) {
          .section-title {
            color: #e6edf3;
          }
          .section-subtitle {
            color: #7d8590;
          }
        }

        @media (max-width: 768px) {
          .hero {
            padding: 48px 16px 40px;
          }
          .hero-title {
            font-size: 32px;
          }
          .hero-subtitle {
            font-size: 16px;
          }
          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }
          .section-title {
            font-size: 24px;
          }
        }
      `}</style>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Monitor Our Oceans in Real-Time</h1>
          <p className="hero-subtitle">
            Advanced AI-powered platform tracking marine ecosystems, climate patterns,
            and wildlife movements across the globe in real-time.
          </p>
          <div className="hero-buttons">
            <Button href="/map" variant="primary" size="lg">
              🗺️ Explore Ocean Map
            </Button>
            <Button href="/sharks" variant="secondary" size="lg">
              🦈 Track Sharks
            </Button>
            <Button href="/analytics" variant="ghost" size="lg">
              📊 View Analytics
            </Button>
          </div>
          <Stats stats={stats} />
        </div>
      </section>

      <PageSection>
        <h2 className="section-title">Real-Time Ocean Intelligence</h2>
        <p className="section-subtitle">
          Cutting-edge technology meets marine science to deliver unprecedented
          insights into our planet's most critical ecosystems.
        </p>

        <Grid cols={3}>
          <Card hover>
            <div className="feature-icon">🌊</div>
            <h3 className="feature-title">Live Ocean Monitoring</h3>
            <p className="feature-description">
              Real-time temperature, currents, and weather data from thousands
              of sensors across the globe, updated every minute.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Button href="/map" variant="ghost" size="sm">
                View Live Map →
              </Button>
            </div>
          </Card>

          <Card hover>
            <div className="feature-icon">🦈</div>
            <h3 className="feature-title">Marine Wildlife Tracking</h3>
            <p className="feature-description">
              Track sharks, whales, and other marine animals with satellite tags,
              revealing migration patterns and habitat usage.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Button href="/sharks" variant="ghost" size="sm">
                Track Animals →
              </Button>
            </div>
          </Card>

          <Card hover>
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">AI Predictive Analytics</h3>
            <p className="feature-description">
              Machine learning models predict marine heatwaves, ecosystem changes,
              and species population trends before they happen.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Button href="/analytics" variant="ghost" size="sm">
                View Predictions →
              </Button>
            </div>
          </Card>
        </Grid>
      </PageSection>

      <PageSection>
        <h2 className="section-title">Conservation in Action</h2>
        <p className="section-subtitle">
          Our data directly supports marine conservation efforts and policy decisions worldwide.
        </p>

        <Grid cols={2}>
          <Card>
            <h3 className="feature-title">🚨 Crisis Response</h3>
            <p className="feature-description">
              Real-time alerts for marine heatwaves, coral bleaching events,
              and ecosystem threats enable rapid response from conservation teams.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Button href="/crisis" variant="primary" size="sm">
                Crisis Monitor
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="feature-title">📚 Educational Resources</h3>
            <p className="feature-description">
              Interactive stories, data visualizations, and educational content
              help people understand and protect our oceans.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Button href="/stories" variant="primary" size="sm">
                Ocean Stories
              </Button>
            </div>
          </Card>
        </Grid>
      </PageSection>

      <PageSection>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <h2 className="section-title">Ready to Explore?</h2>
          <p className="section-subtitle">
            Join thousands of researchers, conservationists, and ocean enthusiasts
            using BlueSphere to understand and protect our marine ecosystems.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button href="/map" variant="primary" size="lg">
              Start Exploring
            </Button>
            <Button href="/about" variant="secondary" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </PageSection>
    </Layout>
  );
};

export default HomePage;