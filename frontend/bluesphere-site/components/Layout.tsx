/*
 * BlueSphere Layout Component - Complete Redesign
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Inspired by GitHub, Linear, and Vercel's navigation patterns
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import HeadMeta from './HeadMeta'

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showNavigation = true
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => router.pathname === path;

  const navItems = [
    { name: 'Ocean Map', href: '/map' },
    { name: 'Shark Tracker', href: '/sharks' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Stories', href: '/stories' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' }
  ];

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
      `}</style>

      <style jsx>{`
        /* Header */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid ${scrolled ? '#d0d7de' : 'transparent'};
          transition: all 0.2s ease;
        }

        @media (prefers-color-scheme: dark) {
          .header {
            background-color: rgba(13, 17, 23, 0.8);
            border-bottom-color: ${scrolled ? '#30363d' : 'transparent'};
          }
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

        /* Brand */
        .brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #24292f;
          font-weight: 600;
          font-size: 18px;
          transition: opacity 0.2s ease;
        }

        .brand:hover {
          opacity: 0.7;
          text-decoration: none;
          color: #24292f;
        }

        @media (prefers-color-scheme: dark) {
          .brand {
            color: #e6edf3;
          }
          .brand:hover {
            color: #e6edf3;
          }
        }

        .brand-icon {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          margin-right: 12px;
        }

        /* Desktop Navigation */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-link {
          padding: 8px 16px;
          text-decoration: none;
          color: #656d76;
          font-weight: 500;
          font-size: 14px;
          border-radius: 6px;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .nav-link:hover {
          color: #24292f;
          background-color: #f6f8fa;
          text-decoration: none;
        }

        .nav-link.active {
          color: #0969da;
          background-color: #ddf4ff;
        }

        @media (prefers-color-scheme: dark) {
          .nav-link {
            color: #7d8590;
          }
          .nav-link:hover {
            color: #e6edf3;
            background-color: #21262d;
          }
          .nav-link.active {
            color: #58a6ff;
            background-color: #0d419d;
          }
        }

        /* Mobile menu button */
        .mobile-menu-button {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid #d0d7de;
          background-color: #f6f8fa;
          color: #24292f;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mobile-menu-button:hover {
          background-color: #f3f4f6;
        }

        @media (prefers-color-scheme: dark) {
          .mobile-menu-button {
            border-color: #30363d;
            background-color: #21262d;
            color: #e6edf3;
          }
          .mobile-menu-button:hover {
            background-color: #30363d;
          }
        }

        /* Mobile menu overlay */
        .mobile-menu-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1001;
          opacity: ${mobileMenuOpen ? '1' : '0'};
          visibility: ${mobileMenuOpen ? 'visible' : 'hidden'};
          transition: all 0.2s ease;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 280px;
          height: 100vh;
          background-color: #ffffff;
          border-left: 1px solid #d0d7de;
          transform: translateX(${mobileMenuOpen ? '0' : '100%'});
          transition: transform 0.3s ease;
          overflow-y: auto;
          z-index: 1002;
        }

        @media (prefers-color-scheme: dark) {
          .mobile-menu {
            background-color: #0d1117;
            border-left-color: #30363d;
          }
        }

        .mobile-menu-header {
          padding: 16px 20px;
          border-bottom: 1px solid #d0d7de;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        @media (prefers-color-scheme: dark) {
          .mobile-menu-header {
            border-bottom-color: #30363d;
          }
        }

        .mobile-close {
          width: 32px;
          height: 32px;
          border: 1px solid #d0d7de;
          background-color: #f6f8fa;
          color: #24292f;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .mobile-close:hover {
          background-color: #f3f4f6;
        }

        @media (prefers-color-scheme: dark) {
          .mobile-close {
            border-color: #30363d;
            background-color: #21262d;
            color: #e6edf3;
          }
          .mobile-close:hover {
            background-color: #30363d;
          }
        }

        .mobile-nav {
          padding: 16px 0;
        }

        .mobile-nav-link {
          display: block;
          padding: 12px 20px;
          text-decoration: none;
          color: #24292f;
          font-weight: 500;
          font-size: 16px;
          border-left: 3px solid transparent;
          transition: all 0.15s ease;
        }

        .mobile-nav-link:hover {
          background-color: #f6f8fa;
          border-left-color: #d0d7de;
          text-decoration: none;
          color: #24292f;
        }

        .mobile-nav-link.active {
          background-color: #ddf4ff;
          border-left-color: #0969da;
          color: #0969da;
        }

        @media (prefers-color-scheme: dark) {
          .mobile-nav-link {
            color: #e6edf3;
          }
          .mobile-nav-link:hover {
            background-color: #21262d;
            border-left-color: #30363d;
            color: #e6edf3;
          }
          .mobile-nav-link.active {
            background-color: #0d419d;
            border-left-color: #58a6ff;
            color: #58a6ff;
          }
        }

        /* Main content */
        .main-content {
          padding-top: 64px;
          min-height: 100vh;
        }

        /* Responsive */
        @media (max-width: 768px) {
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

        /* Footer */
        .footer {
          border-top: 1px solid #d0d7de;
          margin-top: 64px;
          padding: 40px 0;
          background-color: #f6f8fa;
        }

        @media (prefers-color-scheme: dark) {
          .footer {
            border-top-color: #30363d;
            background-color: #161b22;
          }
        }

        .footer-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 32px;
        }

        .footer-section h4 {
          margin: 0 0 16px 0;
          color: #24292f;
          font-weight: 600;
          font-size: 14px;
        }

        @media (prefers-color-scheme: dark) {
          .footer-section h4 {
            color: #e6edf3;
          }
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-link {
          color: #656d76;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s ease;
        }

        .footer-link:hover {
          color: #0969da;
          text-decoration: none;
        }

        @media (prefers-color-scheme: dark) {
          .footer-link {
            color: #7d8590;
          }
          .footer-link:hover {
            color: #58a6ff;
          }
        }

        .footer-bottom {
          max-width: 1280px;
          margin: 32px auto 0;
          padding: 16px 24px 0;
          border-top: 1px solid #d0d7de;
          color: #656d76;
          font-size: 12px;
          text-align: center;
        }

        @media (prefers-color-scheme: dark) {
          .footer-bottom {
            border-top-color: #30363d;
            color: #7d8590;
          }
        }
      `}</style>

      <div>
        <HeadMeta />

        {showNavigation && (
          <>
            <header className="header">
              <div className="header-content">
                <Link href="/" className="brand">
                  <div className="brand-icon">🌊</div>
                  BlueSphere
                </Link>

                <nav className="desktop-nav">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                <button
                  className="mobile-menu-button"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Bars3Icon width={18} height={18} />
                </button>
              </div>
            </header>

            {/* Mobile menu */}
            <div
              className="mobile-menu-overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="mobile-menu">
              <div className="mobile-menu-header">
                <Link href="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
                  <div className="brand-icon">🌊</div>
                  BlueSphere
                </Link>
                <button
                  className="mobile-close"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <XMarkIcon width={16} height={16} />
                </button>
              </div>
              <nav className="mobile-nav">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-nav-link ${isActive(item.href) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </>
        )}

        <main className="main-content">
          {children}
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Ocean Monitoring</h4>
              <div className="footer-links">
                <Link href="/map" className="footer-link">Live Ocean Map</Link>
                <Link href="/sharks" className="footer-link">Shark Tracker</Link>
                <Link href="/analytics" className="footer-link">Data Analytics</Link>
              </div>
            </div>

            <div className="footer-section">
              <h4>Explore</h4>
              <div className="footer-links">
                <Link href="/stories" className="footer-link">Ocean Stories</Link>
                <Link href="/gallery" className="footer-link">Marine Gallery</Link>
                <Link href="/conservation" className="footer-link">Conservation</Link>
              </div>
            </div>

            <div className="footer-section">
              <h4>Resources</h4>
              <div className="footer-links">
                <Link href="/about" className="footer-link">About BlueSphere</Link>
                <Link href="/docs" className="footer-link">Documentation</Link>
                <a
                  href="https://github.com/twick1234/BlueSphere"
                  className="footer-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            © {new Date().getFullYear()} BlueSphere - Advanced Ocean Monitoring Platform
          </div>
        </footer>
      </div>
    </>
  )
}

export default Layout