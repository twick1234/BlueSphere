import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Leaflet CSS - moved from pages to document for proper loading */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* Performance optimizations */}
        <link rel="preload" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" as="style" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" as="style" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//unpkg.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//bluesphere-api.onrender.com" />
        <link rel="dns-prefetch" href="//coastwatch.pfeg.noaa.gov" />
        <link rel="dns-prefetch" href="//www.ndbc.noaa.gov" />

        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://unpkg.com" />
        <link rel="preconnect" href="https://bluesphere-api.onrender.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}