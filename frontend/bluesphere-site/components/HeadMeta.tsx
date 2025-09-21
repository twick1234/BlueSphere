import Head from 'next/head'
import { useRouter } from 'next/router'

interface HeadMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  noindex?: boolean;
}

export default function HeadMeta({
  title,
  description,
  keywords,
  canonical,
  noindex = false
}: HeadMetaProps = {}){
  const router = useRouter()
  const defaultTitle = 'BlueSphere — Open, living ocean intelligence'
  const defaultDesc = 'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
  const defaultKeywords = 'ocean monitoring, marine data, sea temperature, ocean currents, marine life tracking, oceanography, blue economy, climate change, marine conservation'

  const finalTitle = title || defaultTitle
  const desc = description || defaultDesc
  const keywordsMeta = keywords || defaultKeywords
  const baseUrl = 'https://bluesphere-frontend.onrender.com'
  const currentUrl = canonical || `${baseUrl}${router.asPath}`
  const ogImage = `${baseUrl}/brand/og-image-1200x630.png`
  const twImage = `${baseUrl}/brand/twitter-card-1600x900.png`

  return (
    <Head>
      <title>{finalTitle}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={keywordsMeta} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="BlueSphere" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={twImage} />
      <meta name="twitter:creator" content="@bluesphere" />
      <meta name="twitter:site" content="@bluesphere" />

      {/* Additional SEO */}
      <meta name="author" content="BlueSphere Team" />
      <meta name="theme-color" content="#0ea5e9" />
      <meta name="application-name" content="BlueSphere" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "BlueSphere",
            "url": baseUrl,
            "description": desc,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </Head>
  )
}
