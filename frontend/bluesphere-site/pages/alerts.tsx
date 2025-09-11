import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import AlertDashboard from '../components/AlertDashboard';
import AlertSubscriptionManager from '../components/AlertSubscriptionManager';
import NotificationManager from '../components/NotificationManager';

const AlertsPage = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions' | 'notifications'>('dashboard');

  const containerClass = isDarkMode 
    ? 'bg-gray-900 min-h-screen' 
    : 'bg-gray-50 min-h-screen';
  
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  
  const tabClass = (isActive: boolean) => 
    `px-6 py-3 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : isDarkMode
        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className={containerClass}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-4 ${textClass}`}>
              Ocean Alert System
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Monitor critical ocean conditions and manage your alert preferences
            </p>
          </div>

          <div className="mb-8">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={tabClass(activeTab === 'dashboard')}
              >
                Active Alerts Dashboard
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={tabClass(activeTab === 'subscriptions')}
              >
                Manage Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={tabClass(activeTab === 'notifications')}
              >
                Notification Management
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {activeTab === 'dashboard' && (
              <div>
                <AlertDashboard 
                  isDarkMode={isDarkMode} 
                  showCompact={false}
                />
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <AlertSubscriptionManager 
                  isDarkMode={isDarkMode}
                  userEmail="user@example.com"
                />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <NotificationManager 
                  isDarkMode={isDarkMode}
                  userEmail="user@example.com"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;