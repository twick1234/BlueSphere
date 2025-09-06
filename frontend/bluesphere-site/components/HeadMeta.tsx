import Head from 'next/head'

export default function HeadMeta(){
  const title = 'BlueSphere — Open, living ocean intelligence'
  const desc = 'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
  const url = 'https://example.com' // replace with GitHub Pages URL if desired
  const ogImage = '/brand/og-image-1200x630.png'
  const twImage = '/brand/twitter-card-1600x900.png'

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={twImage} />
    </Head>
  )
}
