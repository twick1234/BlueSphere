/*
 * BlueSphere Layout Component - Enhanced Navigation System
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Complete navigation architecture with accessibility and responsive design
 */

import React, { useState } from 'react'
import HeadMeta from './HeadMeta'
import { NavigationSystem, BreadcrumbNavigation, QuickAccessToolbar, SearchInterface } from './navigation'

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  noindex?: boolean;
  showNavigation?: boolean;
  showBreadcrumbs?: boolean;
  showQuickAccess?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  keywords,
  canonical,
  noindex = false,
  showNavigation = true,
  showBreadcrumbs = true,
  showQuickAccess = true
}) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        /* Reset and base styles */
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          -webkit-text-size-adjust: 100%;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.5;
          color: #24292f;
          background-color: #ffffff;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          body {
            color: #e6edf3;
            background-color: #0d1117;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          body {
            background-color: #ffffff;
            color: #000000;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div>
        <HeadMeta
          title={title}
          description={description}
          keywords={keywords}
          canonical={canonical}
          noindex={noindex}
        />

        <NavigationSystem
          title={title}
          description={description}
          showNavigation={showNavigation}
        >
          {showBreadcrumbs && <BreadcrumbNavigation />}
          {children}
        </NavigationSystem>

        {showQuickAccess && <QuickAccessToolbar />}

        <SearchInterface
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </div>
    </>
  )
}

export default Layout