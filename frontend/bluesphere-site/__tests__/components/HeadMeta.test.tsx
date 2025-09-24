import { render } from '@testing-library/react'
import HeadMeta from '../../components/HeadMeta'
import { mockRouter } from '../utils/test-utils'

// Mock next/head to properly handle document head updates
jest.mock('next/head', () => {
  return function Head({ children }: { children: React.ReactNode }) {
    // Simulate how Next.js Head component actually works by adding to document.head
    const headElement = document.head
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = children as string

    // Move children to actual document head for testing
    Array.from(tempDiv.children).forEach(child => {
      headElement.appendChild(child.cloneNode(true))
    })

    return <div data-testid="head">{children}</div>
  }
})

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

describe('HeadMeta Component', () => {
  beforeEach(() => {
    // Clear document head before each test
    document.head.innerHTML = ''
    // Reset router state
    mockRouter.asPath = '/'
    mockRouter.pathname = '/'
    mockRouter.query = {}
  })

  afterEach(() => {
    // Clean up after each test
    document.head.innerHTML = ''
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<HeadMeta />)
    })

    it('renders with default props successfully', () => {
      const { container } = render(<HeadMeta />)
      expect(container.querySelector('[data-testid="head"]')).toBeInTheDocument()
    })

    it('renders with all props provided', () => {
      const props = {
        title: 'Custom Title',
        description: 'Custom Description',
        keywords: 'custom, keywords, test',
        canonical: 'https://example.com/custom',
        noindex: true
      }

      const { container } = render(<HeadMeta {...props} />)
      expect(container.querySelector('[data-testid="head"]')).toBeInTheDocument()
    })
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
    expect(ogImage?.getAttribute('content')).toBe('https://bluesphere-frontend.onrender.com/brand/og-image-1200x630.png')
    
    // OG Type
    const ogType = container.querySelector('meta[property="og:type"]')
    expect(ogType).toBeInTheDocument()
    expect(ogType?.getAttribute('content')).toBe('website')
    
    // OG URL
    const ogUrl = container.querySelector('meta[property="og:url"]')
    expect(ogUrl).toBeInTheDocument()
    expect(ogUrl?.getAttribute('content')).toBe('https://bluesphere-frontend.onrender.com/')
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
    expect(twitterImage?.getAttribute('content')).toBe('https://bluesphere-frontend.onrender.com/brand/twitter-card-1600x900.png')
  })

  it('renders all meta tags with correct structure', () => {
    const { container } = render(<HeadMeta />)
    
    // Count all meta tags
    const allMetaTags = container.querySelectorAll('meta')
    expect(allMetaTags.length).toBeGreaterThanOrEqual(10) // At least the basic meta tags
    
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

    expect(ogImage).toBe('https://bluesphere-frontend.onrender.com/brand/og-image-1200x630.png')
    expect(twitterImage).toBe('https://bluesphere-frontend.onrender.com/brand/twitter-card-1600x900.png')

    // Ensure different images are used for different platforms
    expect(ogImage).not.toBe(twitterImage)
  })

  describe('Props Handling', () => {
    it('uses custom title when provided', () => {
      const customTitle = 'Custom Marine Research Platform'
      const { container } = render(<HeadMeta title={customTitle} />)

      const titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe(customTitle)

      const ogTitle = container.querySelector('meta[property="og:title"]')
      expect(ogTitle?.getAttribute('content')).toBe(customTitle)

      const twitterTitle = container.querySelector('meta[name="twitter:title"]')
      expect(twitterTitle?.getAttribute('content')).toBe(customTitle)
    })

    it('uses custom description when provided', () => {
      const customDescription = 'Custom description for marine platform testing'
      const { container } = render(<HeadMeta description={customDescription} />)

      const metaDescription = container.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(customDescription)

      const ogDescription = container.querySelector('meta[property="og:description"]')
      expect(ogDescription?.getAttribute('content')).toBe(customDescription)

      const twitterDescription = container.querySelector('meta[name="twitter:description"]')
      expect(twitterDescription?.getAttribute('content')).toBe(customDescription)
    })

    it('uses custom keywords when provided', () => {
      const customKeywords = 'custom, marine, testing, keywords'
      const { container } = render(<HeadMeta keywords={customKeywords} />)

      const metaKeywords = container.querySelector('meta[name="keywords"]')
      expect(metaKeywords?.getAttribute('content')).toBe(customKeywords)
    })

    it('uses custom canonical URL when provided', () => {
      const customCanonical = 'https://example.com/custom-page'
      const { container } = render(<HeadMeta canonical={customCanonical} />)

      const canonicalLink = container.querySelector('link[rel="canonical"]')
      expect(canonicalLink?.getAttribute('href')).toBe(customCanonical)

      const ogUrl = container.querySelector('meta[property="og:url"]')
      expect(ogUrl?.getAttribute('content')).toBe(customCanonical)
    })

    it('handles noindex correctly when true', () => {
      const { container } = render(<HeadMeta noindex={true} />)

      const robotsMeta = container.querySelector('meta[name="robots"]')
      expect(robotsMeta?.getAttribute('content')).toBe('noindex,nofollow')
    })

    it('does not render robots meta when noindex is false', () => {
      const { container } = render(<HeadMeta noindex={false} />)

      const robotsMeta = container.querySelector('meta[name="robots"]')
      expect(robotsMeta).not.toBeInTheDocument()
    })

    it('handles undefined props gracefully', () => {
      const { container } = render(<HeadMeta title={undefined} description={undefined} />)

      // Should fall back to defaults
      const titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe('BlueSphere — Open, living ocean intelligence')

      const metaDescription = container.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(
        'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
      )
    })
  })

  describe('Router Integration', () => {
    it('constructs correct URL from router.asPath', () => {
      mockRouter.asPath = '/marine-data/sharks'
      const { container } = render(<HeadMeta />)

      const ogUrl = container.querySelector('meta[property="og:url"]')
      expect(ogUrl?.getAttribute('content')).toBe('https://bluesphere-frontend.onrender.com/marine-data/sharks')

      const canonicalLink = container.querySelector('link[rel="canonical"]')
      expect(canonicalLink?.getAttribute('href')).toBe('https://bluesphere-frontend.onrender.com/marine-data/sharks')
    })

    it('handles router query parameters correctly', () => {
      mockRouter.asPath = '/search?q=ocean+temperature&filter=recent'
      const { container } = render(<HeadMeta />)

      const ogUrl = container.querySelector('meta[property="og:url"]')
      expect(ogUrl?.getAttribute('content')).toBe('https://bluesphere-frontend.onrender.com/search?q=ocean+temperature&filter=recent')
    })

    it('handles root path correctly', () => {
      mockRouter.asPath = '/'
      const { container } = render(<HeadMeta />)

      const ogUrl = container.querySelector('meta[property="og:url"]')
      expect(ogUrl?.getAttribute('content')).toBe('https://bluesphere-frontend.onrender.com/')
    })
  })

  describe('SEO Meta Tags', () => {
    it('includes all essential SEO meta tags', () => {
      const { container } = render(<HeadMeta />)

      // Basic SEO tags
      expect(container.querySelector('meta[name="description"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="keywords"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="viewport"]')).toBeInTheDocument()
      expect(container.querySelector('meta[charset="utf-8"]')).toBeInTheDocument()
      expect(container.querySelector('link[rel="canonical"]')).toBeInTheDocument()

      // Additional SEO tags
      expect(container.querySelector('meta[name="author"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="theme-color"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="application-name"]')).toBeInTheDocument()
    })

    it('has correct viewport meta tag', () => {
      const { container } = render(<HeadMeta />)

      const viewport = container.querySelector('meta[name="viewport"]')
      expect(viewport?.getAttribute('content')).toBe('width=device-width, initial-scale=1')
    })

    it('has correct charset declaration', () => {
      const { container } = render(<HeadMeta />)

      const charset = container.querySelector('meta[charset]')
      expect(charset?.getAttribute('charset')).toBe('utf-8')
    })

    it('has correct theme color', () => {
      const { container } = render(<HeadMeta />)

      const themeColor = container.querySelector('meta[name="theme-color"]')
      expect(themeColor?.getAttribute('content')).toBe('#0ea5e9')
    })

    it('has correct application name', () => {
      const { container } = render(<HeadMeta />)

      const appName = container.querySelector('meta[name="application-name"]')
      expect(appName?.getAttribute('content')).toBe('BlueSphere')
    })

    it('has correct author', () => {
      const { container } = render(<HeadMeta />)

      const author = container.querySelector('meta[name="author"]')
      expect(author?.getAttribute('content')).toBe('BlueSphere Team')
    })
  })

  describe('Open Graph Tags', () => {
    it('includes all required Open Graph tags', () => {
      const { container } = render(<HeadMeta />)

      expect(container.querySelector('meta[property="og:title"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:description"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:image"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:image:width"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:image:height"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:type"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:url"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:site_name"]')).toBeInTheDocument()
      expect(container.querySelector('meta[property="og:locale"]')).toBeInTheDocument()
    })

    it('has correct Open Graph image dimensions', () => {
      const { container } = render(<HeadMeta />)

      const ogImageWidth = container.querySelector('meta[property="og:image:width"]')
      expect(ogImageWidth?.getAttribute('content')).toBe('1200')

      const ogImageHeight = container.querySelector('meta[property="og:image:height"]')
      expect(ogImageHeight?.getAttribute('content')).toBe('630')
    })

    it('has correct Open Graph site name', () => {
      const { container } = render(<HeadMeta />)

      const siteName = container.querySelector('meta[property="og:site_name"]')
      expect(siteName?.getAttribute('content')).toBe('BlueSphere')
    })

    it('has correct Open Graph locale', () => {
      const { container } = render(<HeadMeta />)

      const locale = container.querySelector('meta[property="og:locale"]')
      expect(locale?.getAttribute('content')).toBe('en_US')
    })

    it('has correct Open Graph type', () => {
      const { container } = render(<HeadMeta />)

      const type = container.querySelector('meta[property="og:type"]')
      expect(type?.getAttribute('content')).toBe('website')
    })
  })

  describe('Twitter Card Tags', () => {
    it('includes all required Twitter Card tags', () => {
      const { container } = render(<HeadMeta />)

      expect(container.querySelector('meta[name="twitter:card"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="twitter:title"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="twitter:description"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="twitter:image"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="twitter:creator"]')).toBeInTheDocument()
      expect(container.querySelector('meta[name="twitter:site"]')).toBeInTheDocument()
    })

    it('has correct Twitter card type', () => {
      const { container } = render(<HeadMeta />)

      const cardType = container.querySelector('meta[name="twitter:card"]')
      expect(cardType?.getAttribute('content')).toBe('summary_large_image')
    })

    it('has correct Twitter creator and site', () => {
      const { container } = render(<HeadMeta />)

      const creator = container.querySelector('meta[name="twitter:creator"]')
      expect(creator?.getAttribute('content')).toBe('@bluesphere')

      const site = container.querySelector('meta[name="twitter:site"]')
      expect(site?.getAttribute('content')).toBe('@bluesphere')
    })
  })

  describe('Structured Data', () => {
    it('includes valid JSON-LD structured data', () => {
      const { container } = render(<HeadMeta />)

      const structuredData = container.querySelector('script[type="application/ld+json"]')
      expect(structuredData).toBeInTheDocument()

      // Parse and validate JSON-LD
      const jsonContent = structuredData?.textContent
      expect(jsonContent).toBeTruthy()

      let parsedData
      expect(() => {
        parsedData = JSON.parse(jsonContent!)
      }).not.toThrow()

      expect(parsedData).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'BlueSphere',
        url: 'https://bluesphere-frontend.onrender.com',
        description: 'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://bluesphere-frontend.onrender.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      })
    })

    it('has correct search action in structured data', () => {
      const { container } = render(<HeadMeta />)

      const structuredData = container.querySelector('script[type="application/ld+json"]')
      const jsonContent = structuredData?.textContent
      const parsedData = JSON.parse(jsonContent!)

      expect(parsedData.potentialAction).toEqual({
        '@type': 'SearchAction',
        target: 'https://bluesphere-frontend.onrender.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      })
    })
  })

  describe('Default Values', () => {
    it('uses correct default title', () => {
      const { container } = render(<HeadMeta />)

      const titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe('BlueSphere — Open, living ocean intelligence')
    })

    it('uses correct default description', () => {
      const { container } = render(<HeadMeta />)

      const metaDescription = container.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(
        'Maps, data, and learning for a brighter future: ocean temperatures, currents, education and sustainability.'
      )
    })

    it('uses correct default keywords', () => {
      const { container } = render(<HeadMeta />)

      const metaKeywords = container.querySelector('meta[name="keywords"]')
      expect(metaKeywords?.getAttribute('content')).toBe(
        'ocean monitoring, marine data, sea temperature, ocean currents, marine life tracking, oceanography, blue economy, climate change, marine conservation'
      )
    })

    it('uses correct base URL for all URL constructions', () => {
      const { container } = render(<HeadMeta />)

      const baseUrl = 'https://bluesphere-frontend.onrender.com'

      const ogImage = container.querySelector('meta[property="og:image"]')
      expect(ogImage?.getAttribute('content')).toContain(baseUrl)

      const twitterImage = container.querySelector('meta[name="twitter:image"]')
      expect(twitterImage?.getAttribute('content')).toContain(baseUrl)

      const ogUrl = container.querySelector('meta[property="og:url"]')
      expect(ogUrl?.getAttribute('content')).toContain(baseUrl)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty string props correctly', () => {
      const { container } = render(
        <HeadMeta title="" description="" keywords="" />
      )

      // Should use defaults when empty strings are provided
      const titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe('BlueSphere — Open, living ocean intelligence')
    })

    it('handles special characters in props', () => {
      const specialTitle = 'BlueSphere — Marine Data & Analysis «»'
      const specialDescription = 'Ocean data with special chars: áéíóú, 中文, русский'

      const { container } = render(
        <HeadMeta title={specialTitle} description={specialDescription} />
      )

      const titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe(specialTitle)

      const metaDescription = container.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(specialDescription)
    })

    it('handles very long content gracefully', () => {
      const longTitle = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)

      const { container } = render(
        <HeadMeta title={longTitle} description={longDescription} />
      )

      const titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe(longTitle)

      const metaDescription = container.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe(longDescription)
    })

    it('handles malformed canonical URLs gracefully', () => {
      const malformedUrl = 'not-a-valid-url'

      expect(() => {
        render(<HeadMeta canonical={malformedUrl} />)
      }).not.toThrow()
    })
  })

  describe('Component Interface', () => {
    it('accepts all expected props interface', () => {
      const allProps = {
        title: 'Test Title',
        description: 'Test Description',
        keywords: 'test, keywords',
        canonical: 'https://example.com',
        noindex: true
      }

      expect(() => {
        render(<HeadMeta {...allProps} />)
      }).not.toThrow()
    })

    it('works with partial props', () => {
      expect(() => {
        render(<HeadMeta title="Only Title" />)
      }).not.toThrow()

      expect(() => {
        render(<HeadMeta description="Only Description" />)
      }).not.toThrow()

      expect(() => {
        render(<HeadMeta noindex={true} />)
      }).not.toThrow()
    })

    it('maintains consistency when re-rendered with different props', () => {
      const { container, rerender } = render(<HeadMeta title="Initial Title" />)

      let titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe('Initial Title')

      rerender(<HeadMeta title="Updated Title" />)

      titleElement = container.querySelector('title')
      expect(titleElement?.textContent).toBe('Updated Title')
    })
  })
})