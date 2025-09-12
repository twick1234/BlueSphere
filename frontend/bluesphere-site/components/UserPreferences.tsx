import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, MapIcon, BellIcon, EyeIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  name: string;
  email: string;
  role: 'researcher' | 'conservationist' | 'policymaker' | 'educator' | 'student' | 'other';
  organization: string;
  location: {
    country: string;
    region: string;
  };
}

interface AlertZone {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  color: string;
  active: boolean;
  alertTypes: string[];
  description?: string;
}

interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  temperatureUnit: 'celsius' | 'fahrenheit';
  mapStyle: 'satellite' | 'terrain' | 'ocean' | 'minimal';
  showAnimations: boolean;
  compactMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

interface NotificationSettings {
  emailEnabled: boolean;
  browserEnabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  severityFilter: 'low' | 'medium' | 'high' | 'critical';
}

interface UserPreferencesProps {
  isDarkMode: boolean;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'zones' | 'display' | 'notifications'>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Dr. Ocean Researcher',
    email: 'researcher@marine.org',
    role: 'researcher',
    organization: 'Marine Conservation Institute',
    location: {
      country: 'United States',
      region: 'Pacific Coast'
    }
  });

  const [alertZones, setAlertZones] = useState<AlertZone[]>([
    {
      id: 'zone_1',
      name: 'Great Barrier Reef Monitor',
      bounds: { north: -10, south: -24, east: 154, west: 142 },
      color: '#FF6B6B',
      active: true,
      alertTypes: ['marine_heatwave', 'coral_bleaching_risk'],
      description: 'Critical monitoring zone for coral reef health'
    },
    {
      id: 'zone_2', 
      name: 'Caribbean Research Area',
      bounds: { north: 25, south: 9, east: -60, west: -87 },
      color: '#4ECDC4',
      active: true,
      alertTypes: ['temperature_spike', 'marine_heatwave'],
      description: 'Active research project monitoring zone'
    }
  ]);

  const [displayPrefs, setDisplayPrefs] = useState<DisplayPreferences>({
    theme: 'auto',
    temperatureUnit: 'celsius',
    mapStyle: 'satellite',
    showAnimations: true,
    compactMode: false,
    autoRefresh: true,
    refreshInterval: 30
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    browserEnabled: true,
    frequency: 'immediate',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '06:00'
    },
    severityFilter: 'medium'
  });

  const [isEditingZone, setIsEditingZone] = useState<string | null>(null);
  const [newZone, setNewZone] = useState<Partial<AlertZone>>({
    name: '',
    bounds: { north: 20, south: -20, east: 20, west: -20 },
    color: '#3B82F6',
    active: true,
    alertTypes: []
  });

  const mapRef = useRef<HTMLCanvasElement>(null);

  const countries = ['United States', 'Australia', 'United Kingdom', 'Canada', 'Japan', 'Germany', 'France', 'Brazil', 'Other'];
  const roles = ['researcher', 'conservationist', 'policymaker', 'educator', 'student', 'other'];
  const alertTypes = ['marine_heatwave', 'temperature_spike', 'anomaly_detected', 'coral_bleaching_risk'];
  const zoneColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F06292'];

  useEffect(() => {
    drawZonesMap();
  }, [alertZones, isDarkMode]);

  const drawZonesMap = () => {
    const canvas = mapRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Draw world map outline
    ctx.strokeStyle = isDarkMode ? '#4b5563' : '#d1d5db';
    ctx.lineWidth = 1;

    // Simplified continents
    const continents = [
      { x: 0.15, y: 0.2, w: 0.25, h: 0.35 }, // North America
      { x: 0.2, y: 0.45, w: 0.15, h: 0.4 },  // South America
      { x: 0.45, y: 0.15, w: 0.1, h: 0.2 },  // Europe
      { x: 0.45, y: 0.25, w: 0.15, h: 0.45 }, // Africa
      { x: 0.55, y: 0.1, w: 0.35, h: 0.4 },  // Asia
      { x: 0.75, y: 0.65, w: 0.15, h: 0.1 }  // Australia
    ];

    continents.forEach(continent => {
      ctx.fillStyle = isDarkMode ? '#374151' : '#e5e7eb';
      ctx.fillRect(
        continent.x * width,
        continent.y * height,
        continent.w * width,
        continent.h * height
      );
      ctx.strokeRect(
        continent.x * width,
        continent.y * height,
        continent.w * width,
        continent.h * height
      );
    });

    // Draw alert zones
    alertZones.forEach(zone => {
      if (!zone.active) return;

      // Convert lat/lon to canvas coordinates
      const x1 = ((zone.bounds.west + 180) / 360) * width;
      const y1 = ((90 - zone.bounds.north) / 180) * height;
      const x2 = ((zone.bounds.east + 180) / 360) * width;
      const y2 = ((90 - zone.bounds.south) / 180) * height;

      // Draw zone rectangle
      ctx.fillStyle = zone.color + '40'; // Add transparency
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

      // Draw zone border
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Draw zone label
      ctx.fillStyle = zone.color;
      ctx.font = '12px Arial';
      ctx.fillText(zone.name, x1 + 5, y1 + 15);
    });
  };

  const addNewZone = () => {
    if (!newZone.name) return;

    const zone: AlertZone = {
      id: `zone_${Date.now()}`,
      name: newZone.name,
      bounds: newZone.bounds!,
      color: newZone.color!,
      active: newZone.active!,
      alertTypes: newZone.alertTypes!,
      description: newZone.description
    };

    setAlertZones(prev => [...prev, zone]);
    setNewZone({
      name: '',
      bounds: { north: 20, south: -20, east: 20, west: -20 },
      color: '#3B82F6',
      active: true,
      alertTypes: []
    });
  };

  const updateZone = (id: string, updates: Partial<AlertZone>) => {
    setAlertZones(prev => prev.map(zone => 
      zone.id === id ? { ...zone, ...updates } : zone
    ));
  };

  const deleteZone = (id: string) => {
    if (confirm('Are you sure you want to delete this alert zone?')) {
      setAlertZones(prev => prev.filter(zone => zone.id !== id));
    }
  };

  const savePreferences = () => {
    // In a real app, this would save to a backend
    console.log('Saving preferences:', {
      userProfile,
      alertZones,
      displayPrefs,
      notificationSettings
    });
    
    alert('Preferences saved successfully!');
  };

  const containerClass = isDarkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const secondaryTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  const tabClass = (isActive: boolean) => 
    `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : isDarkMode
        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className={`rounded-lg border ${containerClass} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${textClass}`}>
          User Preferences & Alert Zones
        </h2>
        <button
          onClick={savePreferences}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save All Changes
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={tabClass(activeTab === 'profile')}
        >
          <UserIcon className="h-5 w-5" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={tabClass(activeTab === 'zones')}
        >
          <MapIcon className="h-5 w-5" />
          <span>Alert Zones</span>
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={tabClass(activeTab === 'display')}
        >
          <EyeIcon className="h-5 w-5" />
          <span>Display</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={tabClass(activeTab === 'notifications')}
        >
          <BellIcon className="h-5 w-5" />
          <span>Notifications</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <h3 className={`text-lg font-medium ${textClass}`}>User Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Full Name
              </label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Email Address
              </label>
              <input
                type="email"
                value={userProfile.email}
                onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Role
              </label>
              <select
                value={userProfile.role}
                onChange={(e) => setUserProfile(prev => ({ ...prev, role: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Organization
              </label>
              <input
                type="text"
                value={userProfile.organization}
                onChange={(e) => setUserProfile(prev => ({ ...prev, organization: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Country
              </label>
              <select
                value={userProfile.location.country}
                onChange={(e) => setUserProfile(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, country: e.target.value }
                }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Region
              </label>
              <input
                type="text"
                value={userProfile.location.region}
                onChange={(e) => setUserProfile(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, region: e.target.value }
                }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alert Zones Tab */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <h3 className={`text-lg font-medium ${textClass}`}>Alert Zones Management</h3>
          
          {/* Zone Map Preview */}
          <div className="mb-6">
            <canvas
              ref={mapRef}
              className={`w-full h-64 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
            />
          </div>

          {/* Existing Zones */}
          <div className="space-y-4">
            <h4 className={`font-medium ${textClass}`}>Active Alert Zones</h4>
            {alertZones.map(zone => (
              <div
                key={zone.id}
                className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className={`font-medium ${textClass}`}>{zone.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      zone.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {zone.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateZone(zone.id, { active: !zone.active })}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      {zone.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteZone(zone.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className={`text-sm ${secondaryTextClass} mb-2`}>
                  {zone.description}
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>N: {zone.bounds.north}°</div>
                  <div>S: {zone.bounds.south}°</div>
                  <div>E: {zone.bounds.east}°</div>
                  <div>W: {zone.bounds.west}°</div>
                </div>
                
                <div className="mt-2">
                  <div className={`text-xs ${secondaryTextClass} mb-1`}>Alert Types:</div>
                  <div className="flex flex-wrap gap-1">
                    {zone.alertTypes.map(type => (
                      <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Zone */}
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
            <h4 className={`font-medium mb-4 ${textClass}`}>Add New Alert Zone</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${secondaryTextClass}`}>
                  Zone Name
                </label>
                <input
                  type="text"
                  value={newZone.name || ''}
                  onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${secondaryTextClass}`}>
                  Color
                </label>
                <div className="flex space-x-2">
                  {zoneColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewZone(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newZone.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <div>
                <label className={`block text-xs ${secondaryTextClass}`}>North</label>
                <input
                  type="number"
                  value={newZone.bounds?.north || 0}
                  onChange={(e) => setNewZone(prev => ({ 
                    ...prev, 
                    bounds: { ...prev.bounds!, north: parseFloat(e.target.value) }
                  }))}
                  className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-xs ${secondaryTextClass}`}>South</label>
                <input
                  type="number"
                  value={newZone.bounds?.south || 0}
                  onChange={(e) => setNewZone(prev => ({ 
                    ...prev, 
                    bounds: { ...prev.bounds!, south: parseFloat(e.target.value) }
                  }))}
                  className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-xs ${secondaryTextClass}`}>East</label>
                <input
                  type="number"
                  value={newZone.bounds?.east || 0}
                  onChange={(e) => setNewZone(prev => ({ 
                    ...prev, 
                    bounds: { ...prev.bounds!, east: parseFloat(e.target.value) }
                  }))}
                  className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-xs ${secondaryTextClass}`}>West</label>
                <input
                  type="number"
                  value={newZone.bounds?.west || 0}
                  onChange={(e) => setNewZone(prev => ({ 
                    ...prev, 
                    bounds: { ...prev.bounds!, west: parseFloat(e.target.value) }
                  }))}
                  className={`w-full px-2 py-1 text-sm border rounded ${inputClass}`}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Alert Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {alertTypes.map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newZone.alertTypes?.includes(type) || false}
                      onChange={(e) => {
                        const types = newZone.alertTypes || [];
                        if (e.target.checked) {
                          setNewZone(prev => ({ 
                            ...prev, 
                            alertTypes: [...types, type]
                          }));
                        } else {
                          setNewZone(prev => ({ 
                            ...prev, 
                            alertTypes: types.filter(t => t !== type)
                          }));
                        }
                      }}
                    />
                    <span className={`text-sm ${textClass}`}>
                      {type.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={addNewZone}
              disabled={!newZone.name}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add Zone
            </button>
          </div>
        </div>
      )}

      {/* Display Preferences Tab */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          <h3 className={`text-lg font-medium ${textClass}`}>Display Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Theme
              </label>
              <select
                value={displayPrefs.theme}
                onChange={(e) => setDisplayPrefs(prev => ({ ...prev, theme: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Temperature Unit
              </label>
              <select
                value={displayPrefs.temperatureUnit}
                onChange={(e) => setDisplayPrefs(prev => ({ ...prev, temperatureUnit: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Map Style
              </label>
              <select
                value={displayPrefs.mapStyle}
                onChange={(e) => setDisplayPrefs(prev => ({ ...prev, mapStyle: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              >
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
                <option value="ocean">Ocean</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Auto-Refresh Interval (seconds)
              </label>
              <select
                value={displayPrefs.refreshInterval}
                onChange={(e) => setDisplayPrefs(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                disabled={!displayPrefs.autoRefresh}
              >
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={displayPrefs.showAnimations}
                onChange={(e) => setDisplayPrefs(prev => ({ ...prev, showAnimations: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className={textClass}>Show animations and transitions</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={displayPrefs.compactMode}
                onChange={(e) => setDisplayPrefs(prev => ({ ...prev, compactMode: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className={textClass}>Compact mode (less spacing)</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={displayPrefs.autoRefresh}
                onChange={(e) => setDisplayPrefs(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className={textClass}>Auto-refresh data</span>
            </label>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <h3 className={`text-lg font-medium ${textClass}`}>Notification Settings</h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notificationSettings.emailEnabled}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className={textClass}>Email notifications</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notificationSettings.browserEnabled}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, browserEnabled: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className={textClass}>Browser notifications</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Notification Frequency
              </label>
              <select
                value={notificationSettings.frequency}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, frequency: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly digest</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${secondaryTextClass}`}>
                Minimum Severity Level
              </label>
              <select
                value={notificationSettings.severityFilter}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, severityFilter: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
              >
                <option value="low">Low and above</option>
                <option value="medium">Medium and above</option>
                <option value="high">High and above</option>
                <option value="critical">Critical only</option>
              </select>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
            <label className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                checked={notificationSettings.quietHours.enabled}
                onChange={(e) => setNotificationSettings(prev => ({ 
                  ...prev, 
                  quietHours: { ...prev.quietHours, enabled: e.target.checked }
                }))}
                className="w-4 h-4"
              />
              <span className={textClass}>Enable quiet hours</span>
            </label>

            {notificationSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${secondaryTextClass}`}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={notificationSettings.quietHours.start}
                    onChange={(e) => setNotificationSettings(prev => ({ 
                      ...prev, 
                      quietHours: { ...prev.quietHours, start: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${secondaryTextClass}`}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={notificationSettings.quietHours.end}
                    onChange={(e) => setNotificationSettings(prev => ({ 
                      ...prev, 
                      quietHours: { ...prev.quietHours, end: e.target.value }
                    }))}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPreferences;