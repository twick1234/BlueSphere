/*
 * BlueSphere Optimized Image Component
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * High-performance image component with lazy loading and optimization
 */

import React, { useState, useRef, useEffect } from 'react';
import { getOptimizedImageSrc, createIntersectionObserver, getConnectionInfo } from '../lib/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 800,
  height,
  quality = 80,
  priority = false,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y3ZjhmOSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIj5Mb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4K',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || typeof window === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const observer = createIntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer?.unobserve(entry.target);
        }
      });
    });

    if (observer && imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    onError?.(event.nativeEvent);
  };

  // Get optimized image source
  const getImageSrc = (): string => {
    if (!isIntersecting) return placeholder;

    try {
      return getOptimizedImageSrc(src, width, quality);
    } catch (error) {
      console.error('Failed to optimize image source:', error);
      return src;
    }
  };

  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    const connection = getConnectionInfo();
    const aspectRatio = height && width ? height / width : 0.5;

    // Reduce dimensions for slower connections
    let responsiveWidth = width;
    if (connection.effectiveType === '2g') {
      responsiveWidth = Math.min(width, 600);
    } else if (connection.effectiveType === '3g') {
      responsiveWidth = Math.min(width, 800);
    }

    return {
      width: responsiveWidth,
      height: height || Math.round(responsiveWidth * aspectRatio)
    };
  };

  const dimensions = getResponsiveDimensions();

  // Error fallback
  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center text-gray-500 text-sm ${className}`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          minHeight: '200px'
        }}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">📷</div>
          <div>Image failed to load</div>
          <div className="text-xs mt-1 opacity-75">{alt}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
          style={{
            backgroundImage: `url("${placeholder}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="text-gray-400 text-sm">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={getImageSrc()}
        alt={alt}
        width={dimensions.width}
        height={dimensions.height}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${priority ? '' : 'lazy'}
        `}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%'
        }}
      />

      {/* Progressive enhancement overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-transparent to-green-50 opacity-30 animate-pulse" />
      )}
    </div>
  );
};

export default OptimizedImage;