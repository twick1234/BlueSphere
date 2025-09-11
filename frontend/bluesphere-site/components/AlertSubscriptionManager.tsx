import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface AlertSubscription {
  id: string;
  email: string;
  alertTypes: string[];
  thresholds: {
    temperature: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  zones: {
    name: string;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  }[];
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
}

interface AlertSubscriptionManagerProps {
  isDarkMode: boolean;
  userEmail?: string;
}

const AlertSubscriptionManager: React.FC<AlertSubscriptionManagerProps> = ({ 
  isDarkMode, 
  userEmail 
}) => {
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedZones, setExpandedZones] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    email: userEmail || '',
    alertTypes: ['marine_heatwave', 'temperature_spike'],
    thresholds: {
      temperature: 26,
      severity: 'medium' as const
    },
    zones: [{
      name: 'Custom Zone',
      bounds: {
        north: 20,
        south: -20,
        east: 20,
        west: -20
      }
    }]
  });

  const alertTypeOptions = [
    { value: 'marine_heatwave', label: 'Marine Heatwaves', description: 'Extended periods of unusually warm water' },
    { value: 'temperature_spike', label: 'Temperature Spikes', description: 'Rapid temperature increases' },
    { value: 'anomaly_detected', label: 'Temperature Anomalies', description: 'Unusual temperature patterns' },
    { value: 'coral_bleaching_risk', label: 'Coral Bleaching Risk', description: 'High risk of coral bleaching events' }
  ];

  const severityLevels = ['low', 'medium', 'high', 'critical'];

  const predefinedZones = [
    {
      name: 'Great Barrier Reef',
      bounds: { north: -10, south: -24, east: 154, west: 142 }
    },
    {
      name: 'Caribbean Sea',
      bounds: { north: 25, south: 9, east: -60, west: -87 }
    },
    {
      name: 'Mediterranean Sea',
      bounds: { north: 46, south: 30, east: 36, west: -6 }
    },
    {
      name: 'Red Sea',
      bounds: { north: 30, south: 12, east: 43, west: 32 }
    }
  ];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const url = userEmail 
        ? `/api/alerts/subscribe?email=${encodeURIComponent(userEmail)}`
        : '/api/alerts/subscribe';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.subscriptions) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!newSubscription.email.trim()) {
      alert('Email is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSubscription),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSubscriptions();
        setIsCreating(false);
        setNewSubscription({
          email: userEmail || '',
          alertTypes: ['marine_heatwave', 'temperature_spike'],
          thresholds: {
            temperature: 26,
            severity: 'medium' as const
          },
          zones: [{
            name: 'Custom Zone',
            bounds: {
              north: 20,
              south: -20,
              east: 20,
              west: -20
            }
          }]
        });
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (id: string, updates: Partial<AlertSubscription>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts/subscribe?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchSubscriptions();
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/alerts/subscribe?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSubscriptions();
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleZoneExpansion = (subscriptionId: string) => {
    setExpandedZones(prev => ({
      ...prev,
      [subscriptionId]: !prev[subscriptionId]
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const addPredefinedZone = (zoneName: string) => {
    const zone = predefinedZones.find(z => z.name === zoneName);
    if (zone) {
      setNewSubscription(prev => ({
        ...prev,
        zones: [...prev.zones, zone]
      }));
    }
  };

  const removeZone = (index: number) => {
    setNewSubscription(prev => ({
      ...prev,
      zones: prev.zones.filter((_, i) => i !== index)
    }));
  };

  const containerClass = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  return (
    <div className={`rounded-lg border ${containerClass} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${textClass}`}>
          Alert Subscriptions
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isCreating ? 'Cancel' : 'New Subscription'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {isCreating && (
        <div className={`rounded-lg border ${containerClass} p-4 mb-6`}>
          <h3 className={`text-lg font-medium mb-4 ${textClass}`}>Create New Subscription</h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Email Address
              </label>
              <input
                type="email"
                value={newSubscription.email}
                onChange={(e) => setNewSubscription(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Alert Types
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertTypeOptions.map(option => (
                  <label key={option.value} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={newSubscription.alertTypes.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewSubscription(prev => ({
                            ...prev,
                            alertTypes: [...prev.alertTypes, option.value]
                          }));
                        } else {
                          setNewSubscription(prev => ({
                            ...prev,
                            alertTypes: prev.alertTypes.filter(t => t !== option.value)
                          }));
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className={`font-medium ${textClass}`}>{option.label}</div>
                      <div className={`text-sm ${secondaryTextClass}`}>{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                  Temperature Threshold (°C)
                </label>
                <input
                  type="number"
                  value={newSubscription.thresholds.temperature}
                  onChange={(e) => setNewSubscription(prev => ({
                    ...prev,
                    thresholds: { ...prev.thresholds, temperature: parseFloat(e.target.value) }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                  step="0.1"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                  Minimum Severity
                </label>
                <select
                  value={newSubscription.thresholds.severity}
                  onChange={(e) => setNewSubscription(prev => ({
                    ...prev,
                    thresholds: { ...prev.thresholds, severity: e.target.value as any }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                >
                  {severityLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Monitoring Zones
              </label>
              
              <div className="mb-4">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addPredefinedZone(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                >
                  <option value="">Add predefined zone...</option>
                  {predefinedZones.map(zone => (
                    <option key={zone.name} value={zone.name}>{zone.name}</option>
                  ))}
                </select>
              </div>

              {newSubscription.zones.map((zone, index) => (
                <div key={index} className={`border rounded-lg p-3 mb-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => {
                        const newZones = [...newSubscription.zones];
                        newZones[index].name = e.target.value;
                        setNewSubscription(prev => ({ ...prev, zones: newZones }));
                      }}
                      className={`flex-1 px-2 py-1 border rounded ${inputClass} mr-2`}
                    />
                    <button
                      onClick={() => removeZone(index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <label className={secondaryTextClass}>North</label>
                      <input
                        type="number"
                        value={zone.bounds.north}
                        onChange={(e) => {
                          const newZones = [...newSubscription.zones];
                          newZones[index].bounds.north = parseFloat(e.target.value);
                          setNewSubscription(prev => ({ ...prev, zones: newZones }));
                        }}
                        className={`w-full px-2 py-1 border rounded ${inputClass}`}
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className={secondaryTextClass}>South</label>
                      <input
                        type="number"
                        value={zone.bounds.south}
                        onChange={(e) => {
                          const newZones = [...newSubscription.zones];
                          newZones[index].bounds.south = parseFloat(e.target.value);
                          setNewSubscription(prev => ({ ...prev, zones: newZones }));
                        }}
                        className={`w-full px-2 py-1 border rounded ${inputClass}`}
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className={secondaryTextClass}>East</label>
                      <input
                        type="number"
                        value={zone.bounds.east}
                        onChange={(e) => {
                          const newZones = [...newSubscription.zones];
                          newZones[index].bounds.east = parseFloat(e.target.value);
                          setNewSubscription(prev => ({ ...prev, zones: newZones }));
                        }}
                        className={`w-full px-2 py-1 border rounded ${inputClass}`}
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className={secondaryTextClass}>West</label>
                      <input
                        type="number"
                        value={zone.bounds.west}
                        onChange={(e) => {
                          const newZones = [...newSubscription.zones];
                          newZones[index].bounds.west = parseFloat(e.target.value);
                          setNewSubscription(prev => ({ ...prev, zones: newZones }));
                        }}
                        className={`w-full px-2 py-1 border rounded ${inputClass}`}
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={createSubscription}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Create Subscription
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {subscriptions.length === 0 && !loading && (
          <div className={`text-center py-8 ${secondaryTextClass}`}>
            No alert subscriptions found. Create one to get started!
          </div>
        )}

        {subscriptions.map(subscription => (
          <div key={subscription.id} className={`rounded-lg border ${containerClass} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`text-lg font-medium ${textClass}`}>
                  {subscription.email}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  subscription.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscription.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateSubscription(subscription.id, { active: !subscription.active })}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  {subscription.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deleteSubscription(subscription.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <div className={`text-sm font-medium ${secondaryTextClass} mb-1`}>Alert Types</div>
                <div className="flex flex-wrap gap-1">
                  {subscription.alertTypes.map(type => (
                    <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className={`text-sm font-medium ${secondaryTextClass} mb-1`}>Temperature Threshold</div>
                <div className={textClass}>{subscription.thresholds.temperature}°C</div>
              </div>

              <div>
                <div className={`text-sm font-medium ${secondaryTextClass} mb-1`}>Min Severity</div>
                <div className={`font-medium ${getSeverityColor(subscription.thresholds.severity)}`}>
                  {subscription.thresholds.severity.toUpperCase()}
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => toggleZoneExpansion(subscription.id)}
                className={`flex items-center space-x-2 text-sm font-medium ${secondaryTextClass} hover:${textClass} transition-colors`}
              >
                <span>Monitoring Zones ({subscription.zones.length})</span>
                {expandedZones[subscription.id] ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>

              {expandedZones[subscription.id] && (
                <div className="mt-2 space-y-2">
                  {subscription.zones.map((zone, index) => (
                    <div key={index} className={`p-2 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <div className={`font-medium ${textClass} mb-1`}>{zone.name}</div>
                      <div className={`text-sm ${secondaryTextClass} grid grid-cols-4 gap-2`}>
                        <div>N: {zone.bounds.north}°</div>
                        <div>S: {zone.bounds.south}°</div>
                        <div>E: {zone.bounds.east}°</div>
                        <div>W: {zone.bounds.west}°</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`text-xs ${secondaryTextClass} mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              Created: {new Date(subscription.createdAt).toLocaleDateString()}
              {subscription.lastTriggered && (
                <span className="ml-4">
                  Last Triggered: {new Date(subscription.lastTriggered).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertSubscriptionManager;