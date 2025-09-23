// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export only for GitHub Pages deployment
  // For development and Render deployment, we'll use server-side rendering with API routes
  output: process.env.DEPLOYMENT_TARGET === 'github-pages' ? 'export' : 'standalone',
  trailingSlash: true,
  
  // Production environment configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bluesphere-api.onrender.com',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://bluesphere-frontend.onrender.com',
  },

  // Image optimization configuration
  images: {
    unoptimized: process.env.DEPLOYMENT_TARGET === 'github-pages',
    domains: [
      'bluesphere-api.onrender.com',
      'coastwatch.pfeg.noaa.gov',
      'www.ndbc.noaa.gov',
      'images.unsplash.com',
      'localhost'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' https: wss:; frame-src 'self';"
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },

  // Asset optimization for production
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  
  // Disable server-side features for static export
  experimental: {
    // Ensure no server-side features are used in static export
  },

  // Build optimization
  swcMinify: true,
  
  // Static export configuration
  distDir: '.next',
  
  // Webpack configuration for production optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            // Separate chunk for Leaflet to enable better caching
            leaflet: {
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
              name: 'leaflet',
              chunks: 'all',
              priority: 30,
            },
            // Separate chunk for D3 and visualization libraries
            viz: {
              test: /[\\/]node_modules[\\/](d3|react-chartjs-2|chart\.js)[\\/]/,
              name: 'visualization',
              chunks: 'all',
              priority: 25,
            },
            // React and common utilities
            common: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      }
    }

    // Bundle analyzer in production builds (optional)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
    }

    // Preload critical resources
    config.module.rules.push({
      test: /\.(js|ts|tsx)$/,
      include: [/components\/OceanMap/, /components\/SharkMap/],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          plugins: [['import', { libraryName: 'leaflet', libraryDirectory: 'dist' }]]
        }
      }
    });

    return config
  }
}

module.exports = nextConfig
