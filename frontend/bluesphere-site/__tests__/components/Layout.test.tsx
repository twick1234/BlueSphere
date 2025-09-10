import { render, screen } from '@testing-library/react'
import Layout from '../../components/Layout'

// Mock HeadMeta and ThemeToggle components
jest.mock('../../components/HeadMeta', () => {
  return function HeadMeta() {
    return <div data-testid="head-meta" />
  }
})

jest.mock('../../components/ThemeToggle', () => {
  return function ThemeToggle() {
    return <div data-testid="theme-toggle" />
  }
})

describe('Layout Component', () => {
  it('renders correctly with default props', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    // Check if basic structure is rendered
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer

    // Check if children are rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders logo and brand name', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const logo = screen.getByAltText('BlueSphere')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/brand/logo.svg')
    expect(screen.getByText('BlueSphere')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const navLinks = [
      { text: 'Map', href: '/map' },
      { text: 'Consistency', href: '/consistency' },
      { text: 'Docs', href: '/docs' },
      { text: 'About', href: '/about' },
      { text: 'Sources', href: '/sources' },
    ]

    navLinks.forEach(({ text, href }) => {
      const link = screen.getByRole('link', { name: text })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', href)
    })
  })

  it('renders HeadMeta component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByTestId('head-meta')).toBeInTheDocument()
  })

  it('renders ThemeToggle component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('renders footer with current year', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const currentYear = new Date().getFullYear()
    expect(screen.getByText(`© ${currentYear} BlueSphere`)).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    expect(container.firstChild).toHaveClass('bs-root')
    expect(screen.getByRole('banner')).toHaveClass('bs-header')
    expect(screen.getByRole('main')).toHaveClass('bs-container', 'bs-main')
    expect(screen.getByRole('contentinfo')).toHaveClass('bs-footer')
  })

  it('includes theme initialization script', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    // Check that script tags are present (they contain theme initialization logic)
    const scripts = document.querySelectorAll('script')
    expect(scripts.length).toBeGreaterThan(0)
  })

  it('renders with custom title prop', () => {
    render(
      <Layout title="Custom Title">
        <div>Test Content</div>
      </Layout>
    )

    // The title prop is passed but not directly used in this component
    // It might be used in HeadMeta component
    expect(screen.getByTestId('head-meta')).toBeInTheDocument()
  })
})

describe('NavLink Component', () => {
  it('renders navigation link with correct attributes', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const mapLink = screen.getByRole('link', { name: 'Map' })
    expect(mapLink).toHaveClass('bs-link')
    expect(mapLink).toHaveAttribute('href', '/map')
  })
})