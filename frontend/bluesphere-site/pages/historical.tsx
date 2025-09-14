/*
 * BlueSphere Historical Data Cycling Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * 5-Year Historical Ocean Temperature Analysis
 */

import React, { useState } from 'react';
import Layout from '../components/Layout';
import HistoricalDataCycler from '../components/HistoricalDataCycler';

const HistoricalDataPage = () => {
  const [currentYear, setCurrentYear] = useState(2024);
  const [viewMode, setViewMode] = useState<'absolute' | 'anomaly'>('anomaly');

  const HistoricalContent = () => (
    <div className="bs-section">
      {/* Hero Header */}
      <div className="text-center mb-12">
        <div className="bs-icon-wrapper mx-auto mb-6">
          <span className="bs-icon">📈</span>
        </div>
        <h1 className="bs-heading-1 mb-4">
          Historical Ocean Temperature Analysis
        </h1>
        <p className="bs-text-body text-xl max-w-3xl mx-auto mb-8">
          Interactive 5-year cycling visualization revealing long-term ocean temperature trends and climate change impacts
          across our global monitoring network. Witness the gradual warming of our oceans year by year.
        </p>

        <div className="flex justify-center space-x-6 text-center">
          <div className="bs-premium-card p-4">
            <div className="text-2xl font-bold text-blue-600">2019-2024</div>
            <div className="bs-text-small">Analysis Period</div>
          </div>
          <div className="bs-premium-card p-4">
            <div className="text-2xl font-bold text-green-600">{currentYear}</div>
            <div className="bs-text-small">Current Year</div>
          </div>
          <div className="bs-premium-card p-4">
            <div className="text-2xl font-bold text-orange-600">5</div>
            <div className="bs-text-small">Monitoring Stations</div>
          </div>
        </div>
      </div>

      {/* Main Historical Data Cycler */}
      <div className="mb-12">
        <HistoricalDataCycler
          startYear={2019}
          endYear={2024}
          cycleSpeed={2500}
          showAnomaly={viewMode === 'anomaly'}
          autoPlay={true}
          onYearChange={setCurrentYear}
          stations={['41001', '41002', '46001', '46002', '42001']}
        />
      </div>

      {/* Analysis Controls */}
      <div className="bs-premium-card p-8 mb-12">
        <h3 className="bs-heading-3 mb-6">Analysis Options</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* View Mode Toggle */}
          <div>
            <label className="bs-heading-3 mb-3 block">Temperature Display</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="viewMode"
                  value="absolute"
                  checked={viewMode === 'absolute'}
                  onChange={(e) => setViewMode(e.target.value as 'absolute' | 'anomaly')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="bs-text-body">Absolute Temperature (°C)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="viewMode"
                  value="anomaly"
                  checked={viewMode === 'anomaly'}
                  onChange={(e) => setViewMode(e.target.value as 'absolute' | 'anomaly')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="bs-text-body">Temperature Anomaly (°C)</span>
              </label>
            </div>
          </div>

          {/* Station Information */}
          <div>
            <label className="bs-heading-3 mb-3 block">Monitoring Stations</label>
            <div className="space-y-2 bs-text-small">
              <div>🌊 <strong>41001:</strong> East Hatteras (Atlantic)</div>
              <div>🌊 <strong>41002:</strong> South Hatteras (Atlantic)</div>
              <div>🌊 <strong>46001:</strong> Gulf of Alaska (Pacific)</div>
              <div>🌊 <strong>46002:</strong> Oregon Coast (Pacific)</div>
              <div>🌊 <strong>42001:</strong> Gulf of Mexico</div>
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <label className="bs-heading-3 mb-3 block">Key Insights</label>
            <div className="space-y-2 bs-text-small">
              <div>📈 <strong>Warming Trend:</strong> +0.18°C per decade</div>
              <div>🌡️ <strong>Peak Temperatures:</strong> Summer 2023-2024</div>
              <div>🌊 <strong>Ocean Regions:</strong> Atlantic warming fastest</div>
              <div>⚠️ <strong>Marine Heatwaves:</strong> Increasing frequency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Climate Context Section */}
      <div className="bs-grid bs-grid-auto mb-12">
        <div className="bs-premium-card p-8">
          <div className="flex items-center mb-6">
            <div className="bs-icon-wrapper mr-4">
              <span className="bs-icon">🌍</span>
            </div>
            <h3 className="bs-heading-3">Climate Context</h3>
          </div>

          <div className="space-y-4 bs-text-body">
            <p>
              <strong>Ocean Temperature Anomalies</strong> represent deviations from the 1990-2020 baseline period.
              Positive anomalies (red) indicate warmer than average conditions, while negative anomalies (blue)
              show cooler conditions.
            </p>
            <p>
              The consistent warming trend visible across all monitoring stations demonstrates the global scale
              of ocean warming due to climate change. Ocean temperatures have increased by approximately
              <strong> 0.6°C since 1969</strong>, with the top 2000 meters warming significantly.
            </p>
          </div>
        </div>

        <div className="bs-premium-card p-8">
          <div className="flex items-center mb-6">
            <div className="bs-icon-wrapper mr-4">
              <span className="bs-icon">📊</span>
            </div>
            <h3 className="bs-heading-3">Scientific Methodology</h3>
          </div>

          <div className="space-y-4 bs-text-body">
            <p>
              <strong>Data Collection:</strong> Temperature measurements from NOAA NDBC ocean buoys providing
              continuous monitoring with hourly observations. All data undergoes rigorous quality control
              including range checks, spike detection, and spatial consistency validation.
            </p>
            <p>
              <strong>Analysis Period:</strong> 5-year cycling (2019-2024) captures recent climate trends while
              providing sufficient temporal resolution to identify seasonal patterns and year-to-year variability
              in ocean temperatures.
            </p>
          </div>
        </div>

        <div className="bs-premium-card p-8">
          <div className="flex items-center mb-6">
            <div className="bs-icon-wrapper mr-4">
              <span className="bs-icon">🚨</span>
            </div>
            <h3 className="bs-heading-3">Climate Impacts</h3>
          </div>

          <div className="space-y-4 bs-text-body">
            <p>
              <strong>Marine Ecosystems:</strong> Rising ocean temperatures stress coral reefs, alter fish
              migration patterns, and disrupt marine food chains. Temperature increases above 1°C can
              trigger coral bleaching events.
            </p>
            <p>
              <strong>Weather Patterns:</strong> Warmer oceans fuel stronger hurricanes, alter precipitation
              patterns, and contribute to extreme weather events. Ocean heat content is a key indicator
              of climate system energy balance.
            </p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bs-premium-card p-8 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="text-center mb-6">
          <h3 className="bs-heading-2 text-blue-900 mb-4">
            Taking Action on Ocean Warming
          </h3>
          <p className="bs-text-body text-blue-800 max-w-3xl mx-auto">
            Understanding historical temperature trends empowers informed climate action. Use this data to
            advocate for emissions reduction, marine protected areas, and sustainable ocean management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bs-icon-wrapper mx-auto mb-4">
              <span className="bs-icon">🏛️</span>
            </div>
            <h4 className="font-semibold text-blue-900 mb-2">Policy Makers</h4>
            <p className="bs-text-small text-blue-800">
              Use temperature trend data to inform climate policy, marine conservation strategies,
              and international climate agreements.
            </p>
          </div>

          <div className="text-center">
            <div className="bs-icon-wrapper mx-auto mb-4">
              <span className="bs-icon">🔬</span>
            </div>
            <h4 className="font-semibold text-blue-900 mb-2">Researchers</h4>
            <p className="bs-text-small text-blue-800">
              Access historical temperature datasets for climate model validation, trend analysis,
              and marine ecosystem impact studies.
            </p>
          </div>

          <div className="text-center">
            <div className="bs-icon-wrapper mx-auto mb-4">
              <span className="bs-icon">🌱</span>
            </div>
            <h4 className="font-semibold text-blue-900 mb-2">Activists</h4>
            <p className="bs-text-small text-blue-800">
              Leverage compelling temperature visualizations to communicate climate urgency
              and advocate for immediate climate action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Historical Ocean Temperature Analysis - BlueSphere">
      <HistoricalContent />
    </Layout>
  );
};

export default HistoricalDataPage;