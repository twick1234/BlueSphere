/*
 * BlueSphere Advanced Search Interface
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Global search with filters, suggestions, and quick actions
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  FireIcon,
  MapIcon,
  ChartBarIcon,
  AcademicCapIcon,
  HeartIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  type: 'page' | 'species' | 'location' | 'data' | 'story';
  category: string;
  recent?: boolean;
  trending?: boolean;
}

interface SearchInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({
  isOpen,
  onClose,
  placeholder = 'Search oceans, species, data...'
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Mock search data - in production, this would come from API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Great White Shark Tracking',
      description: 'Real-time tracking of great white sharks in Pacific waters',
      href: '/sharks?species=great-white',
      type: 'species',
      category: 'Marine Life',
      trending: true
    },
    {
      id: '2',
      title: 'Pacific Ocean Temperature Map',
      description: 'Live temperature data and thermal patterns',
      href: '/map?layer=temperature',
      type: 'data',
      category: 'Ocean Data'
    },
    {
      id: '3',
      title: 'Monterey Bay Marine Sanctuary',
      description: 'Protected marine area with diverse ecosystems',
      href: '/locations/monterey-bay',
      type: 'location',
      category: 'Locations'
    },
    {
      id: '4',
      title: 'Ocean Temperature Analytics',
      description: 'Historical trends and pattern analysis',
      href: '/analytics?type=temperature',
      type: 'data',
      category: 'Analytics',
      trending: true
    },
    {
      id: '5',
      title: 'Marine Heatwave Story: Pacific 2023',
      description: 'Interactive story about the 2023 Pacific marine heatwave',
      href: '/stories/pacific-heatwave-2023',
      type: 'story',
      category: 'Education'
    }
  ];

  const quickActions = [
    { label: 'View Ocean Map', href: '/map', icon: MapIcon },
    { label: 'Track Marine Life', href: '/sharks', icon: FireIcon },
    { label: 'Data Analytics', href: '/analytics', icon: ChartBarIcon },
    { label: 'Ocean Stories', href: '/stories', icon: AcademicCapIcon },
    { label: 'Conservation', href: '/conservation', icon: HeartIcon }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bluesphere-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (query.length > 2) {
      setLoading(true);
      // Simulate API delay
      const timer = setTimeout(() => {
        const filtered = mockResults.filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
        setLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('bluesphere-recent-searches', JSON.stringify(updated));
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      saveRecentSearch(finalQuery);
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(results[activeIndex].href);
        onClose();
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'species': return '🐋';
      case 'location': return '📍';
      case 'data': return '📊';
      case 'story': return '📖';
      default: return '🌊';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 2000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 80px;
          backdrop-filter: blur(4px);
        }

        .search-modal {
          width: 90%;
          max-width: 640px;
          background-color: #ffffff;
          border: 1px solid #d0d7de;
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .search-header {
          padding: 20px 24px;
          border-bottom: 1px solid #d0d7de;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-input {
          flex: 1;
          font-size: 16px;
          border: none;
          background: transparent;
          color: #24292f;
          outline: none;
        }

        .search-input::placeholder {
          color: #656d76;
        }

        .search-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #d0d7de;
          background-color: #f6f8fa;
          color: #24292f;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .search-close:hover {
          background-color: #f3f4f6;
        }

        .search-content {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .search-section {
          padding: 16px 0;
          border-bottom: 1px solid #f6f8fa;
        }

        .search-section:last-child {
          border-bottom: none;
        }

        .search-section-title {
          font-weight: 600;
          font-size: 12px;
          color: #656d76;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
          padding: 0 24px;
        }

        .search-results {
          display: flex;
          flex-direction: column;
        }

        .search-result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          text-decoration: none;
          color: #24292f;
          transition: background-color 0.15s ease;
          cursor: pointer;
        }

        .search-result:hover,
        .search-result.active {
          background-color: #f6f8fa;
          text-decoration: none;
          color: #24292f;
        }

        .search-result-icon {
          font-size: 20px;
          width: 32px;
          height: 32px;
          background-color: #f6f8fa;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .search-result-content {
          flex: 1;
          min-width: 0;
        }

        .search-result-title {
          font-weight: 500;
          font-size: 14px;
          margin: 0 0 2px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .search-result-description {
          font-size: 12px;
          color: #656d76;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-result-category {
          font-size: 11px;
          color: #656d76;
          background-color: #f6f8fa;
          padding: 2px 6px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .trending-badge {
          background-color: #ff6b6b;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: 500;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          padding: 0 24px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background-color: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          text-decoration: none;
          color: #24292f;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .quick-action:hover {
          background-color: #f3f4f6;
          border-color: #afb8c1;
          text-decoration: none;
          color: #24292f;
        }

        .recent-searches {
          display: flex;
          flex-direction: column;
        }

        .recent-search {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 24px;
          color: #656d76;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .recent-search:hover {
          background-color: #f6f8fa;
          color: #24292f;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: #656d76;
        }

        @media (prefers-color-scheme: dark) {
          .search-modal {
            background-color: #21262d;
            border-color: #30363d;
          }
          .search-header {
            border-bottom-color: #30363d;
          }
          .search-input {
            color: #e6edf3;
          }
          .search-input::placeholder {
            color: #7d8590;
          }
          .search-close {
            background-color: #30363d;
            border-color: #424a53;
            color: #e6edf3;
          }
          .search-close:hover {
            background-color: #424a53;
          }
          .search-section {
            border-bottom-color: #30363d;
          }
          .search-section-title {
            color: #7d8590;
          }
          .search-result {
            color: #e6edf3;
          }
          .search-result:hover,
          .search-result.active {
            background-color: #30363d;
            color: #e6edf3;
          }
          .search-result-icon {
            background-color: #30363d;
          }
          .search-result-description {
            color: #7d8590;
          }
          .search-result-category {
            background-color: #30363d;
            color: #7d8590;
          }
          .quick-action {
            background-color: #30363d;
            border-color: #424a53;
            color: #e6edf3;
          }
          .quick-action:hover {
            background-color: #424a53;
            border-color: #6e7681;
            color: #e6edf3;
          }
          .recent-search {
            color: #7d8590;
          }
          .recent-search:hover {
            background-color: #30363d;
            color: #e6edf3;
          }
        }

        @media (max-width: 640px) {
          .search-modal {
            width: 95%;
            margin: 0 auto;
          }
          .search-header {
            padding: 16px 20px;
          }
          .search-section-title {
            padding: 0 20px;
          }
          .search-result {
            padding: 10px 20px;
          }
          .quick-actions {
            grid-template-columns: 1fr;
            padding: 0 20px;
          }
        }
      `}</style>

      <div className="search-overlay" onClick={onClose}>
        <div className="search-modal" onClick={(e) => e.stopPropagation()}>
          <div className="search-header">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search BlueSphere"
            />
            <button
              className="search-close"
              onClick={onClose}
              aria-label="Close search"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="search-content">
            {loading ? (
              <div className="loading-spinner">
                <div>Searching...</div>
              </div>
            ) : query.length > 2 ? (
              results.length > 0 ? (
                <div className="search-section">
                  <h3 className="search-section-title">Search Results</h3>
                  <div className="search-results">
                    {results.map((result, index) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        className={`search-result ${index === activeIndex ? 'active' : ''}`}
                        onClick={onClose}
                      >
                        <div className="search-result-icon">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="search-result-content">
                          <div className="search-result-title">
                            {result.title}
                            {result.trending && (
                              <span className="trending-badge">Trending</span>
                            )}
                          </div>
                          <div className="search-result-description">
                            {result.description}
                          </div>
                        </div>
                        <div className="search-result-category">
                          {result.category}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="search-section">
                  <div className="search-results">
                    <div className="search-result">
                      <div className="search-result-content">
                        <div className="search-result-title">No results found</div>
                        <div className="search-result-description">
                          Try searching for sharks, ocean data, or marine locations
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <>
                {recentSearches.length > 0 && (
                  <div className="search-section">
                    <h3 className="search-section-title">Recent Searches</h3>
                    <div className="recent-searches">
                      {recentSearches.map((search, index) => (
                        <div
                          key={index}
                          className="recent-search"
                          onClick={() => handleSearch(search)}
                        >
                          <ClockIcon className="w-4 h-4" />
                          <span>{search}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="search-section">
                  <h3 className="search-section-title">Quick Actions</h3>
                  <div className="quick-actions">
                    {quickActions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="quick-action"
                        onClick={onClose}
                      >
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchInterface;