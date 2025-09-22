/*
 * BlueSphere Gallery Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React from 'react';
import WorldClassLayout from '../components/WorldClassLayout';
import MarineGallery from '../components/MarineGallery';

const GalleryPage = () => {
  return (
    <>
      <style jsx>{`
        .hero-section {
          background: linear-gradient(135deg,
            #0ea5e9 0%,
            #3b82f6 25%,
            #1e40af 50%,
            #0f172a 100%
          );
          color: white;
          padding: 4rem 0;
          margin: -24px -16px 0;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-effects {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 30% 80%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ffffff, #e0f2fe, #b3e5fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2rem;
        }

        .cta-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .cta-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          text-decoration: none;
          color: white;
        }

        .gallery-section {
          margin: 0 -16px;
        }

        @media (max-width: 768px) {
          .hero-content {
            padding: 0 1rem;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <WorldClassLayout title="Marine Photography Gallery - BlueSphere">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-effects"></div>
          <div className="hero-content">
            <h1 className="hero-title">📸 Ocean Photography</h1>
            <p className="hero-subtitle">
              Discover the beauty and complexity of our ocean ecosystems through stunning photography
              from researchers, conservationists, and marine scientists around the world.
            </p>
            <div className="cta-buttons">
              <a href="/map" className="cta-btn">🗺️ Live Ocean Data</a>
              <a href="/stories" className="cta-btn">📚 Educational Stories</a>
              <a href="/conservation" className="cta-btn">🛡️ Conservation Action</a>
            </div>
          </div>
        </section>

        {/* Marine Gallery Component */}
        <section className="gallery-section">
          <MarineGallery showFilters={true} maxImages={24} />
        </section>

        {/* Call to Action */}
        <section style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '4rem 0',
          margin: '0 -16px',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              🌊 Share Your Ocean Images
            </h2>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: '0.9' }}>
              Have stunning ocean photography or research imagery? Contribute to our gallery
              and help us showcase the beauty and urgency of ocean conservation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="mailto:gallery@bluesphere.org"
                className="cta-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                📧 Submit Photos
              </a>
              <a
                href="/about"
                className="cta-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                🤝 Partner With Us
              </a>
            </div>
          </div>
        </section>
      </WorldClassLayout>
    </>
  );
};

export default GalleryPage;