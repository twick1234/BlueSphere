/*
 * BlueSphere Shark Tracking Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import SharkProfile from '../components/SharkProfile';
import { SharkData, SharkProfile as SharkProfileData, OCEARCHService, sharkTracker } from '../lib/shark-tracking';

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

// Convert TrackedShark to SharkData interface
const convertToSharkData = (shark: TrackedShark): SharkData => ({
  id: shark.id,
  name: shark.name,
  species: shark.species,
  sex: shark.sex === 'male' ? 'M' : shark.sex === 'female' ? 'F' : 'Unknown',
  length_m: shark.length,
  weight_kg: shark.weight,
  tag_date: shark.tagDate,
  last_ping: shark.lastPing,
  lat: shark.lat,
  lon: shark.lon,
  tracking_organization: 'BlueSphere Network',
  confidence_level: 'High' as const,
  status: shark.status === 'active' ? 'Active' : shark.status === 'inactive' ? 'Inactive' : 'Lost_Signal'
});

// Convert SharkData back to TrackedShark for state management
const convertFromSharkData = (sharkData: SharkData): TrackedShark => ({
  id: sharkData.id,
  name: sharkData.name,
  species: sharkData.species,
  length: sharkData.length_m,
  weight: sharkData.weight_kg,
  sex: sharkData.sex === 'M' ? 'male' : sharkData.sex === 'F' ? 'female' : 'unknown',
  tagDate: sharkData.tag_date,
  lastPing: sharkData.last_ping,
  lat: sharkData.lat,
  lon: sharkData.lon,
  status: sharkData.status === 'Active' ? 'active' : sharkData.status === 'Inactive' ? 'inactive' : 'missing',
  totalDistance: Math.floor(Math.random() * 50000), // Simulated distance
  daysSinceTag: Math.floor((Date.now() - new Date(sharkData.tag_date).getTime()) / (1000 * 60 * 60 * 24)),
  pings: Math.floor(Math.random() * 3000) + 100 // Simulated pings
});

const SharksPage = () => {
  const [selectedShark, setSelectedShark] = useState<TrackedShark | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats'>('map');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [trackedSharks, setTrackedSharks] = useState<TrackedShark[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    // Load sharks from our comprehensive database
    const loadSharks = async () => {
      try {
        setIsLoading(true);
        console.log('Loading shark data from OCEARCHService...');

        const sharkData = await OCEARCHService.getTrackedSharks();
        console.log(`Received ${sharkData.length} sharks from service`);

        // Convert SharkData to TrackedShark format for this page
        const convertedSharks = sharkData.map(convertFromSharkData);

        setTrackedSharks(convertedSharks);
        console.log(`Successfully loaded ${convertedSharks.length} tracked sharks`);
      } catch (error) {
        console.error('Failed to load shark data:', error);
        // Fallback to empty array on error
        setTrackedSharks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSharks();
  }, []);

  // Real-time updates subscription
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = sharkTracker.subscribeToUpdates((updatedSharks) => {
      const convertedSharks = updatedSharks.map(convertFromSharkData);
      setTrackedSharks(convertedSharks);
      console.log(`Real-time update: ${updatedSharks.length} sharks updated`);
    });

    return unsubscribe;
  }, [realTimeEnabled]);

  const filteredSharks = trackedSharks.filter(shark => {
    const statusMatch = filterStatus === 'all' || shark.status === filterStatus;
    const searchMatch = searchQuery === '' ||
      shark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shark.species.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <Layout
      title="Shark Tracking — Real-time Tagged Shark Monitoring | BlueSphere"
      description="Track hundreds of tagged sharks worldwide in real-time. Interactive map showing Great Whites, Tiger Sharks, and more with live locations, migration patterns, and conservation data."
    >
      <style jsx>{`
        .sharks-page {
          min-height: 100vh;
          background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
        }

        .page-header {
          background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
          color: white;
          padding: 60px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .page-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="shark" patternUnits="userSpaceOnUse" width="20" height="20"><path d="m5,10 l5,-5 l5,5 l5,-5" stroke="rgba(255,255,255,0.1)" stroke-width="0.5" fill="none"/></pattern></defs><rect width="100" height="100" fill="url(%23shark)"/></svg>');
          opacity: 0.1;
        }

        .page-title {
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          position: relative;
          z-index: 1;
        }

        .page-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .stats-row {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 2rem;
          position: relative;
          z-index: 1;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .tabs {
          display: flex;
          background: white;
          border-radius: 12px;
          padding: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .tab {
          flex: 1;
          padding: 1rem;
          text-align: center;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .tab.active {
          background: #0ea5e9;
          color: white;
          box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
        }

        .tab:not(.active) {
          color: #64748b;
        }

        .tab:not(.active):hover {
          background: #f1f5f9;
        }

        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-select, .search-input {
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          font-size: 0.875rem;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
        }

        .loading {
          text-align: center;
          padding: 4rem;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #0ea5e9;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .map-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          height: 600px;
        }

        .sharks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .shark-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .shark-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .shark-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #1e293b;
        }

        .shark-species {
          color: #64748b;
          margin: 0 0 1rem 0;
        }

        .shark-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .shark-stat {
          text-align: center;
        }

        .shark-stat-value {
          font-weight: 600;
          color: #0ea5e9;
        }

        .shark-stat-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-inactive {
          background: #fef3c7;
          color: #92400e;
        }

        .status-missing {
          background: #fee2e2;
          color: #991b1b;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 2rem;
          }

          .stats-row {
            flex-direction: column;
            gap: 1rem;
          }

          .content-container {
            padding: 1rem;
          }

          .filters {
            flex-direction: column;
          }

          .search-input {
            min-width: auto;
          }
        }
      `}</style>

      <div className="sharks-page">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">🦈 Global Shark Tracking</h1>
          <p className="page-subtitle">
            Real-time monitoring of tagged sharks worldwide
          </p>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-number">{isLoading ? '...' : trackedSharks.length}</div>
              <div className="stat-label">Tagged Sharks</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{isLoading ? '...' : trackedSharks.filter(s => s.status === 'active').length}</div>
              <div className="stat-label">Currently Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{isLoading ? '...' : new Set(trackedSharks.map(s => s.species)).size}</div>
              <div className="stat-label">Species Tracked</div>
            </div>
          </div>
        </div>

        <div className="content-container">
          {/* Tabs */}
          <div className="tabs" role="tablist" aria-label="Shark tracking view options">
            <button
              className={`tab ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
              role="tab"
              aria-selected={activeTab === 'map'}
              aria-controls="map-panel"
              id="map-tab"
            >
              🗺️ Live Map
            </button>
            <button
              className={`tab ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
              role="tab"
              aria-selected={activeTab === 'list'}
              aria-controls="list-panel"
              id="list-tab"
            >
              📋 Shark List
            </button>
            <button
              className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
              role="tab"
              aria-selected={activeTab === 'stats'}
              aria-controls="stats-panel"
              id="stats-tab"
            >
              📊 Statistics
            </button>
          </div>

          {/* Filters */}
          <div className="filters">
            <label htmlFor="status-filter" className="sr-only">Filter sharks by status</label>
            <select
              id="status-filter"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter sharks by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="missing">Missing</option>
            </select>
            <label htmlFor="shark-search" className="sr-only">Search sharks by name or species</label>
            <input
              id="shark-search"
              type="text"
              className="search-input"
              placeholder="Search sharks by name or species..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search sharks by name or species"
            />
            <label className="filter-select" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                aria-label="Enable real-time updates"
              />
              <span>Live Updates</span>
            </label>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading {trackedSharks.length > 0 ? trackedSharks.length : 'hundreds of'} tracked sharks...</p>
            </div>
          ) : (
            <>
              {/* Map Tab */}
              {activeTab === 'map' && (
                <div
                  className="map-container"
                  role="tabpanel"
                  aria-labelledby="map-tab"
                  id="map-panel"
                >
                  <EnhancedSharkMap
                    sharks={filteredSharks.map(convertToSharkData)}
                    selectedSharkId={selectedShark?.id || null}
                    onSharkSelect={(sharkData) => {
                      if (sharkData) {
                        const trackedShark = filteredSharks.find(s => s.id === sharkData.id);
                        setSelectedShark(trackedShark || null);
                      } else {
                        setSelectedShark(null);
                      }
                    }}
                    enableRealTimeUpdates={realTimeEnabled}
                    maxVisibleSharks={500}
                    enableClustering={true}
                    showMigrationRoutes={false}
                  />
                </div>
              )}

              {/* List Tab */}
              {activeTab === 'list' && (
                <div
                  className="sharks-grid"
                  role="tabpanel"
                  aria-labelledby="list-tab"
                  id="list-panel"
                >
                  {filteredSharks.map(shark => (
                    <div
                      key={shark.id}
                      className="shark-card"
                      onClick={() => setSelectedShark(shark)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${shark.name}, a ${shark.species}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedShark(shark);
                        }
                      }}
                    >
                      <h3 className="shark-name">{shark.name}</h3>
                      <p className="shark-species">{shark.species}</p>
                      <div className="shark-stats">
                        <div className="shark-stat">
                          <div className="shark-stat-value">{shark.length}m</div>
                          <div className="shark-stat-label">Length</div>
                        </div>
                        <div className="shark-stat">
                          <div className="shark-stat-value">{shark.daysSinceTag}</div>
                          <div className="shark-stat-label">Days Tracked</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <span className={`status-badge status-${shark.status}`}>
                          {shark.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div
                  className="sharks-grid"
                  role="tabpanel"
                  aria-labelledby="stats-tab"
                  id="stats-panel"
                >
                  <div className="shark-card">
                    <h3 className="shark-name">Species Distribution</h3>
                    {Array.from(new Set(trackedSharks.map(s => s.species))).map(species => {
                      const count = trackedSharks.filter(s => s.species === species).length;
                      return (
                        <div key={species} style={{ marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{species}</span>
                            <span className="shark-stat-value">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="shark-card">
                    <h3 className="shark-name">Tracking Status</h3>
                    <div className="shark-stats">
                      <div className="shark-stat">
                        <div className="shark-stat-value">{trackedSharks.filter(s => s.status === 'active').length}</div>
                        <div className="shark-stat-label">Active</div>
                      </div>
                      <div className="shark-stat">
                        <div className="shark-stat-value">{trackedSharks.filter(s => s.status === 'inactive').length}</div>
                        <div className="shark-stat-label">Inactive</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Selected Shark Profile */}
          {selectedShark && (
            <div style={{ marginTop: '2rem' }}>
              <SharkProfile
                profile={{
                  id: selectedShark.id,
                  name: selectedShark.name,
                  species: selectedShark.species,
                  species_common_name: selectedShark.species,
                  sex: selectedShark.sex === 'male' ? 'M' : selectedShark.sex === 'female' ? 'F' : 'Unknown',
                  length_m: selectedShark.length,
                  weight_kg: selectedShark.weight,
                  tag_date: selectedShark.tagDate,
                  tag_location: 'Research expedition location',
                  tag_organization: 'BlueSphere Network',
                  research_program: 'Global Shark Research Initiative',
                  conservation_status: 'Data Deficient',
                  last_ping: selectedShark.lastPing,
                  current_location: {
                    lat: selectedShark.lat,
                    lon: selectedShark.lon,
                    description: 'Current tracking location'
                  }
                }}
                onClose={() => setSelectedShark(null)}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SharksPage;