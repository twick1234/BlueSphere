# 🤝 Contributing to BlueSphere

Thank you for your interest in contributing to BlueSphere! We welcome contributions from developers, researchers, and climate advocates worldwide. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@bluesphere.org](mailto:conduct@bluesphere.org).

## How to Contribute

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When creating a bug report, please include:

- **Clear title** describing the issue
- **Detailed description** of what happened vs. what you expected
- **Steps to reproduce** the behavior
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node.js version)
- **Error messages** if any

Use the bug report template:
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]
```

### 💡 Suggesting Features

We love feature suggestions! Please check existing feature requests before creating new ones. Include:

- **Clear title** summarizing the feature
- **Detailed description** of the proposed functionality
- **Use case** explaining why this would be valuable
- **Mockups or examples** if applicable
- **Implementation ideas** if you have any

### 🔧 Contributing Code

1. **Fork** the repository
2. **Create** a feature branch from `develop`
3. **Make** your changes
4. **Test** your changes thoroughly
5. **Submit** a pull request

## Development Setup

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Git

### Getting Started

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/bluesphere.git
   cd bluesphere/frontend/bluesphere-site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to [http://localhost:4000](http://localhost:4000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript checks
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run end-to-end tests

## Pull Request Process

### Before Submitting

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Run linting and type checks**
5. **Update CHANGELOG.md** if applicable
6. **Rebase** your branch on the latest develop

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Tested on multiple devices/browsers

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated checks** must pass (tests, linting, type checking)
2. **Code review** by at least one maintainer
3. **Manual testing** by reviewers when applicable
4. **Approval** from project maintainers
5. **Merge** after all requirements are met

## Coding Standards

### TypeScript Guidelines

- Use **strict TypeScript** configuration
- Define **interfaces** for all component props
- Use **type assertions** sparingly and with good reason
- Prefer **union types** over `any`
- Document complex types with **JSDoc comments**

```typescript
// Good
interface StationProps {
  /** Station unique identifier */
  stationId: string
  /** Station display name */
  name: string
  /** Optional callback when station is selected */
  onSelect?: (station: Station) => void
}

// Bad
interface StationProps {
  stationId: any
  name: any
  onSelect: any
}
```

### React Guidelines

- Use **functional components** with hooks
- Implement **proper error boundaries**
- Use **React.memo** for performance optimization
- Follow **hooks rules** (order, conditional usage)
- Prefer **custom hooks** for complex logic

```typescript
// Good
const StationCard = memo(({ station, onSelect }: StationProps) => {
  const handleClick = useCallback(() => {
    onSelect?.(station)
  }, [station, onSelect])

  return (
    <div onClick={handleClick}>
      {station.name}
    </div>
  )
})

// Bad
const StationCard = (props: any) => {
  return <div>{props.name}</div>
}
```

### CSS Guidelines

- Use **CSS-in-JS** with styled-jsx
- Follow **mobile-first** responsive design
- Use **CSS custom properties** for theming
- Implement **smooth transitions** for interactions
- Ensure **high contrast** ratios for accessibility

```css
/* Good */
.station-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.station-card:hover {
  transform: translateY(-2px);
}

@media (min-width: 768px) {
  .station-card {
    flex-direction: row;
  }
}
```

### Naming Conventions

- **PascalCase** for components and types
- **camelCase** for variables and functions
- **kebab-case** for CSS classes and files
- **UPPER_SNAKE_CASE** for constants
- **Descriptive names** that explain purpose

```typescript
// Good
const OCEAN_TEMPERATURE_THRESHOLD = 26.5
const useStationData = () => { /* ... */ }
const StationMarker = ({ station }: StationMarkerProps) => { /* ... */ }

// Bad
const threshold = 26.5
const hook = () => { /* ... */ }
const Comp = ({ data }: any) => { /* ... */ }
```

## Testing Guidelines

### Unit Testing

- **Test all components** with React Testing Library
- **Mock external dependencies** appropriately
- **Test error states** and edge cases
- **Aim for 80%+** code coverage
- **Write descriptive test names**

```typescript
describe('StationCard', () => {
  it('calls onSelect when clicked', () => {
    const mockOnSelect = jest.fn()
    const station = { id: '1', name: 'Test Station' }
    
    render(<StationCard station={station} onSelect={mockOnSelect} />)
    
    fireEvent.click(screen.getByText('Test Station'))
    expect(mockOnSelect).toHaveBeenCalledWith(station)
  })

  it('displays loading state when data is pending', () => {
    render(<StationCard station={null} loading={true} />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
```

### Integration Testing

- **Test user workflows** end-to-end
- **Use realistic test data**
- **Test API integration** with mock servers
- **Verify accessibility** with screen readers
- **Test across different devices**

### Performance Testing

- **Measure component render times**
- **Test with large datasets**
- **Verify memory usage**
- **Check bundle size impact**
- **Test network conditions**

## Documentation

### Code Documentation

- **JSDoc comments** for complex functions
- **README files** for major features
- **Inline comments** for business logic
- **Type definitions** with descriptions
- **Architecture decisions** recorded

### User Documentation

- **Component usage examples**
- **API endpoint documentation**
- **Setup and configuration guides**
- **Troubleshooting common issues**
- **Feature explanations**

## Accessibility Requirements

### WCAG 2.1 AA Compliance

- **Semantic HTML** structure
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** ratios 4.5:1+
- **Focus indicators** clearly visible
- **Alternative text** for images
- **Form labels** properly associated

### Testing Accessibility

```typescript
// Use jest-axe for automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should not have accessibility violations', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Performance Guidelines

### Optimization Checklist

- [ ] **Components memoized** where appropriate
- [ ] **Large lists virtualized**
- [ ] **Images optimized** and lazy loaded
- [ ] **Code split** by routes
- [ ] **Bundle size** monitored
- [ ] **Core Web Vitals** optimized
- [ ] **API calls** cached when possible
- [ ] **Database queries** optimized

### Monitoring

- **Lighthouse scores** maintained above 90
- **Bundle analyzer** run regularly
- **Performance metrics** tracked
- **User experience** monitored
- **Error rates** kept below 0.1%

## Community

### Getting Help

- **GitHub Discussions** for questions and ideas
- **Discord server** for real-time chat
- **Stack Overflow** tag: `bluesphere`
- **Documentation** at docs.bluesphere.org

### Communication Channels

- **GitHub Issues** for bugs and features
- **Pull Requests** for code contributions
- **Discord** for community chat
- **Twitter** @BlueSphereOrg for updates
- **Email** hello@bluesphere.org for general inquiries

### Contributor Recognition

Contributors are recognized through:
- **Contributors page** on website
- **Release notes** acknowledgments
- **GitHub contributor statistics**
- **Community highlights** in newsletters
- **Swag packages** for significant contributions

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality
- **PATCH** version for backward-compatible bug fixes

### Release Schedule

- **Major releases** quarterly
- **Minor releases** monthly
- **Patch releases** as needed for critical fixes
- **Beta releases** for testing new features

Thank you for contributing to BlueSphere and helping us fight climate change through better ocean monitoring! 🌊