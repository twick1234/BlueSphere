/*
 * BlueSphere Marine Image Gallery Component
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 */

import React, { useState, useEffect } from 'react';

interface MarineImage {
  id: string;
  src: string;
  title: string;
  description: string;
  category: 'coral' | 'sharks' | 'whales' | 'deep-sea' | 'coastal' | 'arctic' | 'conservation';
  location: string;
  photographer: string;
  date: string;
  tags: string[];
  featured: boolean;
}

interface MarineGalleryProps {
  showFilters?: boolean;
  maxImages?: number;
  featured?: boolean;
  category?: string;
}

const MarineGallery: React.FC<MarineGalleryProps> = ({
  showFilters = true,
  maxImages = 20,
  featured = false,
  category = 'all'
}) => {
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedImage, setSelectedImage] = useState<MarineImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulated marine photography data - in production, this would come from a CMS or API
  const marineImages: MarineImage[] = [
    {
      id: 'coral-1',
      src: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
      title: 'Vibrant Coral Reef Ecosystem',
      description: 'A healthy coral reef teeming with colorful fish and marine life, showcasing the biodiversity that BlueSphere helps protect.',
      category: 'coral',
      location: 'Great Barrier Reef, Australia',
      photographer: 'Marine Conservation Society',
      date: '2024-03-15',
      tags: ['coral', 'reef', 'biodiversity', 'conservation'],
      featured: true
    },
    {
      id: 'shark-1',
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Great White Shark in Natural Habitat',
      description: 'A magnificent great white shark tracked through our OCEARCH integration, demonstrating real-time marine life monitoring.',
      category: 'sharks',
      location: 'Monterey Bay, California',
      photographer: 'OCEARCH',
      date: '2024-02-22',
      tags: ['shark', 'tracking', 'research', 'predator'],
      featured: true
    },
    {
      id: 'whale-1',
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Humpback Whale Migration',
      description: 'Humpback whales during their annual migration, monitored through satellite tracking and acoustic sensors.',
      category: 'whales',
      location: 'Pacific Ocean Migration Route',
      photographer: 'Whale Research Institute',
      date: '2024-01-10',
      tags: ['whale', 'migration', 'acoustic', 'research'],
      featured: false
    },
    {
      id: 'deep-1',
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Deep Sea Thermal Vent',
      description: 'Unique ecosystem around a deep-sea thermal vent, representing unexplored biodiversity in our oceans.',
      category: 'deep-sea',
      location: 'Mid-Atlantic Ridge',
      photographer: 'Deep Ocean Exploration',
      date: '2024-02-05',
      tags: ['deep-sea', 'thermal-vent', 'exploration', 'biodiversity'],
      featured: true
    },
    {
      id: 'coastal-1',
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Coastal Erosion Monitoring',
      description: 'Documenting coastal changes through time-lapse photography and satellite imagery for climate impact assessment.',
      category: 'coastal',
      location: 'Norfolk Coast, UK',
      photographer: 'Climate Research Unit',
      date: '2024-03-01',
      tags: ['coastal', 'erosion', 'climate-change', 'monitoring'],
      featured: false
    },
    {
      id: 'arctic-1',
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Arctic Sea Ice Changes',
      description: 'Dramatic changes in Arctic sea ice extent, captured through satellite monitoring and field research.',
      category: 'arctic',
      location: 'Arctic Ocean, Svalbard',
      photographer: 'Arctic Research Station',
      date: '2024-04-12',
      tags: ['arctic', 'sea-ice', 'climate-change', 'monitoring'],
      featured: true
    },
    {
      id: 'conservation-1',
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Marine Protected Area Success',
      description: 'Thriving marine ecosystem in a protected area, demonstrating the positive impact of conservation efforts.',
      category: 'conservation',
      location: 'Papahānaumokuākea, Hawaii',
      photographer: 'NOAA Marine Sanctuaries',
      date: '2024-03-20',
      tags: ['conservation', 'protected-area', 'recovery', 'success'],
      featured: false
    },
    {
      id: 'coral-2',
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
      title: 'Coral Bleaching Event',
      description: 'Documentation of coral bleaching caused by marine heatwaves, highlighting the urgent need for ocean monitoring.',
      category: 'coral',
      location: 'Maldives',
      photographer: 'Marine Climate Research',
      date: '2024-02-28',
      tags: ['coral-bleaching', 'climate-impact', 'heatwave', 'monitoring'],
      featured: true
    }
  ];

  const categories = [
    { id: 'all', name: 'All Images', icon: '🌊' },
    { id: 'coral', name: 'Coral Reefs', icon: '🪸' },
    { id: 'sharks', name: 'Sharks', icon: '🦈' },
    { id: 'whales', name: 'Whales', icon: '🐋' },
    { id: 'deep-sea', name: 'Deep Sea', icon: '🌑' },
    { id: 'coastal', name: 'Coastal', icon: '🏖️' },
    { id: 'arctic', name: 'Arctic', icon: '🧊' },
    { id: 'conservation', name: 'Conservation', icon: '🛡️' }
  ];

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredImages = marineImages
    .filter(image => {
      if (featured && !image.featured) return false;
      if (selectedCategory !== 'all' && image.category !== selectedCategory) return false;
      if (searchQuery && !image.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    })
    .slice(0, maxImages);

  const openLightbox = (image: MarineImage) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  if (isLoading) {
    return (
      <div className="gallery-loading">
        <div className="loading-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="loading-card">
              <div className="loading-image"></div>
              <div className="loading-content">
                <div className="loading-title"></div>
                <div className="loading-text"></div>
              </div>
            </div>
          ))}
        </div>
        <style jsx>{`
          .gallery-loading {
            padding: 2rem 0;
          }

          .loading-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
          }

          .loading-card {
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }

          .loading-image {
            height: 200px;
            background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
            background-size: 200px 100%;
            animation: shimmer 2s infinite;
          }

          .loading-content {
            padding: 1.5rem;
          }

          .loading-title {
            height: 1.5rem;
            background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
            border-radius: 8px;
            margin-bottom: 1rem;
            animation: shimmer 2s infinite;
          }

          .loading-text {
            height: 1rem;
            background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
            border-radius: 6px;
            width: 70%;
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .marine-gallery {
          padding: 2rem 0;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .gallery-header {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem 2rem;
          text-align: center;
        }

        .gallery-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gallery-subtitle {
          font-size: 1.25rem;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto 2rem;
          line-height: 1.6;
        }

        .gallery-controls {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 3rem;
          align-items: center;
        }

        .search-bar {
          position: relative;
          max-width: 400px;
          width: 100%;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 50px;
          font-size: 1rem;
          background: white;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 1.2rem;
        }

        .category-filters {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .category-btn {
          background: white;
          border: 2px solid #e2e8f0;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .category-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
        }

        .category-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .gallery-item {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0;
          position: relative;
          group: true;
        }

        .gallery-item:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
        }

        .image-container {
          position: relative;
          height: 250px;
          overflow: hidden;
        }

        .gallery-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.4s ease;
        }

        .gallery-item:hover .gallery-image {
          transform: scale(1.1);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(30, 64, 175, 0.9));
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .gallery-item:hover .image-overlay {
          opacity: 1;
        }

        .overlay-icon {
          color: white;
          font-size: 3rem;
          transform: scale(0);
          transition: all 0.3s ease;
        }

        .gallery-item:hover .overlay-icon {
          transform: scale(1);
        }

        .image-content {
          padding: 1.5rem;
        }

        .image-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .image-description {
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 1rem;
          font-size: 0.95rem;
        }

        .image-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .image-location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .image-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .image-tag {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .featured-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          z-index: 2;
        }

        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 2fr 1fr;
          animation: lightboxAppear 0.3s ease;
        }

        .lightbox-image {
          width: 100%;
          height: 70vh;
          object-fit: cover;
        }

        .lightbox-info {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .lightbox-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
        }

        .lightbox-description {
          color: #64748b;
          line-height: 1.6;
        }

        .lightbox-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #64748b;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
        }

        .detail-label {
          font-weight: 600;
          color: #475569;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: scale(1.1);
        }

        @keyframes lightboxAppear {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 1024px) {
          .lightbox-content {
            grid-template-columns: 1fr;
            max-width: 95vw;
          }

          .lightbox-image {
            height: 40vh;
          }
        }

        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: 1fr;
            padding: 0 1rem;
          }

          .gallery-controls {
            padding: 0 1rem;
          }

          .category-filters {
            gap: 0.5rem;
          }

          .category-btn {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
          }

          .gallery-title {
            font-size: 2rem;
          }

          .lightbox-content {
            margin: 1rem;
            max-width: calc(100vw - 2rem);
            max-height: calc(100vh - 2rem);
          }

          .lightbox-info {
            padding: 1rem;
          }
        }
      `}</style>

      <div className="marine-gallery">
        <div className="gallery-header">
          <h2 className="gallery-title">🌊 Marine Photography Gallery</h2>
          <p className="gallery-subtitle">
            Explore stunning visuals from our ocean monitoring network, showcasing the beauty
            and fragility of marine ecosystems we work to protect.
          </p>
        </div>

        {showFilters && (
          <div className="gallery-controls">
            <div className="search-bar">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search images..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="category-filters">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="gallery-grid">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="gallery-item"
              onClick={() => openLightbox(image)}
            >
              {image.featured && (
                <div className="featured-badge">
                  ⭐ Featured
                </div>
              )}

              <div className="image-container">
                <img
                  src={image.src}
                  alt={image.title}
                  className="gallery-image"
                />
                <div className="image-overlay">
                  <div className="overlay-icon">🔍</div>
                </div>
              </div>

              <div className="image-content">
                <h3 className="image-title">{image.title}</h3>
                <p className="image-description">{image.description}</p>

                <div className="image-meta">
                  <div className="image-location">
                    <span>📍</span>
                    <span>{image.location}</span>
                  </div>
                  <span>{new Date(image.date).toLocaleDateString()}</span>
                </div>

                <div className="image-tags">
                  {image.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="image-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌊</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No images found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedImage && (
          <div className="lightbox" onClick={closeLightbox}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeLightbox}>×</button>

              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="lightbox-image"
              />

              <div className="lightbox-info">
                <h2 className="lightbox-title">{selectedImage.title}</h2>
                <p className="lightbox-description">{selectedImage.description}</p>

                <div className="lightbox-details">
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span>{selectedImage.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Photographer:</span>
                    <span>{selectedImage.photographer}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span>{new Date(selectedImage.date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Category:</span>
                    <span>{selectedImage.category}</span>
                  </div>
                </div>

                <div className="image-tags">
                  {selectedImage.tags.map((tag) => (
                    <span key={tag} className="image-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MarineGallery;