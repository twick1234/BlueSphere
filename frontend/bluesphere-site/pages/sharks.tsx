/*
 * BlueSphere Shark Tracking Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import SharkProfile from '../components/SharkProfile';
import { SharkData, SharkProfile as SharkProfileData } from '../lib/shark-tracking';

// Dynamically import the enhanced shark map to avoid SSR issues
const EnhancedSharkMap = dynamic(() => import('../components/EnhancedSharkMap'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="loading-spinner"></div>
      <p>Loading shark tracker...</p>
    </div>
  )
});

// For compatibility with existing SharkProfile component, create a simple adapter
interface TrackedShark {
  id: string;
  name: string;
  species: string;
  length: number;
  weight?: number;
  sex: 'male' | 'female' | 'unknown';
  tagDate: string;
  lastPing: string;
  lat: number;
  lon: number;
  status: 'active' | 'inactive' | 'missing';
  totalDistance: number;
  daysSinceTag: number;
  pings: number;
}

const SharksPage = () => {
  const [selectedShark, setSelectedShark] = useState<TrackedShark | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats'>('map');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Simulated shark tracking data - in production this would come from OCEARCH API
  const trackedSharks: TrackedShark[] = [
    {
      id: 'mary-lee',
      name: 'Mary Lee',
      species: 'Great White Shark',
      length: 16,
      weight: 3456,
      sex: 'female',
      tagDate: '2012-09-17',
      lastPing: '2024-03-15T14:30:00Z',
      lat: 40.7589,
      lon: -73.9851,
      status: 'active',
      totalDistance: 40000,
      daysSinceTag: 4200,
      pings: 2847
    },
    {
      id: 'unama',
      name: 'Unama\'aki',
      species: 'Great White Shark',
      length: 15,
      weight: 2076,
      sex: 'male',
      tagDate: '2019-10-05',
      lastPing: '2024-03-14T09:15:00Z',
      lat: 44.2619,
      lon: -65.0237,
      status: 'active',
      totalDistance: 18500,
      daysSinceTag: 1600,
      pings: 1523
    },
    {
      id: 'nukumi',
      name: 'Nukumi',
      species: 'Great White Shark',
      length: 17.2,
      weight: 3541,
      sex: 'female',
      tagDate: '2020-10-02',
      lastPing: '2024-03-12T16:45:00Z',
      lat: 35.2271,
      lon: -75.5449,
      status: 'active',
      totalDistance: 25000,
      daysSinceTag: 1260,
      pings: 1887
    },
    {
      id: 'breton',
      name: 'Breton',
      species: 'Great White Shark',
      length: 13,
      weight: 1437,
      sex: 'male',
      tagDate: '2020-09-12',
      lastPing: '2024-02-28T11:20:00Z',
      lat: 27.7663,
      lon: -82.6404,
      status: 'inactive',
      totalDistance: 15200,
      daysSinceTag: 1280,
      pings: 943
    },
    {
      id: 'yeti',
      name: 'Yeti',
      species: 'Great White Shark',
      length: 12,
      weight: 1200,
      sex: 'male',
      tagDate: '2021-03-18',
      lastPing: '2024-03-10T08:30:00Z',
      lat: 33.8734,
      lon: -78.8861,
      status: 'active',
      totalDistance: 12800,
      daysSinceTag: 1090,
      pings: 756
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredSharks = trackedSharks.filter(shark => {
    const statusMatch = filterStatus === 'all' || shark.status === filterStatus;
    const searchMatch = searchQuery === '' ||
      shark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shark.species.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-500';
      case 'inactive': return 'text-yellow-600 bg-yellow-100 border-yellow-500';
      case 'missing': return 'text-red-600 bg-red-100 border-red-500';
      default: return 'text-gray-600 bg-gray-100 border-gray-500';
    }
  };

  const formatDistance = (distance: number) => {
    return `${(distance / 1000).toLocaleString()} km`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysSinceLastPing = (lastPing: string) => {
    const now = new Date();
    const pingDate = new Date(lastPing);
    const diffTime = Math.abs(now.getTime() - pingDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <Layout title="Shark Tracker - BlueSphere">
        <div className="loading-container">
          <div className="loading-content">
            <div className="shark-loading-icon">🦈</div>
            <h2>Loading Shark Tracker...</h2>
            <p>Connecting to OCEARCH network and satellite tracking systems</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
            color: white;
            text-align: center;
          }
          .loading-content {
            max-width: 400px;
            padding: 2rem;
          }
          .shark-loading-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: swim 2s ease-in-out infinite;
          }
          .loading-content h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 700;
          }
          .loading-content p {
            opacity: 0.9;
            margin-bottom: 2rem;
          }
          .loading-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            overflow: hidden;
          }
          .loading-progress {
            height: 100%;
            background: white;
            width: 70%;
            animation: progress 2s ease-in-out infinite;
          }
          @keyframes swim {
            0%, 100% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
          }
          @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </Layout>
    );
  }

  return (
    <>
      <style jsx>{`
        .hero-section {
          background: linear-gradient(135deg,
            #0ea5e9 0%,
            #3b82f6 25%,
            #1e40af 50%,
            #0f172a 100%
          );
          color: white;
          padding: 4rem 0;
          margin: -24px -16px 0;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-effects {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 30% 80%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ffffff, #e0f2fe, #b3e5fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .stats-banner {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem auto 0;
          max-width: 600px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          text-align: center;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 12px;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          display: block;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.8rem;
          opacity: 0.9;
        }

        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .control-panel {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1rem;
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          background: #f1f5f9;
          color: #3b82f6;
        }

        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }

        .filters {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 50px;
          font-size: 0.95rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .status-filter {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 50px;
          background: white;
          font-weight: 600;
          cursor: pointer;
        }

        .content-area {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }

        .map-container {
          height: 600px;
          position: relative;
        }

        .shark-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          padding: 2rem;
        }

        .shark-card {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .shark-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .shark-header {
          display: flex;
          justify-content: between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .shark-info {
          flex: 1;
        }

        .shark-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .shark-species {
          color: #3b82f6;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .shark-status {
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
        }

        .shark-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .stat {
          text-align: center;
          background: rgba(59, 130, 246, 0.05);
          padding: 0.5rem;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .stat-value {
          font-weight: 700;
          color: #3b82f6;
          font-size: 0.9rem;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .shark-details {
          margin-top: 1rem;
          font-size: 0.85rem;
          color: #64748b;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .quick-links {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin: 2rem 0;
          flex-wrap: wrap;
        }

        .link-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .link-btn:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-2px);
          text-decoration: none;
          color: white;
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1rem;
          }

          .tabs {
            overflow-x: auto;
            white-space: nowrap;
          }

          .filters {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            min-width: auto;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .shark-list {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .quick-links {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <Layout title="Shark Tracker - Real-time Marine Life Monitoring">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-effects"></div>
          <div className="hero-content">
            <h1 className="hero-title">🦈 Live Shark Tracker</h1>
            <p className="hero-subtitle">
              Follow tagged sharks in real-time as they navigate our oceans.
              Track their movements, behavior patterns, and contribute to marine research
              through our OCEARCH integration.
            </p>

            <div className="stats-banner">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{trackedSharks.filter(s => s.status === 'active').length}</span>
                  <span className="stat-label">Active Sharks</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{trackedSharks.reduce((sum, s) => sum + s.pings, 0).toLocaleString()}</span>
                  <span className="stat-label">Total Pings</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{Math.round(trackedSharks.reduce((sum, s) => sum + s.totalDistance, 0) / 1000).toLocaleString()}km</span>
                  <span className="stat-label">Distance Tracked</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="main-content">
          {/* Control Panel */}
          <div className="control-panel">
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                🗺️ Live Map
              </button>
              <button
                className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                📋 Shark List
              </button>
              <button
                className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                📊 Statistics
              </button>
            </div>

            <div className="filters">
              <input
                type="text"
                placeholder="Search sharks by name or species..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="missing">Missing</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {activeTab === 'map' && (
              <div className="map-container">
                <EnhancedSharkMap
                  sharks={filteredSharks}
                  onSharkSelect={setSelectedShark}
                  selectedShark={selectedShark}
                />
              </div>
            )}

            {activeTab === 'list' && (
              <div className="shark-list">
                {filteredSharks.map((shark) => (
                  <div
                    key={shark.id}
                    className="shark-card"
                    onClick={() => setSelectedShark(shark)}
                  >
                    <div className="shark-header">
                      <div className="shark-info">
                        <div className="shark-name">{shark.name}</div>
                        <div className="shark-species">{shark.species}</div>
                        <div className={`shark-status ${getStatusColor(shark.status)}`}>
                          {shark.status.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="shark-stats">
                      <div className="stat">
                        <div className="stat-value">{shark.length}ft</div>
                        <div className="stat-label">Length</div>
                      </div>
                      <div className="stat">
                        <div className="stat-value">{shark.pings}</div>
                        <div className="stat-label">Pings</div>
                      </div>
                      <div className="stat">
                        <div className="stat-value">{formatDistance(shark.totalDistance)}</div>
                        <div className="stat-label">Distance</div>
                      </div>
                      <div className="stat">
                        <div className="stat-value">{getDaysSinceLastPing(shark.lastPing)}d</div>
                        <div className="stat-label">Last Seen</div>
                      </div>
                    </div>

                    <div className="shark-details">
                      <div className="detail-row">
                        <span>Tagged:</span>
                        <span>{formatDate(shark.tagDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Sex:</span>
                        <span>{shark.sex}</span>
                      </div>
                      {shark.weight && (
                        <div className="detail-row">
                          <span>Weight:</span>
                          <span>{shark.weight} lbs</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'stats' && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊 Tracking Statistics</h3>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                  Comprehensive analytics and insights from our shark tracking network
                </p>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
                <p style={{ color: '#64748b' }}>
                  Advanced statistics dashboard coming soon! This will include migration patterns,
                  depth analysis, temperature preferences, and behavioral insights.
                </p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="quick-links">
            <a href="/map" className="link-btn">
              🌊 Ocean Map
            </a>
            <a href="/stories" className="link-btn">
              📚 Shark Stories
            </a>
            <a href="/gallery" className="link-btn">
              📸 Photo Gallery
            </a>
            <a href="/conservation" className="link-btn">
              🛡️ Conservation Actions
            </a>
          </div>
        </div>

        {/* Shark Profile Modal */}
        {selectedShark && (
          <SharkProfile
            profile={{
              id: selectedShark.id,
              name: selectedShark.name,
              nickname: undefined,
              species: selectedShark.species,
              species_common_name: selectedShark.species,
              sex: selectedShark.sex === 'female' ? 'F' : selectedShark.sex === 'male' ? 'M' : 'Unknown',
              length_m: selectedShark.length,
              weight_kg: selectedShark.weight,
              tag_date: selectedShark.tagDate,
              tag_location: 'Unknown',
              tag_organization: 'OCEARCH',
              research_program: 'Shark Tracking Network',
              conservation_status: 'Unknown',
              last_ping: selectedShark.lastPing,
              current_location: {
                lat: selectedShark.lat,
                lon: selectedShark.lon,
                description: 'Current Location'
              }
            }}
            onClose={() => setSelectedShark(null)}
          />
        )}
      </Layout>
    </>
  );
};

export default SharksPage;