/*
 * BlueSphere Conservation Action Center Component
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React, { useState, useEffect } from 'react';
import { HeartIcon, UserGroupIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface ConservationAction {
  id: string;
  title: string;
  description: string;
  type: 'cleanup' | 'research' | 'education' | 'advocacy' | 'donation';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  date?: string;
  impact: string;
  participantsNeeded?: number;
  currentParticipants?: number;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  featured: boolean;
  link?: string;
}

interface ConservationActionCenterProps {
  showFilters?: boolean;
  maxActions?: number;
  featured?: boolean;
  compact?: boolean;
}

const ConservationActionCenter: React.FC<ConservationActionCenterProps> = ({
  showFilters = true,
  maxActions = 12,
  featured = false,
  compact = false
}) => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [userActions, setUserActions] = useState<Set<string>>(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  // Conservation actions data
  const conservationActions: ConservationAction[] = [
    {
      id: 'beach-cleanup-1',
      title: 'Pacific Beach Cleanup Initiative',
      description: 'Join volunteers in removing plastic debris from critical sea turtle nesting beaches along the Pacific coast.',
      type: 'cleanup',
      urgency: 'high',
      location: 'Monterey Bay, California',
      date: '2024-04-15',
      impact: 'Protect 50+ sea turtle nests and remove 200kg+ of plastic waste',
      participantsNeeded: 50,
      currentParticipants: 32,
      estimatedTime: '4 hours',
      difficulty: 'beginner',
      tags: ['plastic-pollution', 'sea-turtles', 'community-action'],
      featured: true,
      link: '/actions/beach-cleanup-monterey'
    },
    {
      id: 'coral-research-1',
      title: 'Coral Restoration Data Collection',
      description: 'Assist marine biologists in monitoring coral health and documenting bleaching recovery in protected reef areas.',
      type: 'research',
      urgency: 'critical',
      location: 'Great Barrier Reef, Australia',
      date: '2024-04-20',
      impact: 'Document health of 1000+ coral colonies for restoration planning',
      participantsNeeded: 15,
      currentParticipants: 8,
      estimatedTime: '6 hours',
      difficulty: 'intermediate',
      tags: ['coral-restoration', 'marine-biology', 'data-collection'],
      featured: true,
      link: '/actions/coral-research-gbr'
    },
    {
      id: 'education-1',
      title: 'Ocean Literacy School Program',
      description: 'Teach K-12 students about ocean conservation through interactive workshops and BlueSphere data exploration.',
      type: 'education',
      urgency: 'medium',
      location: 'Virtual & Local Schools',
      impact: 'Educate 500+ students about marine conservation',
      estimatedTime: '2 hours per session',
      difficulty: 'beginner',
      tags: ['education', 'youth-outreach', 'ocean-literacy'],
      featured: false,
      link: '/actions/school-program'
    },
    {
      id: 'advocacy-1',
      title: 'Marine Protected Area Campaign',
      description: 'Support legislation to establish new marine protected areas by contacting representatives and raising awareness.',
      type: 'advocacy',
      urgency: 'high',
      impact: 'Help establish 5 new marine protected areas covering 10,000 km²',
      estimatedTime: '1 hour',
      difficulty: 'beginner',
      tags: ['policy', 'marine-protected-areas', 'legislation'],
      featured: true,
      link: '/actions/mpa-campaign'
    },
    {
      id: 'donation-1',
      title: 'Emergency Coral Restoration Fund',
      description: 'Support rapid response coral restoration efforts following marine heatwave events in critical reef systems.',
      type: 'donation',
      urgency: 'critical',
      impact: 'Fund restoration of 100 hectares of damaged coral reef',
      estimatedTime: '5 minutes',
      difficulty: 'beginner',
      tags: ['coral-restoration', 'emergency-response', 'funding'],
      featured: true,
      link: '/donate/coral-restoration'
    },
    {
      id: 'research-2',
      title: 'Citizen Science Water Quality Testing',
      description: 'Collect water samples from coastal areas to contribute to global ocean health database and pollution monitoring.',
      type: 'research',
      urgency: 'medium',
      location: 'Your Local Coast',
      impact: 'Contribute to global water quality database with 1000+ data points',
      estimatedTime: '3 hours',
      difficulty: 'intermediate',
      tags: ['citizen-science', 'water-quality', 'pollution-monitoring'],
      featured: false,
      link: '/actions/water-quality-testing'
    },
    {
      id: 'cleanup-2',
      title: 'Underwater Debris Removal',
      description: 'Advanced diving operation to remove ghost nets and large debris from critical marine habitats.',
      type: 'cleanup',
      urgency: 'high',
      location: 'Various Coastal Sites',
      impact: 'Remove 50+ ghost nets saving 1000+ marine animals',
      participantsNeeded: 20,
      currentParticipants: 12,
      estimatedTime: '8 hours',
      difficulty: 'advanced',
      tags: ['ghost-nets', 'diving', 'marine-life-rescue'],
      featured: false,
      link: '/actions/underwater-cleanup'
    },
    {
      id: 'advocacy-2',
      title: 'Plastic Reduction Corporate Campaign',
      description: 'Engage with corporations to reduce single-use plastics and improve sustainable packaging practices.',
      type: 'advocacy',
      urgency: 'medium',
      impact: 'Reduce corporate plastic use by 1 million items per year',
      estimatedTime: '2 hours per week',
      difficulty: 'intermediate',
      tags: ['corporate-engagement', 'plastic-reduction', 'sustainability'],
      featured: false,
      link: '/actions/corporate-plastic-campaign'
    }
  ];

  const actionTypes = [
    { id: 'all', name: 'All Actions', icon: '🌊', color: 'blue' },
    { id: 'cleanup', name: 'Cleanup', icon: '🧹', color: 'green' },
    { id: 'research', name: 'Research', icon: '🔬', color: 'purple' },
    { id: 'education', name: 'Education', icon: '📚', color: 'orange' },
    { id: 'advocacy', name: 'Advocacy', icon: '📢', color: 'red' },
    { id: 'donation', name: 'Donation', icon: '💝', color: 'pink' }
  ];

  const urgencyLevels = [
    { id: 'all', name: 'All Urgency', color: 'gray' },
    { id: 'low', name: 'Low', color: 'green' },
    { id: 'medium', name: 'Medium', color: 'yellow' },
    { id: 'high', name: 'High', color: 'orange' },
    { id: 'critical', name: 'Critical', color: 'red' }
  ];

  const difficultyLevels = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];

  const filteredActions = conservationActions
    .filter(action => {
      if (featured && !action.featured) return false;
      if (selectedType !== 'all' && action.type !== selectedType) return false;
      if (selectedUrgency !== 'all' && action.urgency !== selectedUrgency) return false;
      if (selectedDifficulty !== 'all' && action.difficulty !== selectedDifficulty) return false;
      return true;
    })
    .slice(0, maxActions);

  const handleJoinAction = (actionId: string, actionTitle: string) => {
    setUserActions(prev => new Set(Array.from(prev).concat(actionId)));
    setShowSuccessMessage(`Successfully joined: ${actionTitle}`);

    setTimeout(() => {
      setShowSuccessMessage(null);
    }, 4000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-500';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-500';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'low': return 'bg-green-100 text-green-800 border-green-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeObj = actionTypes.find(t => t.id === type);
    return typeObj?.icon || '🌊';
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '⭐';
      case 'intermediate': return '⭐⭐';
      case 'advanced': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  return (
    <>
      <style jsx>{`
        .conservation-center {
          padding: ${compact ? '1rem 0' : '2rem 0'};
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          color: #0f172a;
          min-height: 100vh;
        }

        .center-header {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem ${compact ? '1rem' : '2rem'};
          text-align: center;
        }

        .center-title {
          font-size: ${compact ? '1.5rem' : '2.5rem'};
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .center-subtitle {
          font-size: ${compact ? '1rem' : '1.25rem'};
          color: #64748b;
          max-width: 600px;
          margin: 0 auto ${compact ? '1rem' : '2rem'};
          line-height: 1.6;
        }

        .success-message {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        .filters-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem ${compact ? '1rem' : '2rem'};
        }

        .filter-row {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: ${compact ? '1rem' : '2rem'};
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }

        .filter-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: white;
          border: 2px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .filter-btn:hover {
          border-color: #10b981;
          color: #10b981;
          transform: translateY(-1px);
        }

        .filter-btn.active {
          background: #10b981;
          border-color: #10b981;
          color: white;
          transform: translateY(-1px);
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(${compact ? '300px' : '380px'}, 1fr));
          gap: ${compact ? '1.5rem' : '2rem'};
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .action-card {
          background: white;
          border-radius: 20px;
          padding: ${compact ? '1.5rem' : '2rem'};
          border: 1px solid #e2e8f0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .action-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12);
          border-color: #10b981;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.05), transparent);
          transition: left 0.6s ease;
        }

        .action-card:hover::before {
          left: 100%;
        }

        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .action-type-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .action-badges {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .urgency-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
        }

        .featured-badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .action-title {
          font-size: ${compact ? '1.1rem' : '1.25rem'};
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .action-description {
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 1rem;
          font-size: ${compact ? '0.9rem' : '0.95rem'};
        }

        .action-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
        }

        .meta-icon {
          font-size: 1rem;
          color: #10b981;
        }

        .progress-section {
          margin-bottom: 1rem;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          transition: width 0.3s ease;
        }

        .impact-section {
          background: rgba(16, 185, 129, 0.05);
          padding: 0.75rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          border: 1px solid rgba(16, 185, 129, 0.1);
        }

        .impact-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #059669;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .impact-text {
          color: #0d9488;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .action-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .action-tag {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .action-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .difficulty-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: #64748b;
        }

        .action-button {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .action-button:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          text-decoration: none;
          color: white;
        }

        .action-button.joined {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          cursor: default;
        }

        .action-button.joined:hover {
          transform: none;
          box-shadow: none;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .conservation-center {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f1f5f9;
          }

          .center-title {
            color: #f1f5f9;
          }

          .center-subtitle {
            color: #cbd5e1;
          }

          .filter-label {
            color: #cbd5e1;
          }

          .filter-btn {
            background: #1e293b;
            border-color: #475569;
            color: #cbd5e1;
          }

          .filter-btn:hover {
            border-color: #10b981;
            color: #10b981;
          }

          .filter-btn.active {
            background: #10b981;
            color: #f1f5f9;
          }

          .action-card {
            background: #1e293b;
            border-color: #475569;
            color: #f1f5f9;
          }

          .action-title {
            color: #f1f5f9;
          }

          .action-description {
            color: #cbd5e1;
          }

          .meta-item {
            color: #cbd5e1;
          }

          .impact-section {
            background: rgba(16, 185, 129, 0.05);
            border-color: rgba(16, 185, 129, 0.1);
          }

          .impact-label {
            color: #10b981;
          }

          .impact-text {
            color: #059669;
          }

          .difficulty-indicator {
            color: #cbd5e1;
          }
        }

        /* Light mode explicit styles for better contrast */
        @media (prefers-color-scheme: light) {
          .conservation-center {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            color: #0f172a;
          }

          .center-title {
            color: #0f172a;
          }

          .center-subtitle {
            color: #64748b;
          }

          .filter-label {
            color: #475569;
          }

          .filter-btn {
            background: white;
            border-color: #e2e8f0;
            color: #64748b;
          }

          .action-card {
            background: white;
            border-color: #e2e8f0;
            color: #0f172a;
          }

          .action-title {
            color: #0f172a;
          }

          .action-description {
            color: #64748b;
          }

          .meta-item {
            color: #64748b;
          }

          .difficulty-indicator {
            color: #64748b;
          }
        }

        @media (max-width: 768px) {
          .actions-grid {
            grid-template-columns: 1fr;
            padding: 0 1rem;
          }

          .filters-section {
            padding: 0 1rem 1rem;
          }

          .filter-row {
            flex-direction: column;
            gap: 1rem;
          }

          .filter-buttons {
            justify-content: center;
          }

          .action-meta {
            grid-template-columns: 1fr;
          }

          .action-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .action-button {
            text-align: center;
            justify-content: center;
          }

          .success-message {
            right: 1rem;
            left: 1rem;
            top: 1rem;
          }
        }
      `}</style>

      <div className="conservation-center">
        {!compact && (
          <div className="center-header">
            <h2 className="center-title">🌍 Conservation Action Center</h2>
            <p className="center-subtitle">
              Take direct action to protect our oceans. Join conservation efforts,
              contribute to research, and make a real impact on marine ecosystems.
            </p>
          </div>
        )}

        {showFilters && !compact && (
          <div className="filters-section">
            <div className="filter-row">
              <div className="filter-group">
                <div className="filter-label">Action Type</div>
                <div className="filter-buttons">
                  {actionTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`filter-btn ${selectedType === type.id ? 'active' : ''}`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      {type.icon} {type.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-label">Urgency</div>
                <div className="filter-buttons">
                  {urgencyLevels.map((level) => (
                    <button
                      key={level.id}
                      className={`filter-btn ${selectedUrgency === level.id ? 'active' : ''}`}
                      onClick={() => setSelectedUrgency(level.id)}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-label">Difficulty</div>
                <div className="filter-buttons">
                  {difficultyLevels.map((level) => (
                    <button
                      key={level.id}
                      className={`filter-btn ${selectedDifficulty === level.id ? 'active' : ''}`}
                      onClick={() => setSelectedDifficulty(level.id)}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="actions-grid">
          {filteredActions.map((action) => (
            <div key={action.id} className="action-card">
              <div className="action-header">
                <div className="action-type-icon">{getTypeIcon(action.type)}</div>
                <div className="action-badges">
                  {action.featured && (
                    <div className="featured-badge">
                      ⭐ Featured
                    </div>
                  )}
                  <div className={`urgency-badge ${getUrgencyColor(action.urgency)}`}>
                    {action.urgency.toUpperCase()}
                  </div>
                </div>
              </div>

              <h3 className="action-title">{action.title}</h3>
              <p className="action-description">{action.description}</p>

              <div className="action-meta">
                {action.location && (
                  <div className="meta-item">
                    <MapPinIcon className="meta-icon" style={{ width: '1rem', height: '1rem' }} />
                    <span>{action.location}</span>
                  </div>
                )}
                {action.date && (
                  <div className="meta-item">
                    <CalendarIcon className="meta-icon" style={{ width: '1rem', height: '1rem' }} />
                    <span>{new Date(action.date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <span>{action.estimatedTime}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">👥</span>
                  <span>{getDifficultyIcon(action.difficulty)} {action.difficulty}</span>
                </div>
              </div>

              {action.participantsNeeded && (
                <div className="progress-section">
                  <div className="progress-label">
                    <span>Participants</span>
                    <span>{action.currentParticipants || 0} / {action.participantsNeeded}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(((action.currentParticipants || 0) / action.participantsNeeded) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="impact-section">
                <div className="impact-label">Expected Impact</div>
                <div className="impact-text">{action.impact}</div>
              </div>

              <div className="action-tags">
                {action.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="action-tag">{tag}</span>
                ))}
              </div>

              <div className="action-footer">
                <div className="difficulty-indicator">
                  <span>Difficulty: {getDifficultyIcon(action.difficulty)}</span>
                </div>

                {userActions.has(action.id) ? (
                  <button className="action-button joined">
                    ✅ Joined
                  </button>
                ) : (
                  <button
                    className="action-button"
                    onClick={() => handleJoinAction(action.id, action.title)}
                  >
                    🌊 Join Action
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredActions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌊</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No actions found</h3>
            <p>Try adjusting your filter criteria to find conservation actions</p>
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-message">
            🎉 {showSuccessMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default ConservationActionCenter;