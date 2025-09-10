import { render } from '@testing-library/react'
import HeadMeta from '../../components/HeadMeta'

// Mock next/head
jest.mock('next/head', () => {
  return function Head({ children }: { children: React.ReactNode }) {
    return <div data-testid="head">{children}</div>
  }
})

describe('HeadMeta Component', () => {
  it('renders without crashing', () => {
    render(<HeadMeta />)
  })

  it('contains the correct title', () => {
    const { container } = render(<HeadMeta />)
    
    const titleElement = container.querySelector('title')
    expect(titleElement).toBeInTheDocument()
    expect(titleElement?.textContent).toBe('BlueSphere — Open, living ocean intelligence')
  })

  it('contains the correct meta description', () => {
    const { container } = render(<HeadMeta />)
    
    const metaDescription = container.querySelector('meta[name="description"]')
    expect(metaDescription).toBeInTheDocument()
    expect(metaDescription?.getAttribute('content')).toBe(
      'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
    )
  })

  it('contains correct Open Graph meta tags', () => {
    const { container } = render(<HeadMeta />)
    
    // OG Title
    const ogTitle = container.querySelector('meta[property="og:title"]')
    expect(ogTitle).toBeInTheDocument()
    expect(ogTitle?.getAttribute('content')).toBe('BlueSphere — Open, living ocean intelligence')
    
    // OG Description
    const ogDescription = container.querySelector('meta[property="og:description"]')
    expect(ogDescription).toBeInTheDocument()
    expect(ogDescription?.getAttribute('content')).toBe(
      'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
    )
    
    // OG Image
    const ogImage = container.querySelector('meta[property="og:image"]')
    expect(ogImage).toBeInTheDocument()
    expect(ogImage?.getAttribute('content')).toBe('/brand/og-image-1200x630.png')
    
    // OG Type
    const ogType = container.querySelector('meta[property="og:type"]')
    expect(ogType).toBeInTheDocument()
    expect(ogType?.getAttribute('content')).toBe('website')
    
    // OG URL
    const ogUrl = container.querySelector('meta[property="og:url"]')
    expect(ogUrl).toBeInTheDocument()
    expect(ogUrl?.getAttribute('content')).toBe('https://example.com')
  })

  it('contains correct Twitter meta tags', () => {
    const { container } = render(<HeadMeta />)
    
    // Twitter Card
    const twitterCard = container.querySelector('meta[name="twitter:card"]')
    expect(twitterCard).toBeInTheDocument()
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image')
    
    // Twitter Title
    const twitterTitle = container.querySelector('meta[name="twitter:title"]')
    expect(twitterTitle).toBeInTheDocument()
    expect(twitterTitle?.getAttribute('content')).toBe('BlueSphere — Open, living ocean intelligence')
    
    // Twitter Description
    const twitterDescription = container.querySelector('meta[name="twitter:description"]')
    expect(twitterDescription).toBeInTheDocument()
    expect(twitterDescription?.getAttribute('content')).toBe(
      'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
    )
    
    // Twitter Image
    const twitterImage = container.querySelector('meta[name="twitter:image"]')
    expect(twitterImage).toBeInTheDocument()
    expect(twitterImage?.getAttribute('content')).toBe('/brand/twitter-card-1600x900.png')
  })

  it('renders all meta tags with correct structure', () => {
    const { container } = render(<HeadMeta />)
    
    // Count all meta tags
    const allMetaTags = container.querySelectorAll('meta')
    expect(allMetaTags).toHaveLength(9) // 1 description + 4 og + 4 twitter
    
    // Ensure title tag exists
    const titleTag = container.querySelector('title')
    expect(titleTag).toBeInTheDocument()
  })

  it('has consistent title and descriptions across platforms', () => {
    const { container } = render(<HeadMeta />)
    
    const title = 'BlueSphere — Open, living ocean intelligence'
    const description = 'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
    
    // Check title consistency
    expect(container.querySelector('title')?.textContent).toBe(title)
    expect(container.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(title)
    expect(container.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(title)
    
    // Check description consistency
    expect(container.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(description)
    expect(container.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(description)
    expect(container.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe(description)
  })

  it('uses correct image paths', () => {
    const { container } = render(<HeadMeta />)
    
    const ogImage = container.querySelector('meta[property="og:image"]')?.getAttribute('content')
    const twitterImage = container.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
    
    expect(ogImage).toBe('/brand/og-image-1200x630.png')
    expect(twitterImage).toBe('/brand/twitter-card-1600x900.png')
    
    // Ensure different images are used for different platforms
    expect(ogImage).not.toBe(twitterImage)
  })
})