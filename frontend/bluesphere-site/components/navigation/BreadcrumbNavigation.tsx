/*
 * BlueSphere Breadcrumb Navigation Component
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Accessible breadcrumb navigation with dynamic path generation
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

// Route configuration for automatic breadcrumb generation
const routeConfig: Record<string, string> = {
  '/': 'Home',
  '/map': 'Ocean Map',
  '/sharks': 'Marine Life Tracker',
  '/monitoring': 'Environmental Monitoring',
  '/alerts': 'Alert Dashboard',
  '/analytics': 'Data Analytics',
  '/timelapse': 'Time-lapse Visualization',
  '/migration': 'Species Migration',
  '/climate': 'Climate Patterns',
  '/crisis': 'Crisis Response',
  '/conservation': 'Action Center',
  '/stories': 'Ocean Stories',
  '/research': 'Research Collaboration',
  '/gallery': 'Marine Gallery',
  '/education': 'Learning Resources',
  '/species-ai': 'Species Database',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/about': 'About',
  '/docs': 'Documentation'
};

// Category mapping for section context
const categoryMapping: Record<string, string> = {
  '/map': 'Real-time Data',
  '/sharks': 'Real-time Data',
  '/monitoring': 'Real-time Data',
  '/alerts': 'Real-time Data',
  '/analytics': 'Historical Analysis',
  '/timelapse': 'Historical Analysis',
  '/migration': 'Historical Analysis',
  '/climate': 'Historical Analysis',
  '/crisis': 'Conservation',
  '/conservation': 'Conservation',
  '/stories': 'Education',
  '/research': 'Conservation',
  '/gallery': 'Education',
  '/education': 'Education',
  '/species-ai': 'Education'
};

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  showHome = true,
  className = ''
}) => {
  const router = useRouter();

  // Generate breadcrumbs automatically if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = router.asPath.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if requested
    if (showHome) {
      breadcrumbs.push({
        label: 'Home',
        href: '/',
        isActive: router.pathname === '/'
      });
    }

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip query parameters and anchors
      const cleanPath = currentPath.split('?')[0].split('#')[0];

      // Add category context if this is a top-level page
      if (index === 0 && categoryMapping[cleanPath] && !showHome) {
        breadcrumbs.push({
          label: categoryMapping[cleanPath],
          href: '#',
          isActive: false
        });
      }

      const label = routeConfig[cleanPath] || decodeURIComponent(segment).replace(/-/g, ' ');
      const isActive = index === pathSegments.length - 1;

      breadcrumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: cleanPath,
        isActive
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render if only home breadcrumb
  if (breadcrumbs.length <= 1 && showHome) return null;

  return (
    <>
      <style jsx>{`
        .breadcrumb-container {
          background-color: #f6f8fa;
          border-bottom: 1px solid #d0d7de;
          padding: 12px 0;
        }

        @media (prefers-color-scheme: dark) {
          .breadcrumb-container {
            background-color: #161b22;
            border-bottom-color: #30363d;
          }
        }

        .breadcrumb-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb-link {
          color: #656d76;
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .breadcrumb-link:hover {
          color: #0969da;
          background-color: #ddf4ff;
          text-decoration: none;
        }

        .breadcrumb-link:focus {
          outline: 2px solid #0969da;
          outline-offset: 2px;
        }

        .breadcrumb-link.active {
          color: #24292f;
          font-weight: 500;
          cursor: default;
        }

        .breadcrumb-link.active:hover {
          background-color: transparent;
          color: #24292f;
        }

        .breadcrumb-separator {
          color: #858f99;
          display: flex;
          align-items: center;
        }

        @media (prefers-color-scheme: dark) {
          .breadcrumb-link {
            color: #7d8590;
          }
          .breadcrumb-link:hover {
            color: #58a6ff;
            background-color: #0d419d;
          }
          .breadcrumb-link.active {
            color: #e6edf3;
          }
          .breadcrumb-link.active:hover {
            color: #e6edf3;
          }
          .breadcrumb-separator {
            color: #6e7681;
          }
        }

        @media (max-width: 768px) {
          .breadcrumb-content {
            padding: 0 16px;
          }
          .breadcrumb-link {
            font-size: 13px;
            padding: 2px 6px;
          }
        }

        /* Improved mobile layout */
        @media (max-width: 480px) {
          .breadcrumb-nav {
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .breadcrumb-nav::-webkit-scrollbar {
            display: none;
          }
          .breadcrumb-item {
            flex-shrink: 0;
          }
        }
      `}</style>

      <div className={`breadcrumb-container ${className}`}>
        <div className="breadcrumb-content">
          <nav
            className="breadcrumb-nav"
            aria-label="Breadcrumb navigation"
            role="navigation"
          >
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.href}>
                <div className="breadcrumb-item">
                  {breadcrumb.isActive ? (
                    <span
                      className="breadcrumb-link active"
                      aria-current="page"
                    >
                      {index === 0 && showHome && (
                        <HomeIcon className="w-4 h-4" />
                      )}
                      {breadcrumb.label}
                    </span>
                  ) : (
                    <Link
                      href={breadcrumb.href}
                      className="breadcrumb-link"
                      aria-label={`Navigate to ${breadcrumb.label}`}
                    >
                      {index === 0 && showHome && (
                        <HomeIcon className="w-4 h-4" />
                      )}
                      {breadcrumb.label}
                    </Link>
                  )}
                </div>
                {index < breadcrumbs.length - 1 && (
                  <div className="breadcrumb-separator" aria-hidden="true">
                    <ChevronRightIcon className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default BreadcrumbNavigation;