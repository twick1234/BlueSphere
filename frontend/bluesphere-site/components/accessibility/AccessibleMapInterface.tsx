/**
 * BlueSphere Accessible Map Interface
 *
 * Provides keyboard navigation and screen reader accessibility for interactive maps
 * WCAG 2.1 AA compliant with alternative representations and ARIA support
 */

import React, { useState, useRef, useMemo } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  data?: Record<string, any>;
  category?: string;
  description?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
}

interface AccessibleMapInterfaceProps {
  locations: MapLocation[];
  title: string;
  description?: string;
  onLocationSelect?: (location: MapLocation) => void;
  onLocationFocus?: (location: MapLocation) => void;
  showControls?: boolean;
}

export function AccessibleMapInterface({
  locations,
  title,
  description,
  onLocationSelect,
  onLocationFocus,
  showControls = true
}: AccessibleMapInterfaceProps) {
  const { announce, screenReaderMode, focusElement } = useAccessibility();
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [focusedLocation, setFocusedLocation] = useState<MapLocation | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'table'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'latitude' | 'longitude' | 'importance'>('name');
  const mapRef = useRef<HTMLDivElement>(null);

  const filteredLocations = useMemo(() => {
    let filtered = locations;

    if (searchQuery) {
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'latitude':
          return b.latitude - a.latitude;
        case 'longitude':
          return a.longitude - b.longitude;
        case 'importance':
          const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (importanceOrder[b.importance || 'low'] || 1) - (importanceOrder[a.importance || 'low'] || 1);
        default:
          return 0;
      }
    });
  }, [locations, searchQuery, sortBy]);

  const locationsByRegion = useMemo(() => {
    const regions: Record<string, MapLocation[]> = {};

    filteredLocations.forEach(location => {
      const region = getRegionFromCoordinates(location.latitude, location.longitude);
      if (!regions[region]) {
        regions[region] = [];
      }
      regions[region].push(location);
    });

    return regions;
  }, [filteredLocations]);

  function getRegionFromCoordinates(lat: number, _lng: number): string {
    // Simplified region detection - you could make this more sophisticated
    if (lat > 60) return 'Arctic';
    if (lat > 30) return 'Northern';
    if (lat > 0) return 'Tropical North';
    if (lat > -30) return 'Tropical South';
    if (lat > -60) return 'Southern';
    return 'Antarctic';
  }

  const handleLocationFocus = (location: MapLocation) => {
    setFocusedLocation(location);
    onLocationFocus?.(location);

    const announcement = `${location.name} at ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
    announce(announcement, 'polite');
  };

  const handleLocationSelect = (location: MapLocation) => {
    setSelectedLocation(location);
    onLocationSelect?.(location);

    const announcement = `Selected ${location.name}${location.description ? `: ${location.description}` : ''}`;
    announce(announcement, 'assertive');
  };

  const handleKeyboardNavigation = (event: React.KeyboardEvent, location: MapLocation, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleLocationSelect(location);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (index < filteredLocations.length - 1) {
          const nextLocation = filteredLocations[index + 1];
          if (nextLocation) {
            handleLocationFocus(nextLocation);
            focusElement(`[data-location-id="${nextLocation.id}"]`);
          }
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) {
          const prevLocation = filteredLocations[index - 1];
          if (prevLocation) {
            handleLocationFocus(prevLocation);
            focusElement(`[data-location-id="${prevLocation.id}"]`);
          }
        }
        break;
      case 'Home':
        event.preventDefault();
        const firstLocation = filteredLocations[0];
        if (firstLocation) {
          handleLocationFocus(firstLocation);
          focusElement(`[data-location-id="${firstLocation.id}"]`);
        }
        break;
      case 'End':
        event.preventDefault();
        const lastLocation = filteredLocations[filteredLocations.length - 1];
        if (lastLocation) {
          handleLocationFocus(lastLocation);
          focusElement(`[data-location-id="${lastLocation.id}"]`);
        }
        break;
    }
  };

  const renderMapControls = () => (
    <div className="map-controls" role="group" aria-label="Map view controls">
      <div className="search-container">
        <label htmlFor="location-search" className="search-label">
          Search locations:
        </label>
        <input
          id="location-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, description, or category..."
          className="search-input"
          aria-describedby="search-help"
        />
        <div id="search-help" className="search-help">
          {filteredLocations.length} of {locations.length} locations shown
        </div>
      </div>

      <div className="sort-container">
        <label htmlFor="sort-select" className="sort-label">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="sort-select"
        >
          <option value="name">Name</option>
          <option value="latitude">Latitude</option>
          <option value="longitude">Longitude</option>
          <option value="importance">Importance</option>
        </select>
      </div>

      <div className="view-controls">
        <label className="view-label">View mode:</label>
        <div role="radiogroup" aria-label="Data view mode">
          {(['map', 'list', 'table'] as const).map(mode => (
            <label key={mode} className="radio-label">
              <input
                type="radio"
                name="view-mode"
                value={mode}
                checked={viewMode === mode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="radio-input"
              />
              <span className="radio-text">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLocationList = () => (
    <div className="location-list" role="listbox" aria-label="Selectable locations">
      {Object.entries(locationsByRegion).map(([region, regionLocations]) => (
        <div key={region} className="region-section">
          <h3 className="region-title">{region} Region ({regionLocations.length})</h3>
          <ul className="location-items" role="group" aria-labelledby={`region-${region}`}>
            {regionLocations.map((location) => (
              <li
                key={location.id}
                className={`location-item ${selectedLocation?.id === location.id ? 'selected' : ''} ${focusedLocation?.id === location.id ? 'focused' : ''}`}
                role="option"
                tabIndex={0}
                data-location-id={location.id}
                aria-selected={selectedLocation?.id === location.id}
                onClick={() => handleLocationSelect(location)}
                onFocus={() => handleLocationFocus(location)}
                onKeyDown={(e) => handleKeyboardNavigation(e, location, filteredLocations.indexOf(location))}
                aria-describedby={`location-${location.id}-details`}
              >
                <div className="location-header">
                  <h4 className="location-name">{location.name}</h4>
                  {location.importance && (
                    <span className={`importance-badge ${location.importance}`}>
                      {location.importance}
                    </span>
                  )}
                </div>
                <div className="location-coordinates">
                  Latitude: {location.latitude.toFixed(4)}, Longitude: {location.longitude.toFixed(4)}
                </div>
                {location.description && (
                  <div className="location-description">{location.description}</div>
                )}
                {location.category && (
                  <div className="location-category">Category: {location.category}</div>
                )}
                <div id={`location-${location.id}-details`} className="sr-only">
                  {location.name} located at {location.latitude.toFixed(4)} latitude, {location.longitude.toFixed(4)} longitude
                  {location.description ? `. ${location.description}` : ''}
                  {location.importance ? `. Importance level: ${location.importance}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const renderLocationTable = () => (
    <div className="table-container">
      <table className="locations-table" role="table">
        <caption>
          {title} - {filteredLocations.length} locations
        </caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Latitude</th>
            <th scope="col">Longitude</th>
            <th scope="col">Category</th>
            <th scope="col">Importance</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {filteredLocations.map((location) => (
            <tr
              key={location.id}
              className={selectedLocation?.id === location.id ? 'selected' : ''}
              onClick={() => handleLocationSelect(location)}
              tabIndex={0}
              role="button"
              aria-describedby={`table-row-${location.id}-description`}
            >
              <td>{location.name}</td>
              <td>{location.latitude.toFixed(4)}</td>
              <td>{location.longitude.toFixed(4)}</td>
              <td>{location.category || '—'}</td>
              <td>
                {location.importance && (
                  <span className={`importance-badge ${location.importance}`}>
                    {location.importance}
                  </span>
                )}
              </td>
              <td>{location.description || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="accessible-map" role="application" aria-labelledby="map-title" aria-describedby="map-description">
        <div className="map-header">
          <h2 id="map-title" className="map-title">{title}</h2>
          {description && (
            <p id="map-description" className="map-description">{description}</p>
          )}
        </div>

        {showControls && renderMapControls()}

        <div className="map-content">
          {viewMode === 'map' && !screenReaderMode && (
            <div ref={mapRef} className="map-container" tabIndex={0} role="img" aria-label="Interactive map">
              <p className="sr-only">
                Interactive map showing {locations.length} locations.
                Use the list view or table view for accessible navigation.
              </p>
              {/* Actual map implementation would go here */}
            </div>
          )}

          {(viewMode === 'list' || screenReaderMode) && renderLocationList()}

          {viewMode === 'table' && renderLocationTable()}
        </div>

        {selectedLocation && (
          <div className="selected-location" role="status" aria-live="polite">
            <h3>Selected Location</h3>
            <dl>
              <dt>Name:</dt>
              <dd>{selectedLocation.name}</dd>
              <dt>Coordinates:</dt>
              <dd>{selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</dd>
              {selectedLocation.category && (
                <>
                  <dt>Category:</dt>
                  <dd>{selectedLocation.category}</dd>
                </>
              )}
              {selectedLocation.description && (
                <>
                  <dt>Description:</dt>
                  <dd>{selectedLocation.description}</dd>
                </>
              )}
            </dl>
          </div>
        )}
      </div>

      <style jsx>{`
        .accessible-map {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
        }

        .map-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .map-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #111827;
        }

        .map-description {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .map-controls {
          padding: 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 20px;
          align-items: end;
        }

        .search-container {
          min-width: 300px;
        }

        .search-label,
        .sort-label,
        .view-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          min-height: 44px;
        }

        .search-input:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          border-color: #3b82f6;
        }

        .search-help {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .sort-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          min-height: 44px;
        }

        .sort-select:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .view-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .radio-input {
          margin: 0;
          min-width: 16px;
          min-height: 16px;
        }

        .radio-input:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .map-content {
          padding: 20px;
        }

        .map-container {
          height: 400px;
          background: #f3f4f6;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .location-list {
          max-height: 600px;
          overflow-y: auto;
        }

        .region-section {
          margin-bottom: 24px;
        }

        .region-title {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }

        .location-items {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .location-item {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .location-item:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .location-item:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          background: #dbeafe;
        }

        .location-item.selected {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .location-item.focused {
          background: #f0f9ff;
        }

        .location-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .location-name {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .importance-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .importance-badge.low {
          background: #f3f4f6;
          color: #6b7280;
        }

        .importance-badge.medium {
          background: #fef3c7;
          color: #92400e;
        }

        .importance-badge.high {
          background: #fed7aa;
          color: #ea580c;
        }

        .importance-badge.critical {
          background: #fecaca;
          color: #dc2626;
        }

        .location-coordinates {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .location-description {
          font-size: 14px;
          color: #374151;
          margin-bottom: 4px;
        }

        .location-category {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        .table-container {
          overflow-x: auto;
        }

        .locations-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .locations-table caption {
          caption-side: top;
          padding: 12px;
          background: #f9fafb;
          font-weight: 600;
          text-align: left;
        }

        .locations-table th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .locations-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }

        .locations-table tr:hover {
          background: #f9fafb;
        }

        .locations-table tr:focus {
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
          background: #dbeafe;
        }

        .locations-table tr.selected {
          background: #dbeafe;
        }

        .selected-location {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 6px;
          padding: 16px;
          margin-top: 20px;
        }

        .selected-location h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #0c4a6e;
        }

        .selected-location dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 16px;
          margin: 0;
        }

        .selected-location dt {
          font-weight: 600;
          color: #0c4a6e;
        }

        .selected-location dd {
          margin: 0;
          color: #0369a1;
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

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .map-controls {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .search-container {
            min-width: auto;
          }

          .location-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .locations-table {
            font-size: 14px;
          }

          .locations-table th,
          .locations-table td {
            padding: 8px;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .accessible-map {
            border: 3px solid #000000;
          }

          .location-item:focus {
            outline: 3px solid #ffff00;
            background: #000000;
            color: #ffffff;
          }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .accessible-map {
            background: #1f2937;
            border-color: #374151;
          }

          .map-title {
            color: #f9fafb;
          }

          .map-description {
            color: #d1d5db;
          }

          .map-controls {
            background: #374151;
            border-color: #4b5563;
          }

          .search-input,
          .sort-select {
            background: #1f2937;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .location-item {
            background: #374151;
            border-color: #4b5563;
          }

          .location-name {
            color: #f9fafb;
          }
        }
      `}</style>
    </>
  );
}