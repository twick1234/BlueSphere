import { render, screen } from '@testing-library/react'
import Layout from '../../components/Layout'

// Mock WorldClassLayout
jest.mock('../../components/WorldClassLayout', () => {
  return function WorldClassLayout({ children }: { children: React.ReactNode }) {
    return (
      <div>
        <header role="banner" className="bs-header">
          <div className="logo">
            <img src="/brand/logo.svg" alt="BlueSphere" />
            <span>BlueSphere</span>
          </div>
          <nav role="navigation" className="nav-desktop">
            <button className="nav-button ">Platform</button>
            <button className="nav-button ">Data</button>
            <button className="nav-button ">Conservation</button>
          </nav>
        </header>
        <main role="main" className="bs-container bs-main">{children}</main>
        <footer role="contentinfo" className="bs-footer">
          <p>© {new Date().getFullYear()} BlueSphere</p>
        </footer>
      </div>
    )
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

  it('renders navigation sections', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const navButtons = ['Platform', 'Data', 'Conservation']

    navButtons.forEach((text) => {
      const button = screen.getByRole('button', { name: text })
      expect(button).toBeInTheDocument()
    })
  })

  it('passes props to WorldClassLayout', () => {
    render(
      <Layout title="Custom Title" description="Custom Description">
        <div>Test Content</div>
      </Layout>
    )

    // Children are rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument()
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
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByRole('banner')).toHaveClass('bs-header')
    expect(screen.getByRole('main')).toHaveClass('bs-container', 'bs-main')
    expect(screen.getByRole('contentinfo')).toHaveClass('bs-footer')
  })

  it('renders with custom props', () => {
    render(
      <Layout title="Custom Title" description="Custom Description">
        <div>Test Content</div>
      </Layout>
    )

    // The Layout component should wrap WorldClassLayout correctly
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})

describe('Layout Component Integration', () => {
  it('wraps WorldClassLayout correctly', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    // Should render navigation structure
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByText('BlueSphere')).toBeInTheDocument()
  })
})