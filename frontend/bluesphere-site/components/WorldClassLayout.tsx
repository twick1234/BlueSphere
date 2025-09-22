/*
 * World-Class Layout System for BlueSphere
 * Inspired by Linear, Stripe, Figma, and other industry leaders
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  HomeIcon,
  MapIcon,
  BeakerIcon,
  HeartIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  name: string;
  items: NavItem[];
}

const WorldClassLayout: React.FC<LayoutProps> = ({
  children,
  title = "BlueSphere — Marine Monitoring Platform",
  description = "Advanced ocean monitoring and marine conservation platform powered by AI and real-time data visualization",
  keywords = "ocean monitoring, marine data, shark tracking, climate science"
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const router = useRouter();

  // Navigation configuration
  const navigation: NavSection[] = [
    {
      name: 'Platform',
      items: [
        { name: 'Ocean Map', href: '/map', icon: MapIcon },
        { name: 'Shark Tracking', href: '/sharks', icon: ChartBarIcon },
        { name: 'Species AI', href: '/species-ai', icon: BeakerIcon },
        { name: 'Advanced Mapping', href: '/mapping', icon: MapIcon }
      ]
    },
    {
      name: 'Data',
      items: [
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
        { name: 'Historical', href: '/historical', icon: ChartBarIcon },
        { name: 'Time-lapse', href: '/timelapse', icon: ChartBarIcon }
      ]
    },
    {
      name: 'Conservation',
      items: [
        { name: 'Action Center', href: '/conservation', icon: HeartIcon },
        { name: 'Crisis Response', href: '/crisis', icon: HeartIcon },
        { name: 'Impact Stories', href: '/stories', icon: HeartIcon }
      ]
    },
    {
      name: 'Learn',
      items: [
        { name: 'Education', href: '/education', icon: AcademicCapIcon },
        { name: 'Gallery', href: '/gallery', icon: AcademicCapIcon },
        { name: 'About', href: '/about', icon: AcademicCapIcon }
      ]
    }
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [router.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>

      <style jsx global>{`
        /* Modern CSS Reset */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          font-size: 16px;
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: #fafbfc;
          color: #1a202c;
          line-height: 1.6;
        }

        /* Focus management */
        :focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        :focus:not(:focus-visible) {
          outline: none;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* World-class header design */
        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Logo section */
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #1a202c;
          font-weight: 700;
          font-size: 20px;
          transition: opacity 0.2s ease;
        }

        .logo:hover {
          opacity: 0.8;
        }

        .logo-icon {
          font-size: 24px;
        }

        /* Desktop navigation */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-item {
          position: relative;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          border: none;
          background: none;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .nav-button:hover {
          color: #1a202c;
          background: rgba(0, 0, 0, 0.04);
        }

        .nav-button.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        /* Dropdown menus with proper z-index */
        .dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 240px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 8px;
          z-index: 1000;
          opacity: 0;
          transform: translateY(-4px);
          animation: dropdown-enter 0.15s ease forwards;
        }

        @keyframes dropdown-enter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          text-decoration: none;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .dropdown-item:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #1a202c;
        }

        .dropdown-item-icon {
          width: 16px;
          height: 16px;
          color: #9ca3af;
        }

        /* Mobile menu button */
        .mobile-menu-button {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: none;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mobile-menu-button:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #1a202c;
        }

        /* Mobile menu overlay */
        .mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 60;
          display: none;
        }

        .mobile-menu.open {
          display: block;
          animation: overlay-enter 0.2s ease;
        }

        .mobile-menu-panel {
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 320px;
          height: 100vh;
          background: white;
          padding: 24px;
          transform: translateX(100%);
          animation: panel-enter 0.25s ease forwards;
        }

        @keyframes overlay-enter {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes panel-enter {
          to { transform: translateX(0); }
        }

        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
        }

        .mobile-nav-section {
          margin-bottom: 32px;
        }

        .mobile-nav-title {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          text-decoration: none;
          color: #374151;
          font-size: 16px;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .mobile-nav-item:hover {
          color: #3b82f6;
        }

        .mobile-nav-item.active {
          color: #3b82f6;
        }

        /* Main content */
        .main {
          flex: 1;
          min-height: calc(100vh - 64px);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .nav-desktop {
            display: none;
          }

          .mobile-menu-button {
            display: flex;
          }

          .header-content {
            padding: 0 16px;
          }
        }
      `}</style>

      <div className="layout">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            {/* Logo */}
            <Link href="/" className="logo">
              <span className="logo-icon">🌊</span>
              <span>BlueSphere</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="nav-desktop">
              {navigation.map((section) => (
                <div key={section.name} className="nav-item">
                  <button
                    className={`nav-button ${activeDropdown === section.name ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === section.name ? null : section.name);
                    }}
                  >
                    {section.name}
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>

                  {activeDropdown === section.name && (
                    <div className="dropdown">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="dropdown-item"
                        >
                          {item.icon && <item.icon className="dropdown-item-icon" />}
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-panel">
            <div className="mobile-menu-header">
              <Link href="/" className="logo">
                <span className="logo-icon">🌊</span>
                <span>BlueSphere</span>
              </Link>
              <button
                className="mobile-menu-button"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {navigation.map((section) => (
              <div key={section.name} className="mobile-nav-section">
                <div className="mobile-nav-title">{section.name}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-nav-item ${router.pathname === item.href ? 'active' : ''}`}
                  >
                    {item.icon && <item.icon className="w-5 h-5" />}
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="main">
          {children}
        </main>
      </div>
    </>
  );
};

export default WorldClassLayout;