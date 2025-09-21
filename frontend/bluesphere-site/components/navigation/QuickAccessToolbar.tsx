/*
 * BlueSphere Quick Access Toolbar Component
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Floating action buttons and quick access tools for power users
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BookmarkIcon,
  ClockIcon,
  ChartBarIcon,
  BellIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon,
  BellIcon as BellSolidIcon
} from '@heroicons/react/24/solid';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  solidIcon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
}

interface QuickAccessToolbarProps {
  position?: 'bottom-right' | 'bottom-left' | 'right' | 'left';
  variant?: 'minimal' | 'full';
  customActions?: QuickAction[];
}

const QuickAccessToolbar: React.FC<QuickAccessToolbarProps> = ({
  position = 'bottom-right',
  variant = 'full',
  customActions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<string[]>([]);
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(3);
  const router = useRouter();

  // Load saved state from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bluesphere-bookmarks');
    const savedRecent = localStorage.getItem('bluesphere-recent');

    if (savedBookmarks) {
      setBookmarkedPages(JSON.parse(savedBookmarks));
    }
    if (savedRecent) {
      setRecentPages(JSON.parse(savedRecent));
    }
  }, []);

  // Track page visits for recent pages
  useEffect(() => {
    const currentPath = router.asPath;
    if (currentPath && currentPath !== '/') {
      setRecentPages(prev => {
        const updated = [currentPath, ...prev.filter(path => path !== currentPath)].slice(0, 5);
        localStorage.setItem('bluesphere-recent', JSON.stringify(updated));
        return updated;
      });
    }
  }, [router.asPath]);

  const isBookmarked = bookmarkedPages.includes(router.asPath);

  const toggleBookmark = () => {
    const currentPath = router.asPath;
    setBookmarkedPages(prev => {
      const updated = isBookmarked
        ? prev.filter(path => path !== currentPath)
        : [...prev, currentPath];
      localStorage.setItem('bluesphere-bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const shareCurrentPage = async () => {
    const shareData = {
      title: 'BlueSphere - Ocean Monitoring',
      text: 'Check out this ocean data on BlueSphere',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const exportCurrentData = () => {
    // Trigger data export for current page
    console.log('Exporting data for:', router.pathname);
    // Implementation would depend on the current page's data
  };

  // Default quick actions
  const defaultActions: QuickAction[] = [
    {
      id: 'bookmark',
      label: isBookmarked ? 'Remove Bookmark' : 'Bookmark Page',
      icon: BookmarkIcon,
      solidIcon: BookmarkSolidIcon,
      onClick: toggleBookmark,
      active: isBookmarked
    },
    {
      id: 'recent',
      label: 'Recent Pages',
      icon: ClockIcon,
      href: '#recent'
    },
    {
      id: 'analytics',
      label: 'Quick Analytics',
      icon: ChartBarIcon,
      href: '/analytics'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      solidIcon: BellSolidIcon,
      href: '/alerts',
      badge: notifications,
      active: notifications > 0
    },
    {
      id: 'share',
      label: 'Share Page',
      icon: ShareIcon,
      onClick: shareCurrentPage
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: ArrowDownTrayIcon,
      onClick: exportCurrentData
    }
  ];

  const actions = customActions || defaultActions;

  const getPageTitle = (path: string): string => {
    const titles: Record<string, string> = {
      '/map': 'Ocean Map',
      '/sharks': 'Shark Tracker',
      '/analytics': 'Data Analytics',
      '/alerts': 'Alert Dashboard',
      '/stories': 'Ocean Stories',
      '/gallery': 'Marine Gallery',
      '/conservation': 'Conservation',
      '/education': 'Education'
    };
    return titles[path] || path.slice(1).replace(/-/g, ' ');
  };

  return (
    <>
      <style jsx>{`
        .quick-toolbar {
          position: fixed;
          z-index: 900;
          ${position.includes('bottom') ? 'bottom: 24px;' : ''}
          ${position.includes('top') ? 'top: 24px;' : ''}
          ${position.includes('right') ? 'right: 24px;' : ''}
          ${position.includes('left') ? 'left: 24px;' : ''}
        }

        .toolbar-trigger {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(9, 105, 218, 0.3);
          transition: all 0.2s ease;
          position: relative;
        }

        .toolbar-trigger:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(9, 105, 218, 0.4);
        }

        .toolbar-trigger.open {
          transform: rotate(45deg);
        }

        .toolbar-actions {
          position: absolute;
          ${position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
          ${position.includes('right') ? 'right: 0;' : 'left: 0;'}
          display: flex;
          flex-direction: column;
          gap: 12px;
          opacity: ${isOpen ? '1' : '0'};
          visibility: ${isOpen ? 'visible' : 'hidden'};
          transform: translateY(${isOpen ? '0' : '20px'});
          transition: all 0.3s ease;
        }

        .toolbar-action {
          width: 48px;
          height: 48px;
          background-color: #ffffff;
          border: 1px solid #d0d7de;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #24292f;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          position: relative;
        }

        .toolbar-action:hover {
          background-color: #f6f8fa;
          transform: translateX(${position.includes('right') ? '-' : ''}8px);
          color: #0969da;
          text-decoration: none;
        }

        .toolbar-action.active {
          background-color: #ddf4ff;
          border-color: #0969da;
          color: #0969da;
        }

        .action-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background-color: #cf222e;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }

        .action-tooltip {
          position: absolute;
          ${position.includes('right') ? 'right: 56px;' : 'left: 56px;'}
          top: 50%;
          transform: translateY(-50%);
          background-color: #24292f;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          pointer-events: none;
          z-index: 1000;
        }

        .toolbar-action:hover .action-tooltip {
          opacity: 1;
          visibility: visible;
        }

        .recent-dropdown {
          position: absolute;
          ${position.includes('right') ? 'right: 56px;' : 'left: 56px;'}
          ${position.includes('bottom') ? 'bottom: 0;' : 'top: 0;'}
          width: 280px;
          background-color: #ffffff;
          border: 1px solid #d0d7de;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          opacity: 0;
          visibility: hidden;
          transform: scale(0.95);
          transition: all 0.2s ease;
          z-index: 1001;
        }

        .recent-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: scale(1);
        }

        .recent-header {
          padding: 16px 20px 12px;
          border-bottom: 1px solid #d0d7de;
          font-weight: 600;
          font-size: 14px;
          color: #24292f;
        }

        .recent-list {
          padding: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .recent-item {
          display: block;
          padding: 8px 12px;
          color: #24292f;
          text-decoration: none;
          border-radius: 6px;
          font-size: 13px;
          transition: background-color 0.15s ease;
        }

        .recent-item:hover {
          background-color: #f6f8fa;
          text-decoration: none;
          color: #24292f;
        }

        @media (prefers-color-scheme: dark) {
          .toolbar-action {
            background-color: #21262d;
            border-color: #30363d;
            color: #e6edf3;
          }
          .toolbar-action:hover {
            background-color: #30363d;
            color: #58a6ff;
          }
          .toolbar-action.active {
            background-color: #0d419d;
            border-color: #58a6ff;
            color: #58a6ff;
          }
          .action-tooltip {
            background-color: #21262d;
          }
          .recent-dropdown {
            background-color: #21262d;
            border-color: #30363d;
          }
          .recent-header {
            border-bottom-color: #30363d;
            color: #e6edf3;
          }
          .recent-item {
            color: #e6edf3;
          }
          .recent-item:hover {
            background-color: #30363d;
            color: #e6edf3;
          }
        }

        @media (max-width: 768px) {
          .quick-toolbar {
            ${position.includes('bottom') ? 'bottom: 16px;' : ''}
            ${position.includes('right') ? 'right: 16px;' : ''}
            ${position.includes('left') ? 'left: 16px;' : ''}
          }
          .toolbar-trigger {
            width: 48px;
            height: 48px;
          }
          .toolbar-action {
            width: 44px;
            height: 44px;
          }
          .recent-dropdown {
            width: 260px;
          }
        }

        /* Hide on very small screens to avoid clutter */
        @media (max-width: 480px) {
          .quick-toolbar {
            display: ${variant === 'minimal' ? 'none' : 'block'};
          }
        }
      `}</style>

      <div className="quick-toolbar">
        <button
          className={`toolbar-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Quick actions menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <PlusIcon className="w-6 h-6" />
          )}
        </button>

        <div className="toolbar-actions">
          {actions.map((action, index) => {
            const IconComponent = action.active && action.solidIcon ? action.solidIcon : action.icon;

            if (action.href) {
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`toolbar-action ${action.active ? 'active' : ''}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <IconComponent className="w-5 h-5" />
                  {action.badge && action.badge > 0 && (
                    <span className="action-badge">
                      {action.badge > 99 ? '99+' : action.badge}
                    </span>
                  )}
                  <span className="action-tooltip">{action.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={action.id}
                className={`toolbar-action ${action.active ? 'active' : ''}`}
                onClick={action.onClick}
                style={{ transitionDelay: `${index * 50}ms` }}
                aria-label={action.label}
              >
                <IconComponent className="w-5 h-5" />
                {action.badge && action.badge > 0 && (
                  <span className="action-badge">
                    {action.badge > 99 ? '99+' : action.badge}
                  </span>
                )}
                <span className="action-tooltip">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recent Pages Dropdown */}
        {recentPages.length > 0 && (
          <div className={`recent-dropdown ${isOpen ? 'open' : ''}`}>
            <div className="recent-header">Recent Pages</div>
            <div className="recent-list">
              {recentPages.map((path, index) => (
                <Link
                  key={path}
                  href={path}
                  className="recent-item"
                  onClick={() => setIsOpen(false)}
                >
                  {getPageTitle(path)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuickAccessToolbar;