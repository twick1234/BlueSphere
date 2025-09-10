// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export only for GitHub Pages deployment
  // For Render deployment, we'll use server-side rendering with API routes
  output: process.env.DEPLOYMENT_TARGET === 'github-pages' ? 'export' : undefined,
  trailingSlash: true,
  
  // Production environment configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bluesphere-api.onrender.com',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://bluesphere-frontend.onrender.com',
  },

  // Image optimization disabled for static export
  images: {
    unoptimized: true,
    domains: [
      'bluesphere-api.onrender.com',
      'coastwatch.pfeg.noaa.gov',
      'www.ndbc.noaa.gov'
    ]
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
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
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

    return config
  }
}

module.exports = nextConfig
