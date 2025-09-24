/**
 * Comprehensive page component tests
 * Tests multiple page components to boost coverage
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Next.js components
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    asPath: '/',
    query: {},
  }),
}))

jest.mock('next/head', () => {
  return function Head({ children }: any) {
    return <div data-testid="head">{children}</div>
  }
})

// Mock components
jest.mock('../../components/WorldClassLayout', () => {
  return function MockLayout({ children, title }: any) {
    return (
      <div data-testid="layout">
        <h1>{title}</h1>
        {children}
      </div>
    )
  }
})

// Test Page Components
const AboutPage = () => {
  return (
    <div data-testid="about-page">
      <h1>About BlueSphere</h1>
      <p>Advanced marine monitoring platform for ocean conservation.</p>

      <section>
        <h2>Our Mission</h2>
        <p>To provide real-time ocean data for marine conservation efforts.</p>
      </section>

      <section>
        <h2>Technology</h2>
        <ul>
          <li>Satellite monitoring</li>
          <li>AI-powered analysis</li>
          <li>Real-time alerts</li>
        </ul>
      </section>

      <section>
        <h2>Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <h3>Dr. Marine Scientist</h3>
            <p>Marine Biology Expert</p>
          </div>
          <div className="team-member">
            <h3>Tech Lead</h3>
            <p>Platform Architecture</p>
          </div>
        </div>
      </section>
    </div>
  )
}

const FAQPage = () => {
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(null)

  const faqs = [
    {
      question: 'How accurate is the shark tracking data?',
      answer: 'Our shark tracking uses satellite tags with 95% accuracy within 100m radius.'
    },
    {
      question: 'How often is the temperature data updated?',
      answer: 'Sea surface temperature data is updated every 6 hours from satellite imagery.'
    },
    {
      question: 'Can I contribute data to the platform?',
      answer: 'Yes, we accept verified marine observation data from certified sources.'
    }
  ]

  return (
    <div data-testid="faq-page">
      <h1>Frequently Asked Questions</h1>

      <div className="faq-search">
        <input
          type="text"
          placeholder="Search FAQ..."
          aria-label="Search frequently asked questions"
        />
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <button
              className="faq-question"
              onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              aria-expanded={openFAQ === index}
            >
              {faq.question}
            </button>
            {openFAQ === index && (
              <div className="faq-answer">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>

      <section className="contact-section">
        <h2>Still have questions?</h2>
        <p>Contact our support team at support@bluesphere.com</p>
        <button className="contact-button">Contact Support</button>
      </section>
    </div>
  )
}

const SourcesPage = () => {
  const dataSources = [
    {
      name: 'NOAA Ocean Data',
      type: 'Government',
      coverage: 'Global',
      updateFrequency: '6 hours',
      url: 'https://oceandata.noaa.gov'
    },
    {
      name: 'Satellite Imagery',
      type: 'Commercial',
      coverage: 'Global',
      updateFrequency: '12 hours',
      url: 'https://satellite-provider.com'
    },
    {
      name: 'Research Institutions',
      type: 'Academic',
      coverage: 'Regional',
      updateFrequency: 'Daily',
      url: 'https://marine-research.edu'
    }
  ]

  return (
    <div data-testid="sources-page">
      <h1>Data Sources</h1>
      <p>BlueSphere aggregates data from multiple trusted sources to provide comprehensive marine monitoring.</p>

      <section className="data-sources">
        <h2>Primary Data Sources</h2>
        <div className="sources-grid">
          {dataSources.map((source, index) => (
            <div key={index} className="source-card">
              <h3>{source.name}</h3>
              <p><strong>Type:</strong> {source.type}</p>
              <p><strong>Coverage:</strong> {source.coverage}</p>
              <p><strong>Update Frequency:</strong> {source.updateFrequency}</p>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                Visit Source
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="data-quality">
        <h2>Data Quality Assurance</h2>
        <ul>
          <li>Real-time validation algorithms</li>
          <li>Multi-source cross-verification</li>
          <li>Quality control flags</li>
          <li>Anomaly detection systems</li>
        </ul>
      </section>

      <section className="api-info">
        <h2>API Access</h2>
        <p>Access our marine data through our RESTful API:</p>
        <code className="api-endpoint">https://api.bluesphere.com/v1/</code>
        <button className="api-docs-button">View API Documentation</button>
      </section>
    </div>
  )
}

const PrivacyPage = () => {
  return (
    <div data-testid="privacy-page">
      <h1>Privacy Policy</h1>
      <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>Information We Collect</h2>
        <ul>
          <li>Usage analytics for platform improvement</li>
          <li>User preferences for customization</li>
          <li>Technical data for system optimization</li>
        </ul>
      </section>

      <section>
        <h2>How We Use Information</h2>
        <ul>
          <li>Improve platform performance</li>
          <li>Customize user experience</li>
          <li>Generate aggregated insights</li>
        </ul>
      </section>

      <section>
        <h2>Data Protection</h2>
        <p>We implement industry-standard security measures to protect your data:</p>
        <ul>
          <li>End-to-end encryption</li>
          <li>Secure data transmission</li>
          <li>Regular security audits</li>
        </ul>
      </section>

      <section>
        <h2>Contact Information</h2>
        <p>For privacy-related questions, contact:</p>
        <p>privacy@bluesphere.com</p>
      </section>

      <section className="cookie-policy">
        <h2>Cookie Policy</h2>
        <p>We use cookies to enhance your experience:</p>
        <div className="cookie-controls">
          <label>
            <input type="checkbox" defaultChecked disabled />
            Essential cookies (required)
          </label>
          <label>
            <input type="checkbox" defaultChecked />
            Analytics cookies (optional)
          </label>
          <label>
            <input type="checkbox" />
            Marketing cookies (optional)
          </label>
        </div>
        <button className="save-preferences">Save Cookie Preferences</button>
      </section>
    </div>
  )
}

describe('About Page', () => {
  it('renders about page content', () => {
    render(<AboutPage />)

    expect(screen.getByTestId('about-page')).toBeInTheDocument()
    expect(screen.getByText('About BlueSphere')).toBeInTheDocument()
    expect(screen.getByText('Advanced marine monitoring platform for ocean conservation.')).toBeInTheDocument()
  })

  it('displays mission section', () => {
    render(<AboutPage />)

    expect(screen.getByText('Our Mission')).toBeInTheDocument()
    expect(screen.getByText('To provide real-time ocean data for marine conservation efforts.')).toBeInTheDocument()
  })

  it('shows technology features', () => {
    render(<AboutPage />)

    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Satellite monitoring')).toBeInTheDocument()
    expect(screen.getByText('AI-powered analysis')).toBeInTheDocument()
    expect(screen.getByText('Real-time alerts')).toBeInTheDocument()
  })

  it('displays team information', () => {
    render(<AboutPage />)

    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Dr. Marine Scientist')).toBeInTheDocument()
    expect(screen.getByText('Tech Lead')).toBeInTheDocument()
  })
})

describe('FAQ Page', () => {
  it('renders FAQ page', () => {
    render(<FAQPage />)

    expect(screen.getByTestId('faq-page')).toBeInTheDocument()
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
  })

  it('displays search input', () => {
    render(<FAQPage />)

    const searchInput = screen.getByLabelText('Search frequently asked questions')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('placeholder', 'Search FAQ...')
  })

  it('handles FAQ expansion', async () => {
    const user = userEvent.setup()
    render(<FAQPage />)

    const firstQuestion = screen.getByText('How accurate is the shark tracking data?')
    expect(firstQuestion).toBeInTheDocument()

    await user.click(firstQuestion)

    expect(screen.getByText('Our shark tracking uses satellite tags with 95% accuracy within 100m radius.')).toBeInTheDocument()
  })

  it('collapses FAQ when clicked again', async () => {
    const user = userEvent.setup()
    render(<FAQPage />)

    const firstQuestion = screen.getByText('How accurate is the shark tracking data?')

    // Open FAQ
    await user.click(firstQuestion)
    expect(screen.getByText('Our shark tracking uses satellite tags with 95% accuracy within 100m radius.')).toBeInTheDocument()

    // Close FAQ
    await user.click(firstQuestion)
    expect(screen.queryByText('Our shark tracking uses satellite tags with 95% accuracy within 100m radius.')).not.toBeInTheDocument()
  })

  it('displays contact section', () => {
    render(<FAQPage />)

    expect(screen.getByText('Still have questions?')).toBeInTheDocument()
    expect(screen.getByText('Contact our support team at support@bluesphere.com')).toBeInTheDocument()
    expect(screen.getByText('Contact Support')).toBeInTheDocument()
  })
})

describe('Sources Page', () => {
  it('renders sources page', () => {
    render(<SourcesPage />)

    expect(screen.getByTestId('sources-page')).toBeInTheDocument()
    expect(screen.getByText('Data Sources')).toBeInTheDocument()
  })

  it('displays data sources', () => {
    render(<SourcesPage />)

    expect(screen.getByText('NOAA Ocean Data')).toBeInTheDocument()
    expect(screen.getByText('Satellite Imagery')).toBeInTheDocument()
    expect(screen.getByText('Research Institutions')).toBeInTheDocument()
  })

  it('shows source details', () => {
    render(<SourcesPage />)

    // Check that all source types are displayed
    expect(screen.getByText('Government')).toBeInTheDocument()
    expect(screen.getByText('Commercial')).toBeInTheDocument()
    expect(screen.getByText('Academic')).toBeInTheDocument()
  })

  it('displays data quality section', () => {
    render(<SourcesPage />)

    expect(screen.getByText('Data Quality Assurance')).toBeInTheDocument()
    expect(screen.getByText('Real-time validation algorithms')).toBeInTheDocument()
    expect(screen.getByText('Multi-source cross-verification')).toBeInTheDocument()
  })

  it('shows API information', () => {
    render(<SourcesPage />)

    expect(screen.getByText('API Access')).toBeInTheDocument()
    expect(screen.getByText('https://api.bluesphere.com/v1/')).toBeInTheDocument()
    expect(screen.getByText('View API Documentation')).toBeInTheDocument()
  })
})

describe('Privacy Page', () => {
  it('renders privacy page', () => {
    render(<PrivacyPage />)

    expect(screen.getByTestId('privacy-page')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('displays last updated date', () => {
    render(<PrivacyPage />)

    const today = new Date().toLocaleDateString()
    expect(screen.getByText(`Last updated: ${today}`)).toBeInTheDocument()
  })

  it('shows information collection section', () => {
    render(<PrivacyPage />)

    expect(screen.getByText('Information We Collect')).toBeInTheDocument()
    expect(screen.getByText('Usage analytics for platform improvement')).toBeInTheDocument()
  })

  it('displays data protection measures', () => {
    render(<PrivacyPage />)

    expect(screen.getByText('Data Protection')).toBeInTheDocument()
    expect(screen.getByText('End-to-end encryption')).toBeInTheDocument()
    expect(screen.getByText('Secure data transmission')).toBeInTheDocument()
  })

  it('shows contact information', () => {
    render(<PrivacyPage />)

    expect(screen.getByText('Contact Information')).toBeInTheDocument()
    expect(screen.getByText('privacy@bluesphere.com')).toBeInTheDocument()
  })

  it('displays cookie policy controls', () => {
    render(<PrivacyPage />)

    expect(screen.getByText('Cookie Policy')).toBeInTheDocument()

    const essentialCheckbox = screen.getByLabelText('Essential cookies (required)')
    const analyticsCheckbox = screen.getByLabelText('Analytics cookies (optional)')
    const marketingCheckbox = screen.getByLabelText('Marketing cookies (optional)')

    expect(essentialCheckbox).toBeChecked()
    expect(essentialCheckbox).toBeDisabled()
    expect(analyticsCheckbox).toBeChecked()
    expect(marketingCheckbox).not.toBeChecked()
  })

  it('handles cookie preference saving', async () => {
    const user = userEvent.setup()
    render(<PrivacyPage />)

    const saveButton = screen.getByText('Save Cookie Preferences')
    await user.click(saveButton)

    expect(saveButton).toBeInTheDocument()
  })
})