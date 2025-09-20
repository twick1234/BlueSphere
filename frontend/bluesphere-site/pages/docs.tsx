/*
 * BlueSphere Documentation Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import Layout from '../components/Layout';

const DocsPage = () => {
  return (
    <Layout title="Documentation - BlueSphere">
      <div className="bs-section">
        <div className="max-w-4xl mx-auto">
          <h1 className="bs-heading-1 mb-8">📚 Documentation</h1>

          <div className="bs-grid bs-grid-2">
            <div className="bs-premium-card p-6">
              <h2 className="bs-heading-3 mb-4">🚀 Getting Started</h2>
              <p className="bs-text-body mb-4">
                Learn how to use BlueSphere's ocean monitoring platform and explore real-time marine data.
              </p>
              <a href="/USER_GUIDE.md" className="bs-btn-primary" download>
                Download User Guide
              </a>
            </div>

            <div className="bs-premium-card p-6">
              <h2 className="bs-heading-3 mb-4">🔧 Build Guide</h2>
              <p className="bs-text-body mb-4">
                Complete instructions for developers to build, test, and deploy BlueSphere.
              </p>
              <a href="/BUILD_GUIDE.md" className="bs-btn-primary" download>
                Download Build Guide
              </a>
            </div>

            <div className="bs-premium-card p-6">
              <h2 className="bs-heading-3 mb-4">🦈 Shark Tracking</h2>
              <p className="bs-text-body mb-4">
                Understanding our real-time shark tracking system with individual movement plots.
              </p>
              <a href="/map?focus=sharks" className="bs-btn-secondary">
                View Shark Tracker
              </a>
            </div>

            <div className="bs-premium-card p-6">
              <h2 className="bs-heading-3 mb-4">🌊 Marine Heatwaves</h2>
              <p className="bs-text-body mb-4">
                Learn about our marine heatwave detection and alerting system.
              </p>
              <a href="/alerts" className="bs-btn-secondary">
                View Alert System
              </a>
            </div>

            <div className="bs-premium-card p-6">
              <h2 className="bs-heading-3 mb-4">📊 Data Sources</h2>
              <p className="bs-text-body mb-4">
                Information about our ocean data integration from NOAA, OCEARCH, and satellite sources.
              </p>
              <ul className="bs-text-body list-disc list-inside space-y-2">
                <li>NOAA National Data Buoy Center (NDBC)</li>
                <li>OCEARCH Shark Tracking Network</li>
                <li>Satellite Sea Surface Temperature</li>
                <li>Marine Research Institutions</li>
              </ul>
            </div>

            <div className="bs-premium-card p-6">
              <h2 className="bs-heading-3 mb-4">⚡ Performance</h2>
              <p className="bs-text-body mb-4">
                Technical details about our performance optimization and mobile responsiveness.
              </p>
              <a href="/architecture" className="bs-btn-secondary">
                View Architecture
              </a>
            </div>
          </div>

          <div className="bs-premium-card p-8 mt-8">
            <h2 className="bs-heading-2 mb-4 text-center">🔗 Quick Links</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/map" className="bs-btn-primary">Interactive Map</a>
              <a href="/stories" className="bs-btn-primary">Educational Stories</a>
              <a href="/historical" className="bs-btn-primary">Historical Data</a>
              <a href="/analytics" className="bs-btn-secondary">Data Analytics</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DocsPage;