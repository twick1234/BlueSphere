/*
 * BlueSphere Advanced Navigation System
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Complete navigation architecture with hierarchical structure,
 * accessibility features, and responsive design
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ChevronDownIcon,
  HomeIcon,
  MapIcon,
  ChartBarIcon,
  HeartIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

// Navigation item type definitions
interface NavItem {
  name: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: NavItem[];
}

// Navigation configuration
const navigationSections: NavSection[] = [
  {
    title: 'Real-time Data',
    icon: MapIcon,
    description: 'Live monitoring and current conditions',
    items: [
      { name: 'Ocean Map', href: '/map', description: 'Live ocean conditions and sensor data' },
      { name: 'Marine Life Tracker', href: '/sharks', description: 'Active animal tracking and movements' },
      { name: 'Environmental Monitoring', href: '/monitoring', description: 'Real-time environmental sensors' },
      { name: 'Alert Dashboard', href: '/alerts', description: 'Active warnings and notifications' }
    ]
  },
  {
    title: 'Historical Analysis',
    icon: ChartBarIcon,
    description: 'Trends, patterns, and time-series data',
    items: [
      { name: 'Data Analytics', href: '/analytics', description: 'Trends and pattern analysis' },
      { name: 'Time-lapse Visualization', href: '/timelapse', description: 'Historical changes over time' },
      { name: 'Species Migration', href: '/migration', description: 'Animal movement patterns' },
      { name: 'Climate Patterns', href: '/climate', description: 'Long-term climate trends' }
    ]
  },
  {
    title: 'Conservation',
    icon: HeartIcon,
    description: 'Actions, alerts, and impact initiatives',
    items: [
      { name: 'Crisis Response', href: '/crisis', description: 'Emergency response coordination' },
      { name: 'Action Center', href: '/conservation', description: 'Take conservation action' },
      { name: 'Impact Stories', href: '/stories', description: 'Conservation success stories' },
      { name: 'Research Collaboration', href: '/research', description: 'Scientific partnerships' }
    ]
  },
  {
    title: 'Education',
    icon: AcademicCapIcon,
    description: 'Stories, resources, and learning materials',
    items: [
      { name: 'Ocean Stories', href: '/stories', description: 'Interactive marine narratives' },
      { name: 'Marine Gallery', href: '/gallery', description: 'Visual marine content' },
      { name: 'Learning Resources', href: '/education', description: 'Educational materials' },
      { name: 'Species Database', href: '/species-ai', description: 'Comprehensive species information' }
    ]
  }
];

// Quick action items for toolbar
const quickActions = [
  { name: 'Search', icon: MagnifyingGlassIcon, action: 'search' },
  { name: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
  { name: 'Profile', icon: UserCircleIcon, href: '/profile' }
];

interface NavigationSystemProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showNavigation?: boolean;
}

// Main Navigation System Component
const NavigationSystem: React.FC<NavigationSystemProps> = ({
  children,
  title,
  description,
  showNavigation = true
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [router.pathname]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path: string) => router.pathname === path;

  const handleDropdownToggle = (sectionTitle: string) => {
    setActiveDropdown(activeDropdown === sectionTitle ? null : sectionTitle);
  };

  return (
    <>
      <style jsx global>{`
        /* CSS Variables for theming */
        :root {
          --nav-bg: rgba(255, 255, 255, 0.8);
          --nav-border: #d0d7de;
          --nav-text: #24292f;
          --nav-text-muted: #656d76;
          --nav-hover-bg: #f6f8fa;
          --nav-active-bg: #ddf4ff;
          --nav-active-text: #0969da;
          --nav-backdrop: rgba(0, 0, 0, 0.5);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --nav-bg: rgba(13, 17, 23, 0.8);
            --nav-border: #30363d;
            --nav-text: #e6edf3;
            --nav-text-muted: #7d8590;
            --nav-hover-bg: #21262d;
            --nav-active-bg: #0d419d;
            --nav-active-text: #58a6ff;
            --nav-backdrop: rgba(0, 0, 0, 0.7);
          }
        }

        /* Focus management for accessibility */
        .focus-visible {
          outline: 2px solid var(--nav-active-text);
          outline-offset: 2px;
        }
      `}</style>

      <style jsx>{`
        /* Header Styles */
        .navigation-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background-color: var(--nav-bg);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid ${scrolled ? 'var(--nav-border)' : 'transparent'};
          transition: all 0.2s ease;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Brand */
        .brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: var(--nav-text);
          font-weight: 600;
          font-size: 18px;
          transition: opacity 0.2s ease;
        }

        .brand:hover {
          opacity: 0.7;
          text-decoration: none;
          color: var(--nav-text);
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          margin-right: 12px;
        }

        /* Desktop Navigation */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-dropdown {
          position: relative;
        }

        .nav-dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          text-decoration: none;
          color: var(--nav-text-muted);
          font-weight: 500;
          font-size: 14px;
          border-radius: 6px;
          transition: all 0.15s ease;
          white-space: nowrap;
          cursor: pointer;
          border: none;
          background: none;
        }

        .nav-dropdown-trigger:hover,
        .nav-dropdown-trigger.active {
          color: var(--nav-text);
          background-color: var(--nav-hover-bg);
          text-decoration: none;
        }

        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 320px;
          background-color: var(--nav-bg);
          border: 1px solid var(--nav-border);
          border-radius: 12px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
          opacity: ${activeDropdown ? '1' : '0'};
          visibility: ${activeDropdown ? 'visible' : 'hidden'};
          transform: translateY(${activeDropdown ? '0' : '-8px'});
          transition: all 0.2s ease;
          backdrop-filter: blur(12px);
          z-index: 1000;
        }

        .dropdown-header {
          padding: 16px 20px 12px;
          border-bottom: 1px solid var(--nav-border);
        }

        .dropdown-title {
          font-weight: 600;
          font-size: 16px;
          color: var(--nav-text);
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dropdown-description {
          font-size: 13px;
          color: var(--nav-text-muted);
          margin: 0;
        }

        .dropdown-items {
          padding: 8px;
        }

        .dropdown-item {
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: var(--nav-text);
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .dropdown-item:hover {
          background-color: var(--nav-hover-bg);
          text-decoration: none;
          color: var(--nav-text);
        }

        .dropdown-item.active {
          background-color: var(--nav-active-bg);
          color: var(--nav-active-text);
        }

        .dropdown-item-title {
          font-weight: 500;
          font-size: 14px;
          margin: 0 0 2px 0;
        }

        .dropdown-item-description {
          font-size: 12px;
          color: var(--nav-text-muted);
          margin: 0;
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--nav-border);
          background-color: var(--nav-hover-bg);
          color: var(--nav-text);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .quick-action:hover {
          background-color: var(--nav-active-bg);
          color: var(--nav-active-text);
          text-decoration: none;
        }

        /* Mobile Menu Button */
        .mobile-menu-button {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--nav-border);
          background-color: var(--nav-hover-bg);
          color: var(--nav-text);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mobile-menu-button:hover {
          background-color: var(--nav-active-bg);
        }

        /* Mobile Menu */
        .mobile-menu-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--nav-backdrop);
          z-index: 1001;
          opacity: ${mobileMenuOpen ? '1' : '0'};
          visibility: ${mobileMenuOpen ? 'visible' : 'hidden'};
          transition: all 0.2s ease;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 320px;
          height: 100vh;
          background-color: var(--nav-bg);
          border-left: 1px solid var(--nav-border);
          transform: translateX(${mobileMenuOpen ? '0' : '100%'});
          transition: transform 0.3s ease;
          overflow-y: auto;
          z-index: 1002;
          backdrop-filter: blur(12px);
        }

        .mobile-menu-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--nav-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mobile-close {
          width: 32px;
          height: 32px;
          border: 1px solid var(--nav-border);
          background-color: var(--nav-hover-bg);
          color: var(--nav-text);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .mobile-close:hover {
          background-color: var(--nav-active-bg);
        }

        .mobile-nav-section {
          border-bottom: 1px solid var(--nav-border);
        }

        .mobile-section-header {
          padding: 16px 20px 8px;
          font-weight: 600;
          font-size: 14px;
          color: var(--nav-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mobile-nav-item {
          display: block;
          padding: 12px 20px;
          text-decoration: none;
          color: var(--nav-text);
          border-left: 3px solid transparent;
          transition: all 0.15s ease;
        }

        .mobile-nav-item:hover {
          background-color: var(--nav-hover-bg);
          border-left-color: var(--nav-border);
          text-decoration: none;
          color: var(--nav-text);
        }

        .mobile-nav-item.active {
          background-color: var(--nav-active-bg);
          border-left-color: var(--nav-active-text);
          color: var(--nav-active-text);
        }

        /* Search Interface */
        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--nav-backdrop);
          z-index: 2000;
          opacity: ${searchOpen ? '1' : '0'};
          visibility: ${searchOpen ? 'visible' : 'hidden'};
          transition: all 0.2s ease;
        }

        .search-modal {
          position: fixed;
          top: 100px;
          left: 50%;
          transform: translateX(-50%) translateY(${searchOpen ? '0' : '-20px'});
          width: 90%;
          max-width: 600px;
          background-color: var(--nav-bg);
          border: 1px solid var(--nav-border);
          border-radius: 12px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(12px);
          opacity: ${searchOpen ? '1' : '0'};
          transition: all 0.2s ease;
        }

        .search-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 16px;
          border: none;
          background: transparent;
          color: var(--nav-text);
          outline: none;
        }

        .search-input::placeholder {
          color: var(--nav-text-muted);
        }

        /* Main Content */
        .main-content {
          padding-top: 64px;
          min-height: 100vh;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .desktop-nav {
            display: none;
          }
          .mobile-menu-button {
            display: flex;
          }
          .mobile-menu-overlay {
            display: block;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            padding: 0 16px;
          }
          .mobile-menu {
            width: 100%;
          }
          .search-modal {
            width: 95%;
            top: 80px;
          }
        }

        /* Skip Links for Accessibility */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: var(--nav-active-text);
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          z-index: 9999;
          font-size: 14px;
          font-weight: 500;
          transition: top 0.3s;
        }

        .skip-link:focus {
          top: 6px;
        }
      `}</style>

      <div>
        {/* Skip Navigation Links */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <a href="#main-navigation" className="skip-link">Skip to navigation</a>

        {showNavigation && (
          <>
            <header className="navigation-header" ref={headerRef}>
              <div className="header-content">
                <Link href="/" className="brand">
                  <div className="brand-icon">🌊</div>
                  BlueSphere
                </Link>

                <nav id="main-navigation" className="desktop-nav" role="navigation" aria-label="Main navigation">
                  {navigationSections.map((section) => (
                    <div key={section.title} className="nav-dropdown">
                      <button
                        className={`nav-dropdown-trigger ${activeDropdown === section.title ? 'active' : ''}`}
                        onClick={() => handleDropdownToggle(section.title)}
                        aria-expanded={activeDropdown === section.title}
                        aria-haspopup="true"
                      >
                        <section.icon className="w-4 h-4" />
                        {section.title}
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>

                      <div
                        className="nav-dropdown-menu"
                        role="menu"
                        aria-label={`${section.title} submenu`}
                      >
                        <div className="dropdown-header">
                          <h3 className="dropdown-title">
                            <section.icon className="w-5 h-5" />
                            {section.title}
                          </h3>
                          <p className="dropdown-description">{section.description}</p>
                        </div>
                        <div className="dropdown-items">
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`dropdown-item ${isActive(item.href) ? 'active' : ''}`}
                              role="menuitem"
                            >
                              <div className="dropdown-item-title">{item.name}</div>
                              {item.description && (
                                <div className="dropdown-item-description">{item.description}</div>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="quick-actions">
                  <button
                    className="quick-action"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Open search"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </button>
                  <Link href="/settings" className="quick-action" aria-label="Settings">
                    <Cog6ToothIcon className="w-4 h-4" />
                  </Link>
                  <Link href="/profile" className="quick-action" aria-label="User profile">
                    <UserCircleIcon className="w-4 h-4" />
                  </Link>

                  <button
                    className="mobile-menu-button"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open navigation menu"
                  >
                    <Bars3Icon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </header>

            {/* Mobile Menu */}
            <div
              className="mobile-menu-overlay"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden={!mobileMenuOpen}
            />
            <nav className="mobile-menu" role="navigation" aria-label="Mobile navigation">
              <div className="mobile-menu-header">
                <Link href="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
                  <div className="brand-icon">🌊</div>
                  BlueSphere
                </Link>
                <button
                  className="mobile-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {navigationSections.map((section) => (
                <div key={section.title} className="mobile-nav-section">
                  <div className="mobile-section-header">{section.title}</div>
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mobile-nav-item ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            {/* Search Modal */}
            <div
              className="search-overlay"
              onClick={() => setSearchOpen(false)}
              aria-hidden={!searchOpen}
            >
              <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search oceans, species, data..."
                  autoFocus={searchOpen}
                  aria-label="Search BlueSphere"
                />
              </div>
            </div>
          </>
        )}

        <main id="main-content" className="main-content" role="main">
          {children}
        </main>
      </div>
    </>
  );
};

export default NavigationSystem;