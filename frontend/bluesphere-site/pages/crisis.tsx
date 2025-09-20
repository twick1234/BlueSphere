/*
 * BlueSphere Crisis Monitoring Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface CrisisAlert {
  id: string;
  type: 'marine_heatwave' | 'coral_bleaching' | 'acidification' | 'sea_level';
  severity: 'watch' | 'advisory' | 'warning' | 'emergency';
  title: string;
  location: string;
  coordinates: { lat: number; lon: number };
  status: 'active' | 'developing' | 'monitoring' | 'resolved';
  startDate: string;
  description: string;
  impact: string;
  prediction: string;
}

const CrisisPage = () => {
  const [activeAlerts, setActiveAlerts] = useState<CrisisAlert[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    // Simulate real-time crisis data
    const simulatedAlerts: CrisisAlert[] = [
      {
        id: 'crisis_001',
        type: 'marine_heatwave',
        severity: 'emergency',
        title: 'Severe Marine Heatwave - Great Barrier Reef',
        location: 'Great Barrier Reef, Australia',
        coordinates: { lat: -16.3, lon: 145.8 },
        status: 'active',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Extreme temperatures 4.2°C above baseline detected across 1,200km of reef system',
        impact: 'Mass coral bleaching event in progress. 65% of surveyed reefs showing severe stress indicators.',
        prediction: 'Conditions expected to persist for 2-3 weeks. Recovery period estimated at 12-18 months.'
      },
      {
        id: 'crisis_002',
        type: 'coral_bleaching',
        severity: 'warning',
        title: 'Coral Bleaching Alert - Caribbean Basin',
        location: 'Caribbean Sea, Jamaica',
        coordinates: { lat: 18.2, lon: -77.5 },
        status: 'developing',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Rising temperatures reaching critical thresholds for coral survival',
        impact: 'Initial bleaching observed in shallow reef areas. Tourism and fisheries at risk.',
        prediction: 'Full bleaching event likely within 7 days if temperatures remain elevated.'
      },
      {
        id: 'crisis_003',
        type: 'acidification',
        severity: 'warning',
        title: 'Ocean Acidification Crisis - Arctic Ocean',
        location: 'Beaufort Sea, Arctic',
        coordinates: { lat: 75.0, lon: -140.0 },
        status: 'monitoring',
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'pH levels dropping below critical thresholds for shell-forming organisms',
        impact: 'Marine food web disruption. Arctic char and polar cod populations at risk.',
        prediction: 'Conditions may persist through Arctic summer. Long-term ecosystem impacts likely.'
      },
      {
        id: 'crisis_004',
        type: 'sea_level',
        severity: 'advisory',
        title: 'Extreme Sea Level Event - Pacific Coast',
        location: 'California Coast, USA',
        coordinates: { lat: 37.8, lon: -122.4 },
        status: 'active',
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'King tide combined with storm surge creating extreme high water levels',
        impact: 'Coastal flooding in low-lying areas. Infrastructure and habitat stress.',
        prediction: 'Conditions to subside within 48 hours. Monitoring ongoing for erosion impacts.'
      }
    ];

    setActiveAlerts(simulatedAlerts);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'text-red-600 bg-red-100 border-red-500';
      case 'warning': return 'text-orange-600 bg-orange-100 border-orange-500';
      case 'advisory': return 'text-yellow-600 bg-yellow-100 border-yellow-500';
      case 'watch': return 'text-green-600 bg-green-100 border-green-500';
      default: return 'text-gray-600 bg-gray-100 border-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'marine_heatwave': return '🌡️';
      case 'coral_bleaching': return '🪸';
      case 'acidification': return '⚗️';
      case 'sea_level': return '🌊';
      default: return '📊';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active': return '🔴 ACTIVE';
      case 'developing': return '🟠 DEVELOPING';
      case 'monitoring': return '🟡 MONITORING';
      case 'resolved': return '🟢 RESOLVED';
      default: return '⚪ UNKNOWN';
    }
  };

  const filteredAlerts = activeAlerts.filter(alert => {
    const severityMatch = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const typeMatch = selectedType === 'all' || alert.type === selectedType;
    return severityMatch && typeMatch;
  });

  return (
    <Layout title="Ocean Crisis Monitoring - BlueSphere">
      <div className="bs-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="bs-heading-1 mb-4">🚨 Ocean Crisis Monitoring</h1>
            <p className="bs-text-body max-w-3xl mx-auto">
              Real-time tracking of marine environmental emergencies and climate events affecting ocean ecosystems worldwide.
              Our advanced monitoring systems provide early warning and impact assessment for critical ocean crises.
            </p>
          </div>

          {/* Alert Summary Dashboard */}
          <div className="bs-grid bs-grid-4 mb-8">
            <div className="bs-premium-card p-4 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {activeAlerts.filter(a => a.severity === 'emergency').length}
              </div>
              <div className="bs-text-sm text-gray-600">Emergency Alerts</div>
            </div>
            <div className="bs-premium-card p-4 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {activeAlerts.filter(a => a.severity === 'warning').length}
              </div>
              <div className="bs-text-sm text-gray-600">Warning Level</div>
            </div>
            <div className="bs-premium-card p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {activeAlerts.filter(a => a.severity === 'advisory').length}
              </div>
              <div className="bs-text-sm text-gray-600">Advisories</div>
            </div>
            <div className="bs-premium-card p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {activeAlerts.filter(a => a.status === 'active').length}
              </div>
              <div className="bs-text-sm text-gray-600">Active Crises</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bs-premium-card p-6 mb-8">
            <h2 className="bs-heading-3 mb-4">🔍 Filter Crisis Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block bs-text-sm font-medium mb-2">Severity Level</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severity Levels</option>
                  <option value="emergency">🔴 Emergency</option>
                  <option value="warning">🟠 Warning</option>
                  <option value="advisory">🟡 Advisory</option>
                  <option value="watch">🟢 Watch</option>
                </select>
              </div>
              <div>
                <label className="block bs-text-sm font-medium mb-2">Crisis Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Crisis Types</option>
                  <option value="marine_heatwave">🌡️ Marine Heatwave</option>
                  <option value="coral_bleaching">🪸 Coral Bleaching</option>
                  <option value="acidification">⚗️ Ocean Acidification</option>
                  <option value="sea_level">🌊 Sea Level Extreme</option>
                </select>
              </div>
            </div>
          </div>

          {/* Crisis Alerts List */}
          <div className="space-y-6">
            <h2 className="bs-heading-2 mb-4">📋 Active Crisis Alerts ({filteredAlerts.length})</h2>

            {filteredAlerts.length === 0 ? (
              <div className="bs-premium-card p-8 text-center">
                <div className="text-6xl mb-4">🌊</div>
                <h3 className="bs-heading-3 mb-2">No Active Crises</h3>
                <p className="bs-text-body">No crisis alerts match your current filter criteria.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className={`bs-premium-card p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getTypeIcon(alert.type)}</div>
                      <div>
                        <h3 className="bs-heading-3 mb-1">{alert.title}</h3>
                        <div className="flex items-center space-x-4 bs-text-sm text-gray-600">
                          <span>📍 {alert.location}</span>
                          <span>{getStatusIndicator(alert.status)}</span>
                          <span>📅 Started {new Date(alert.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="bs-text-sm font-semibold mb-1">📋 Description</h4>
                      <p className="bs-text-sm text-gray-700">{alert.description}</p>
                    </div>
                    <div>
                      <h4 className="bs-text-sm font-semibold mb-1">⚠️ Current Impact</h4>
                      <p className="bs-text-sm text-gray-700">{alert.impact}</p>
                    </div>
                    <div>
                      <h4 className="bs-text-sm font-semibold mb-1">🔮 Prediction</h4>
                      <p className="bs-text-sm text-gray-700">{alert.prediction}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button className="bs-btn-secondary text-sm">📍 View on Map</button>
                    <button className="bs-btn-secondary text-sm">📈 Historical Data</button>
                    <button className="bs-btn-secondary text-sm">🔔 Subscribe to Updates</button>
                    <button className="bs-btn-secondary text-sm">📊 Detailed Report</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Crisis Response Information */}
          <div className="bs-premium-card p-8 mt-8">
            <h2 className="bs-heading-2 mb-6 text-center">🚑 Crisis Response Framework</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🟢</div>
                <h3 className="bs-heading-4 mb-2">Level 1 - Watch</h3>
                <p className="bs-text-sm">Conditions favorable for crisis development</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🟡</div>
                <h3 className="bs-heading-4 mb-2">Level 2 - Advisory</h3>
                <p className="bs-text-sm">Crisis development likely within 48 hours</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🟠</div>
                <h3 className="bs-heading-4 mb-2">Level 3 - Warning</h3>
                <p className="bs-text-sm">Crisis imminent or beginning</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🔴</div>
                <h3 className="bs-heading-4 mb-2">Level 4 - Emergency</h3>
                <p className="bs-text-sm">Crisis in progress with significant impacts</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bs-premium-card p-8 mt-8">
            <h2 className="bs-heading-2 mb-4 text-center">🔗 Crisis Resources</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/map" className="bs-btn-primary">🗺️ View Crisis Map</a>
              <a href="/alerts" className="bs-btn-primary">🚨 Alert System</a>
              <a href="/historical" className="bs-btn-secondary">📈 Historical Crises</a>
              <a href="/education" className="bs-btn-secondary">📚 Understanding Ocean Crises</a>
              <a href="/docs" className="bs-btn-secondary">📋 Response Protocols</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CrisisPage;