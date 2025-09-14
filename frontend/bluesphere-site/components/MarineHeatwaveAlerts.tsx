/*
 * BlueSphere Marine Heatwave Alerts Component
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Real-time marine heatwave monitoring and alert display
 */

import React, { useState, useEffect } from 'react';
import { marineHeatwaveService, MarineHeatwaveAlert, HeatwaveAnalytics } from '../lib/marine-heatwave-alerts';

interface MarineHeatwaveAlertsProps {
  region?: string;
  showAnalytics?: boolean;
  maxAlerts?: number;
}

const MarineHeatwaveAlerts: React.FC<MarineHeatwaveAlertsProps> = ({
  region,
  showAnalytics = true,
  maxAlerts = 10
}) => {
  const [alerts, setAlerts] = useState<MarineHeatwaveAlert[]>([]);
  const [analytics, setAnalytics] = useState<HeatwaveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<MarineHeatwaveAlert | null>(null);
  const [subscriptionEmail, setSubscriptionEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'subscribing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [alertData, analyticsData] = await Promise.all([
          region ? marineHeatwaveService.getRegionalHeatwaves(region) : marineHeatwaveService.getActiveHeatwaves(),
          showAnalytics ? marineHeatwaveService.getHeatwaveAnalytics() : Promise.resolve(null)
        ]);

        setAlerts(alertData.slice(0, maxAlerts));
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to load heatwave data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [region, showAnalytics, maxAlerts]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionEmail) return;

    setSubscriptionStatus('subscribing');
    try {
      const success = await marineHeatwaveService.subscribeToAlerts({
        email: subscriptionEmail,
        regions: region ? [region] : ['global'],
        severity_threshold: 'moderate',
        notification_methods: ['email'],
        frequency: 'immediate',
        active: true
      });

      setSubscriptionStatus(success ? 'success' : 'error');
      if (success) {
        setSubscriptionEmail('');
        setTimeout(() => setSubscriptionStatus('idle'), 3000);
      }
    } catch (error) {
      setSubscriptionStatus('error');
    }
  };

  const formatTemperature = (temp: number): string => {
    return `${temp.toFixed(1)}°C`;
  };

  const formatArea = (area: number): string => {
    if (area > 1000000) {
      return `${(area / 1000000).toFixed(1)}M km²`;
    } else if (area > 1000) {
      return `${(area / 1000).toFixed(0)}K km²`;
    }
    return `${area.toFixed(0)} km²`;
  };

  const getStatusIcon = (status: MarineHeatwaveAlert['status']): string => {
    switch (status) {
      case 'developing': return '🌡️';
      case 'active': return '🔥';
      case 'declining': return '📉';
      case 'ended': return '✅';
      default: return '❓';
    }
  };

  const getRiskIcon = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return '🟢';
      case 'moderate': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="bs-section">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="bs-text-body">Loading marine heatwave data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bs-section">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="bs-heading-1 mb-4">🌊 Marine Heatwave Alerts</h1>
          <p className="bs-text-body text-gray-600 max-w-3xl mx-auto">
            Real-time monitoring of marine heatwaves worldwide. These temperature anomalies
            can have significant impacts on marine ecosystems, fisheries, and coral reefs.
          </p>
        </div>

        {/* Global Analytics */}
        {analytics && showAnalytics && (
          <div className="bs-premium-card p-8 mb-8">
            <h2 className="bs-heading-2 mb-6 text-center">Global Marine Heatwave Status</h2>

            <div className="bs-grid bs-grid-4 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {analytics.global_summary.active_heatwaves}
                </div>
                <div className="bs-text-small text-gray-600">Active Heatwaves</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {analytics.global_summary.regions_affected}
                </div>
                <div className="bs-text-small text-gray-600">Regions Affected</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {formatArea(analytics.global_summary.total_affected_area_km2)}
                </div>
                <div className="bs-text-small text-gray-600">Total Area</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  +{analytics.global_summary.average_intensity.toFixed(1)}°C
                </div>
                <div className="bs-text-small text-gray-600">Avg. Intensity</div>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="mb-6">
              <h3 className="bs-heading-3 mb-4 text-center">Severity Distribution</h3>
              <div className="flex gap-4 justify-center">
                {Object.entries(analytics.severity_distribution).map(([severity, count]) => (
                  <div key={severity} className="text-center">
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: marineHeatwaveService.getSeverityColor(severity as any) }}
                    ></div>
                    <div className="font-bold">{count}</div>
                    <div className="bs-text-small text-gray-600 capitalize">{severity}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Analysis */}
            <div className="border-t pt-6">
              <h3 className="bs-heading-3 mb-4 text-center">Trend Analysis</h3>
              <div className="bs-grid bs-grid-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    +{analytics.trend_analysis.frequency_change_percent}%
                  </div>
                  <div className="bs-text-small text-gray-600">Frequency Change</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    +{analytics.trend_analysis.intensity_change_percent}%
                  </div>
                  <div className="bs-text-small text-gray-600">Intensity Change</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    +{analytics.trend_analysis.duration_change_percent}%
                  </div>
                  <div className="bs-text-small text-gray-600">Duration Change</div>
                </div>
              </div>
              <div className="text-center mt-4">
                <div className="bs-text-small text-gray-500">
                  Compared to {analytics.trend_analysis.period_compared}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Subscription */}
        <div className="bs-premium-card p-6 mb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="bs-heading-3 mb-4">🔔 Get Heatwave Alerts</h3>
            <p className="bs-text-body text-gray-600 mb-4">
              Subscribe to receive notifications when marine heatwaves develop in your region.
            </p>

            <form onSubmit={handleSubscribe} className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                value={subscriptionEmail}
                onChange={(e) => setSubscriptionEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                disabled={subscriptionStatus === 'subscribing'}
                required
              />
              <button
                type="submit"
                className="bs-btn-primary"
                disabled={subscriptionStatus === 'subscribing'}
              >
                {subscriptionStatus === 'subscribing' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>

            {subscriptionStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
                Successfully subscribed to heatwave alerts!
              </div>
            )}

            {subscriptionStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
                Failed to subscribe. Please try again later.
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="mb-8">
          <h2 className="bs-heading-2 mb-6">
            {region ? `Active Alerts in ${region}` : 'Active Marine Heatwaves'}
          </h2>

          {alerts.length === 0 ? (
            <div className="bs-premium-card p-12 text-center">
              <div className="text-6xl mb-4">🌊</div>
              <h3 className="bs-heading-3 mb-2">No Active Heatwaves</h3>
              <p className="bs-text-body text-gray-600">
                {region ? `No marine heatwaves currently detected in ${region}.`
                        : 'No marine heatwaves currently active worldwide.'}
              </p>
            </div>
          ) : (
            <div className="bs-grid bs-grid-auto">
              {alerts.map((alert) => {
                const ecologicalRisk = marineHeatwaveService.calculateEcologicalRisk(alert);

                return (
                  <div
                    key={alert.id}
                    className="bs-premium-card p-6 cursor-pointer hover:scale-105 transition-all"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    {/* Alert Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getStatusIcon(alert.status)}</span>
                        <div>
                          <div className="font-bold text-lg">{alert.region}</div>
                          <div className="bs-text-small text-gray-600">
                            Day {alert.duration_days} • {alert.confidence_level}% confidence
                          </div>
                        </div>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: marineHeatwaveService.getSeverityColor(alert.severity) }}
                      >
                        {alert.severity.toUpperCase()}
                      </div>
                    </div>

                    {/* Temperature Info */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="bs-text-body">Temperature Anomaly</span>
                        <span className="font-bold text-red-600">+{alert.intensity.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="bs-text-body">Current Temperature</span>
                        <span className="font-bold">{formatTemperature(alert.current_temperature)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="bs-text-body">Affected Area</span>
                        <span className="font-bold">{formatArea(alert.affected_area_km2)}</span>
                      </div>
                    </div>

                    {/* Ecological Impact */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getRiskIcon(alert.ecological_impact.risk_level)}</span>
                        <span className="font-medium">
                          {alert.ecological_impact.risk_level.charAt(0).toUpperCase() +
                           alert.ecological_impact.risk_level.slice(1)} Ecological Risk
                        </span>
                      </div>

                      {alert.ecological_impact.coral_bleaching_risk > 30 && (
                        <div className="bg-red-50 p-3 rounded-lg mb-3">
                          <div className="flex items-center gap-2 text-red-800">
                            <span>🪸</span>
                            <span className="font-medium">
                              Coral Bleaching Risk: {alert.ecological_impact.coral_bleaching_risk}%
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="bs-text-small text-gray-600">
                        Click to view detailed analysis and recommendations
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Alert Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="bs-heading-2">Marine Heatwave Details</h2>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Detailed information would go here */}
                <div className="space-y-6">
                  <div>
                    <h3 className="bs-heading-3 mb-3">Basic Information</h3>
                    <div className="bs-grid bs-grid-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium mb-1">Region</div>
                        <div>{selectedAlert.region}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium mb-1">Status</div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedAlert.status)}
                          <span className="capitalize">{selectedAlert.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="bs-heading-3 mb-3">Ecological Impact Assessment</h3>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <p className="mb-4">{marineHeatwaveService.calculateEcologicalRisk(selectedAlert).description}</p>
                      <div>
                        <div className="font-medium mb-2">Recommended Actions:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {marineHeatwaveService.calculateEcologicalRisk(selectedAlert).recommendations.map((rec, index) => (
                            <li key={index} className="bs-text-body">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="bs-btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarineHeatwaveAlerts;