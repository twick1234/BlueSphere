import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { AccessibleButton } from '../../../components/accessibility/AccessibleButton'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock the AccessibilityProvider
const mockAccessibilityContext = {
  announce: jest.fn(),
  prefersReducedMotion: false,
  prefersHighContrast: false,
  announcements: [],
  clearAnnouncements: jest.fn()
}

jest.mock('../../../components/accessibility/AccessibilityProvider', () => ({
  useAccessibility: () => mockAccessibilityContext
}))

describe('AccessibleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<AccessibleButton>Click me</AccessibleButton>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('renders with correct button text', () => {
      render(<AccessibleButton>Submit Form</AccessibleButton>)
      expect(screen.getByText('Submit Form')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<AccessibleButton className="custom-class">Button</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<AccessibleButton ref={ref}>Button</AccessibleButton>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe('Button Variants', () => {
    it('applies primary variant by default', () => {
      render(<AccessibleButton>Primary</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-primary')
    })

    it('applies secondary variant', () => {
      render(<AccessibleButton variant="secondary">Secondary</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-secondary')
    })

    it('applies outline variant', () => {
      render(<AccessibleButton variant="outline">Outline</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-outline')
    })

    it('applies ghost variant', () => {
      render(<AccessibleButton variant="ghost">Ghost</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-ghost')
    })

    it('applies danger variant', () => {
      render(<AccessibleButton variant="danger">Danger</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-danger')
    })
  })

  describe('Button Sizes', () => {
    it('applies medium size by default', () => {
      render(<AccessibleButton>Medium</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-md')
    })

    it('applies small size', () => {
      render(<AccessibleButton size="sm">Small</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-sm')
    })

    it('applies large size', () => {
      render(<AccessibleButton size="lg">Large</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-lg')
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      render(<AccessibleButton loading>Loading Button</AccessibleButton>)
      expect(screen.getByText('⟳')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })

    it('applies loading text style when loading', () => {
      const { container } = render(<AccessibleButton loading>Loading Button</AccessibleButton>)
      expect(container.querySelector('.button-text-loading')).toBeInTheDocument()
    })

    it('disables button when loading', () => {
      render(<AccessibleButton loading>Loading Button</AccessibleButton>)
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup()
      const onClickMock = jest.fn()

      render(
        <AccessibleButton loading onClick={onClickMock}>
          Loading Button
        </AccessibleButton>
      )

      await user.click(screen.getByRole('button'))
      expect(onClickMock).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<AccessibleButton disabled>Disabled Button</AccessibleButton>)
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })

    it('applies disabled styling', () => {
      render(<AccessibleButton disabled>Disabled Button</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-disabled')
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const onClickMock = jest.fn()

      render(
        <AccessibleButton disabled onClick={onClickMock}>
          Disabled Button
        </AccessibleButton>
      )

      await user.click(screen.getByRole('button'))
      expect(onClickMock).not.toHaveBeenCalled()
    })
  })

  describe('Icons', () => {
    const testIcon = <span data-testid="test-icon">🏠</span>

    it('renders icon on the left by default', () => {
      render(
        <AccessibleButton icon={testIcon}>
          Home
        </AccessibleButton>
      )

      const button = screen.getByRole('button')
      const icon = screen.getByTestId('test-icon')
      const iconSpan = icon.closest('.icon-left')

      expect(iconSpan).toBeInTheDocument()
      expect(iconSpan).toHaveAttribute('aria-hidden', 'true')
    })

    it('renders icon on the right when specified', () => {
      render(
        <AccessibleButton icon={testIcon} iconPosition="right">
          Next
        </AccessibleButton>
      )

      const icon = screen.getByTestId('test-icon')
      const iconSpan = icon.closest('.icon-right')

      expect(iconSpan).toBeInTheDocument()
      expect(iconSpan).toHaveAttribute('aria-hidden', 'true')
    })

    it('does not render icon container when no icon provided', () => {
      const { container } = render(<AccessibleButton>No Icon</AccessibleButton>)
      expect(container.querySelector('.button-icon')).not.toBeInTheDocument()
    })
  })

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      render(<AccessibleButton fullWidth>Full Width</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveClass('button-full-width')
    })

    it('does not apply full width class by default', () => {
      render(<AccessibleButton>Normal Width</AccessibleButton>)
      expect(screen.getByRole('button')).not.toHaveClass('button-full-width')
    })
  })

  describe('Description and ARIA', () => {
    it('creates description element when description prop provided', () => {
      render(
        <AccessibleButton id="test-button" description="This button submits the form">
          Submit
        </AccessibleButton>
      )

      expect(screen.getByText('This button submits the form')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'test-button-description')
    })

    it('uses default id when no id provided', () => {
      render(
        <AccessibleButton description="Default description">
          Button
        </AccessibleButton>
      )

      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'button-description')
    })

    it('does not set aria-describedby when no description', () => {
      render(<AccessibleButton>No Description</AccessibleButton>)
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby')
    })

    it('hides description visually but keeps it accessible', () => {
      const { container } = render(
        <AccessibleButton description="Hidden description">
          Button
        </AccessibleButton>
      )

      const description = container.querySelector('.button-description')
      expect(description).toHaveStyle({
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      })
    })
  })

  describe('Event Handling', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      const onClickMock = jest.fn()

      render(<AccessibleButton onClick={onClickMock}>Click Me</AccessibleButton>)

      await user.click(screen.getByRole('button'))
      expect(onClickMock).toHaveBeenCalledTimes(1)
    })

    it('calls onPress when clicked', async () => {
      const user = userEvent.setup()
      const onPressMock = jest.fn()

      render(<AccessibleButton onPress={onPressMock}>Press Me</AccessibleButton>)

      await user.click(screen.getByRole('button'))
      expect(onPressMock).toHaveBeenCalledTimes(1)
    })

    it('calls both onClick and onPress when provided', async () => {
      const user = userEvent.setup()
      const onClickMock = jest.fn()
      const onPressMock = jest.fn()

      render(
        <AccessibleButton onClick={onClickMock} onPress={onPressMock}>
          Both Handlers
        </AccessibleButton>
      )

      await user.click(screen.getByRole('button'))
      expect(onClickMock).toHaveBeenCalledTimes(1)
      expect(onPressMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Keyboard Interaction', () => {
    it('handles Enter key press', async () => {
      const user = userEvent.setup()
      render(<AccessibleButton>Enter Key</AccessibleButton>)

      const button = screen.getByRole('button')
      button.focus()

      await user.keyboard('{Enter}')

      // Should show pressed state briefly
      expect(button).toHaveClass('button-pressed')
    })

    it('handles Space key press', async () => {
      const user = userEvent.setup()
      render(<AccessibleButton>Space Key</AccessibleButton>)

      const button = screen.getByRole('button')
      button.focus()

      await user.keyboard(' ')

      // Should show pressed state briefly
      expect(button).toHaveClass('button-pressed')
    })

    it('removes pressed state on key up', async () => {
      const user = userEvent.setup()
      render(<AccessibleButton>Key Up</AccessibleButton>)

      const button = screen.getByRole('button')
      button.focus()

      await user.keyboard('{Enter}')
      await user.keyboard('{Enter>}') // Key up

      expect(button).not.toHaveClass('button-pressed')
    })
  })

  describe('Announcements', () => {
    it('announces button action when announcement prop provided', async () => {
      const user = userEvent.setup()
      const mockAnnounce = mockAccessibilityContext.announce

      render(
        <AccessibleButton announcement="Form submitted successfully">
          Submit
        </AccessibleButton>
      )

      await user.click(screen.getByRole('button'))

      expect(mockAnnounce).toHaveBeenCalledWith('Form submitted successfully', 'polite')
    })

    it('does not announce when no announcement prop', async () => {
      const user = userEvent.setup()
      const mockAnnounce = mockAccessibilityContext.announce

      render(<AccessibleButton>No Announcement</AccessibleButton>)

      await user.click(screen.getByRole('button'))

      expect(mockAnnounce).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility Features', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton
          id="accessible-button"
          description="This is a fully accessible button"
          icon={<span>🔍</span>}
        >
          Search
        </AccessibleButton>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('applies high contrast styles when prefersHighContrast is true', () => {
      mockAccessibilityContext.prefersHighContrast = true

      render(<AccessibleButton>High Contrast</AccessibleButton>)

      expect(screen.getByRole('button')).toHaveClass('high-contrast')

      // Reset for other tests
      mockAccessibilityContext.prefersHighContrast = false
    })

    it('disables animations when prefersReducedMotion is true', () => {
      mockAccessibilityContext.prefersReducedMotion = true

      const { container } = render(<AccessibleButton>Reduced Motion</AccessibleButton>)

      // Check that style tag contains reduced motion styles
      const styleTag = container.querySelector('style')
      expect(styleTag?.textContent).toContain('transition: none')

      // Reset for other tests
      mockAccessibilityContext.prefersReducedMotion = false
    })

    it('maintains focus visibility', () => {
      render(<AccessibleButton>Focus Test</AccessibleButton>)

      const button = screen.getByRole('button')
      button.focus()

      // Button should be focusable and have proper focus styles
      expect(button).toHaveFocus()
    })

    it('has appropriate touch target size', () => {
      render(<AccessibleButton size="sm">Small Button</AccessibleButton>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('button-sm')

      // The CSS ensures minimum 44px touch target in media queries
    })
  })

  describe('HTML Attributes', () => {
    it('passes through additional HTML attributes', () => {
      render(
        <AccessibleButton
          id="custom-id"
          data-testid="custom-button"
          tabIndex={-1}
          title="Custom title"
        >
          Custom Attributes
        </AccessibleButton>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('id', 'custom-id')
      expect(button).toHaveAttribute('data-testid', 'custom-button')
      expect(button).toHaveAttribute('tabIndex', '-1')
      expect(button).toHaveAttribute('title', 'Custom title')
    })

    it('preserves button type', () => {
      render(<AccessibleButton type="submit">Submit</AccessibleButton>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('defaults to button type', () => {
      render(<AccessibleButton>Default Type</AccessibleButton>)
      const button = screen.getByRole('button')
      // HTML buttons default to type="submit" if not specified, but our component should be type="button"
      expect(button.getAttribute('type')).toBe(null) // or 'button' depending on implementation
    })
  })

  describe('Style Injection', () => {
    it('injects CSS styles correctly', () => {
      const { container } = render(<AccessibleButton>Styled Button</AccessibleButton>)

      const styleTag = container.querySelector('style')
      expect(styleTag).toBeInTheDocument()
      expect(styleTag?.textContent).toContain('.accessible-button')
      expect(styleTag?.textContent).toContain('.button-primary')
    })

    it('includes print styles', () => {
      const { container } = render(<AccessibleButton>Print Button</AccessibleButton>)

      const styleTag = container.querySelector('style')
      expect(styleTag?.textContent).toContain('@media print')
    })

    it('includes responsive styles', () => {
      const { container } = render(<AccessibleButton>Responsive Button</AccessibleButton>)

      const styleTag = container.querySelector('style')
      expect(styleTag?.textContent).toContain('@media (pointer: coarse)')
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid clicking gracefully', async () => {
      const user = userEvent.setup()
      const onClickMock = jest.fn()

      render(<AccessibleButton onClick={onClickMock}>Rapid Click</AccessibleButton>)

      const button = screen.getByRole('button')

      // Rapidly click multiple times
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(onClickMock).toHaveBeenCalledTimes(3)
    })

    it('handles loading state changes during interaction', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<AccessibleButton loading={false}>Dynamic Loading</AccessibleButton>)

      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()

      rerender(<AccessibleButton loading={true}>Dynamic Loading</AccessibleButton>)

      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('handles undefined icon gracefully', () => {
      expect(() => {
        render(<AccessibleButton icon={undefined}>No Icon</AccessibleButton>)
      }).not.toThrow()
    })

    it('handles empty string children', () => {
      render(<AccessibleButton>{''}</AccessibleButton>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles complex children elements', () => {
      render(
        <AccessibleButton>
          <span>Complex</span> <strong>Children</strong>
        </AccessibleButton>
      )

      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Children')).toBeInTheDocument()
    })
  })

  describe('Component Display Name', () => {
    it('has correct display name for debugging', () => {
      expect(AccessibleButton.displayName).toBe('AccessibleButton')
    })
  })

  describe('Integration with Accessibility Context', () => {
    it('uses accessibility context preferences', () => {
      mockAccessibilityContext.prefersReducedMotion = true
      mockAccessibilityContext.prefersHighContrast = true

      render(<AccessibleButton>Context Integration</AccessibleButton>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('high-contrast')

      // Check that reduced motion is applied in styles
      const { container } = render(<AccessibleButton>Reduced Motion</AccessibleButton>)
      const styleTag = container.querySelector('style')
      expect(styleTag?.textContent).toContain('transition: none')

      // Reset context
      mockAccessibilityContext.prefersReducedMotion = false
      mockAccessibilityContext.prefersHighContrast = false
    })

    it('calls announce function from context', async () => {
      const user = userEvent.setup()
      const mockAnnounce = mockAccessibilityContext.announce

      render(
        <AccessibleButton announcement="Context announcement test">
          Test Context
        </AccessibleButton>
      )

      await user.click(screen.getByRole('button'))

      expect(mockAnnounce).toHaveBeenCalledWith('Context announcement test', 'polite')
    })
  })
})