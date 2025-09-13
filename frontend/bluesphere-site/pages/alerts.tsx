import { useState } from 'react';
import Layout from '../components/Layout';
import AlertDashboard from '../components/AlertDashboard';
import AlertSubscriptionManager from '../components/AlertSubscriptionManager';
import NotificationManager from '../components/NotificationManager';
import UserPreferences from '../components/UserPreferences';

const AlertsPage = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions' | 'notifications' | 'preferences'>('dashboard');

  const tabClass = (isActive: boolean) =>
    `px-6 py-3 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`;

  const AlertsContent = () => (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Ocean Alert System
        </h1>
        <p className="text-lg text-gray-600">
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
          <button
            onClick={() => setActiveTab('preferences')}
            className={tabClass(activeTab === 'preferences')}
          >
            User Preferences
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'dashboard' && (
          <div>
            <AlertDashboard
              isDarkMode={false}
              showCompact={false}
            />
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div>
            <AlertSubscriptionManager
              isDarkMode={false}
              userEmail="user@example.com"
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <NotificationManager
              isDarkMode={false}
              userEmail="user@example.com"
            />
          </div>
        )}

        {activeTab === 'preferences' && (
          <div>
            <UserPreferences
              isDarkMode={false}
            />
          </div>
        )}
      </div>
    </>
  );

  return (
    <Layout title="Ocean Alert System - BlueSphere">
      <AlertsContent />
    </Layout>
  );
};

export default AlertsPage;