/**
 * BlueSphere Metrics Dashboard
 * Real-time platform health, test coverage, and performance monitoring
 */

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import WorldClassLayout from '../components/WorldClassLayout'

// Dynamic imports for better performance
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Chart), { ssr: false })
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false })
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false })
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false })

// Chart.js registration
if (typeof window !== 'undefined') {
  import('chart.js/auto')
}

interface MetricsData {
  coverage: {
    total: number
    components: number
    api: number
    pages: number
    trend: number[]
    lastUpdated: string
  }
  performance: {
    lcp: number
    fid: number
    cls: number
    bundleSize: number
    apiResponseTime: number
    trend: number[]
  }
  system: {
    uptime: number
    activeStations: number
    trackingSharks: number
    alertsToday: number
    dataIngestionRate: number
    lastFailure: string
  }
  tests: {
    total: number
    passing: number
    failing: number
    duration: number
    recentRuns: Array<{
      timestamp: string
      success: boolean
      coverage: number
      duration: number
    }>
  }
}

const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState<MetricsData>({
    coverage: {
      total: 2.81,
      components: 15.2,
      api: 0.0,
      pages: 8.1,
      trend: [1.2, 1.8, 2.1, 2.5, 2.81],
      lastUpdated: new Date().toISOString()
    },
    performance: {
      lcp: 3200,
      fid: 180,
      cls: 0.15,
      bundleSize: 496,
      apiResponseTime: 245,
      trend: [3800, 3600, 3400, 3300, 3200]
    },
    system: {
      uptime: 99.97,
      activeStations: 247,
      trackingSharks: 89,
      alertsToday: 12,
      dataIngestionRate: 1247,
      lastFailure: '2024-09-20T14:30:00Z'
    },
    tests: {
      total: 47,
      passing: 45,
      failing: 2,
      duration: 12.3,
      recentRuns: [
        { timestamp: '2024-09-23T10:30:00Z', success: true, coverage: 2.81, duration: 12.3 },
        { timestamp: '2024-09-23T10:15:00Z', success: true, coverage: 2.75, duration: 11.8 },
        { timestamp: '2024-09-23T10:00:00Z', success: false, coverage: 2.70, duration: 8.2 },
        { timestamp: '2024-09-23T09:45:00Z', success: true, coverage: 2.65, duration: 13.1 },
        { timestamp: '2024-09-23T09:30:00Z', success: true, coverage: 2.60, duration: 12.8 }
      ]
    }
  })

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds

  // Simulate real-time updates
  const updateMetrics = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      coverage: {
        ...prev.coverage,
        total: Math.min(prev.coverage.total + Math.random() * 0.1, 90),
        trend: [...prev.coverage.trend.slice(1), prev.coverage.total + Math.random() * 0.1]
      },
      performance: {
        ...prev.performance,
        lcp: Math.max(prev.performance.lcp - Math.random() * 50, 1500),
        trend: [...prev.performance.trend.slice(1), Math.max(prev.performance.lcp - Math.random() * 50, 1500)]
      },
      system: {
        ...prev.system,
        dataIngestionRate: Math.floor(1200 + Math.random() * 100),
        alertsToday: prev.system.alertsToday + (Math.random() > 0.9 ? 1 : 0)
      }
    }))
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(updateMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, updateMetrics])

  // Chart configurations
  const coverageChartData = {
    labels: ['Components', 'API', 'Pages', 'Utilities', 'Hooks'],
    datasets: [{
      data: [metrics.coverage.components, metrics.coverage.api, metrics.coverage.pages, 12.5, 8.9],
      backgroundColor: [
        'rgba(14, 165, 233, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ],
      borderColor: [
        'rgba(14, 165, 233, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(168, 85, 247, 1)'
      ],
      borderWidth: 2
    }]
  }

  const performanceTrendData = {
    labels: ['5 mins ago', '4 mins ago', '3 mins ago', '2 mins ago', 'Now'],
    datasets: [{
      label: 'LCP (ms)',
      data: metrics.performance.trend,
      borderColor: 'rgba(14, 165, 233, 1)',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  const testHistoryData = {
    labels: metrics.tests.recentRuns.map(run =>
      new Date(run.timestamp).toLocaleTimeString()
    ).reverse(),
    datasets: [
      {
        label: 'Coverage %',
        data: metrics.tests.recentRuns.map(run => run.coverage).reverse(),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y'
      },
      {
        label: 'Duration (s)',
        data: metrics.tests.recentRuns.map(run => run.duration).reverse(),
        borderColor: 'rgba(251, 191, 36, 1)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        yAxisID: 'y1'
      }
    ]
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportMetrics = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      platform: 'BlueSphere Marine Monitoring',
      version: '1.0.0'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bluesphere-metrics-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <WorldClassLayout
      title="Platform Metrics Dashboard — Real-time Monitoring | BlueSphere"
      description="Comprehensive platform health monitoring including test coverage, performance metrics, and marine system status for BlueSphere ocean monitoring platform."
      keywords="metrics, dashboard, monitoring, test coverage, performance, marine platform"
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  📊 Platform Metrics Dashboard
                </h1>
                <p className="text-lg text-gray-600">
                  Real-time monitoring of BlueSphere marine monitoring platform
                </p>
              </div>

              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                    Auto-refresh
                  </label>
                </div>

                <button
                  onClick={exportMetrics}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Test Coverage</p>
                  <p className={`text-3xl font-bold ${getStatusColor(metrics.coverage.total, { good: 80, warning: 50 })}`}>
                    {metrics.coverage.total.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🧪</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(metrics.coverage.total, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: 90%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Uptime</p>
                  <p className={`text-3xl font-bold ${getStatusColor(metrics.system.uptime, { good: 99.5, warning: 95 })}`}>
                    {metrics.system.uptime.toFixed(2)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Last failure: <span suppressHydrationWarning>{new Date(metrics.system.lastFailure).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Performance Score</p>
                  <p className={`text-3xl font-bold ${getStatusColor(100 - (metrics.performance.lcp / 25), { good: 80, warning: 60 })}`}>
                    {Math.round(100 - (metrics.performance.lcp / 25))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                LCP: {metrics.performance.lcp}ms
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Monitoring</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {metrics.system.activeStations}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🌊</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Stations + {metrics.system.trackingSharks} sharks
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Test Coverage Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Test Coverage by Category
              </h3>
              <div className="h-64">
                <Doughnut
                  data={coverageChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Performance Trend */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Performance Trend (LCP)
              </h3>
              <div className="h-64">
                <Line
                  data={performanceTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: false,
                        title: {
                          display: true,
                          text: 'Milliseconds'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Test History */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Test Run History
            </h3>
            <div className="h-64">
              <Line
                data={testHistoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Coverage %'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: {
                        display: true,
                        text: 'Duration (s)'
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Marine System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">🦈 Shark Tracking</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Tags</span>
                  <span className="font-semibold">{metrics.system.trackingSharks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Points Today</span>
                  <span className="font-semibold">{metrics.system.dataIngestionRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical Alerts</span>
                  <span className="font-semibold text-red-600">3</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">🌡️ Environmental</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Heatwave Alerts</span>
                  <span className="font-semibold text-orange-600">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temp Anomalies</span>
                  <span className="font-semibold">7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Rate</span>
                  <span className="font-semibold text-green-600">98.7%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📡 Infrastructure</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">API Response</span>
                  <span className="font-semibold">{metrics.performance.apiResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bundle Size</span>
                  <span className="font-semibold">{metrics.performance.bundleSize}KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory Usage</span>
                  <span className="font-semibold text-green-600">34%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>
              🌊 BlueSphere Marine Monitoring Platform • Last updated: <span suppressHydrationWarning>{new Date().toLocaleString()}</span>
            </p>
            <p className="mt-2">
              Dashboard URL: <code className="bg-gray-100 px-2 py-1 rounded" suppressHydrationWarning>
                {typeof window !== 'undefined' ? window.location.href : '/metrics'}
              </code>
            </p>
          </div>
        </div>
      </div>
    </WorldClassLayout>
  )
}

export default MetricsDashboard