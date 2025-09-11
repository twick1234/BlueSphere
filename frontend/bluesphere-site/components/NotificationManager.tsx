import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PlayIcon } from '@heroicons/react/24/outline';

interface NotificationHistory {
  id: string;
  subscriptionId: string;
  alertId: string;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sentAt?: string;
  failureReason?: string;
  retryCount: number;
  alertData?: {
    type: string;
    severity: string;
    title: string;
    location: {
      name: string;
      lat: number;
      lon: number;
    };
  };
}

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  pending: number;
  totalRetries: number;
  averageRetries: string;
  successRate: string;
}

interface NotificationManagerProps {
  isDarkMode: boolean;
  userEmail?: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  isDarkMode, 
  userEmail 
}) => {
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<{ [key: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [testNotificationEmail, setTestNotificationEmail] = useState(userEmail || '');

  useEffect(() => {
    fetchNotificationHistory();
  }, [statusFilter]);

  const fetchNotificationHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (userEmail) {
        params.append('email', userEmail);
      }

      const response = await fetch(`/api/notifications/history?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAlerts = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/alerts/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceProcess: true }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Processing complete! Sent ${result.summary.notificationsSent} notifications from ${result.summary.totalMatches} matches.`);
        await fetchNotificationHistory();
      } else {
        alert(`Processing failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to process alerts:', error);
      alert('Failed to process alerts');
    } finally {
      setProcessing(false);
    }
  };

  const sendTestNotification = async () => {
    if (!testNotificationEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      setProcessing(true);
      const testNotification = {
        subscriptionId: 'test_subscription',
        alertId: 'test_alert',
        email: testNotificationEmail,
        alertData: {
          type: 'marine_heatwave',
          severity: 'high',
          title: 'Test Alert - System Check',
          description: 'This is a test notification to verify your alert settings.',
          location: {
            name: 'Test Location',
            lat: 0,
            lon: 0
          },
          data: {
            temperature: 28.5,
            threshold: 26.0,
            trend: 'increasing'
          },
          impact: {
            ecosystemRisk: 'Test ecosystem risk assessment',
            affectedSpecies: ['Test Species'],
            recommendations: ['This is a test notification - no action required']
          }
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notifications: [testNotification],
          priority: 'normal'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.summary.sent > 0) {
        alert('Test notification sent successfully!');
        await fetchNotificationHistory();
      } else {
        alert(`Test notification failed: ${result.results?.[0]?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Failed to send test notification');
    } finally {
      setProcessing(false);
    }
  };

  const toggleNotificationExpansion = (notificationId: string) => {
    setExpandedNotifications(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'bounced': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100';
      case 'failed': return 'bg-red-100';
      case 'bounced': return 'bg-orange-100';
      case 'pending': return 'bg-yellow-100';
      default: return 'bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
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
          Notification Management
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={processAlerts}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <PlayIcon className="h-4 w-4" />
            <span>{processing ? 'Processing...' : 'Process Alerts'}</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${textClass}`}>{stats.total}</div>
            <div className={`text-sm ${secondaryTextClass}`}>Total</div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className={`text-sm ${secondaryTextClass}`}>Sent</div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className={`text-sm ${secondaryTextClass}`}>Failed</div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="text-2xl font-bold text-orange-600">{stats.bounced}</div>
            <div className={`text-sm ${secondaryTextClass}`}>Bounced</div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className={`text-sm ${secondaryTextClass}`}>Pending</div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${textClass}`}>{stats.averageRetries}</div>
            <div className={`text-sm ${secondaryTextClass}`}>Avg Retries</div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="text-2xl font-bold text-blue-600">{stats.successRate}</div>
            <div className={`text-sm ${secondaryTextClass}`}>Success Rate</div>
          </div>
        </div>
      )}

      {/* Test Notification */}
      <div className={`rounded-lg border ${containerClass} p-4 mb-6`}>
        <h3 className={`text-lg font-medium mb-3 ${textClass}`}>Test Notification</h3>
        <div className="flex space-x-3">
          <input
            type="email"
            value={testNotificationEmail}
            onChange={(e) => setTestNotificationEmail(e.target.value)}
            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
            placeholder="Enter email address for test notification"
          />
          <button
            onClick={sendTestNotification}
            disabled={processing || !testNotificationEmail.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Send Test
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <label className={`text-sm font-medium ${secondaryTextClass}`}>
          Filter by status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`}
        >
          <option value="all">All</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="bounced">Bounced</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {/* Notification History */}
      <div className="space-y-3">
        {history.length === 0 && !loading && (
          <div className={`text-center py-8 ${secondaryTextClass}`}>
            No notifications found for the selected criteria.
          </div>
        )}

        {history.map(notification => (
          <div key={notification.id} className={`rounded-lg border ${containerClass} p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(notification.status)} ${getStatusColor(notification.status)}`}>
                  {notification.status.toUpperCase()}
                </span>
                <span className={`font-medium ${textClass}`}>{notification.email}</span>
                {notification.alertData && (
                  <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(notification.alertData.severity)} font-medium`}>
                    {notification.alertData.severity.toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {notification.sentAt && (
                  <span className={`text-sm ${secondaryTextClass}`}>
                    {new Date(notification.sentAt).toLocaleString()}
                  </span>
                )}
                {notification.retryCount > 0 && (
                  <span className={`text-sm ${secondaryTextClass}`}>
                    Retries: {notification.retryCount}
                  </span>
                )}
                <button
                  onClick={() => toggleNotificationExpansion(notification.id)}
                  className={`${secondaryTextClass} hover:${textClass} transition-colors`}
                >
                  {expandedNotifications[notification.id] ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {expandedNotifications[notification.id] && (
              <div className="mt-4 space-y-3">
                {notification.alertData && (
                  <div>
                    <div className={`font-medium ${textClass} mb-1`}>
                      {notification.alertData.title}
                    </div>
                    <div className={`text-sm ${secondaryTextClass} mb-2`}>
                      {notification.alertData.location.name} ({notification.alertData.location.lat}, {notification.alertData.location.lon})
                    </div>
                    <div className={`text-sm ${secondaryTextClass}`}>
                      Type: {notification.alertData.type.replace('_', ' ')}
                    </div>
                  </div>
                )}
                
                {notification.failureReason && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Failure Reason:</span> {notification.failureReason}
                    </div>
                  </div>
                )}

                <div className={`text-xs ${secondaryTextClass} pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  Subscription ID: {notification.subscriptionId} | Alert ID: {notification.alertId}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationManager;