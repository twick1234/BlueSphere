# Component Library

## Overview

BlueSphere's component library provides a comprehensive set of UI building blocks optimized for ocean monitoring and climate data visualization. All components prioritize accessibility, performance, and scientific data clarity.

## Foundation Components

### Button

Consistent interactive elements for actions throughout the platform.

#### API
```tsx
interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}
```

#### Implementation
```tsx
export const Button = ({ 
  children, 
  onClick, 
  kind = 'primary',
  size = 'medium',
  disabled = false 
}: ButtonProps) => {
  const baseStyles: CSSProperties = {
    padding: size === 'small' ? '6px 12px' : 
             size === 'large' ? '12px 20px' : '8px 16px',
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    fontSize: size === 'small' ? 12 : 
              size === 'large' ? 16 : 14,
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease'
  }
  
  // Apply theme variants
  if (kind === 'primary') {
    baseStyles.background = colors.accent
    baseStyles.color = 'white'
  } else if (kind === 'secondary') {
    baseStyles.background = 'transparent'
    baseStyles.border = `1px solid ${colors.accent}`
    baseStyles.color = colors.accent
  } else if (kind === 'ghost') {
    baseStyles.background = 'transparent'
    baseStyles.color = colors.accent
  }
  
  return (
    <button 
      onClick={disabled ? undefined : onClick} 
      style={baseStyles}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

#### Usage Examples
```tsx
// Primary action
<Button onClick={handleSave}>Save Data</Button>

// Secondary action  
<Button kind="secondary" onClick={handleCancel}>Cancel</Button>

// Subtle action
<Button kind="ghost" size="small">Learn More</Button>

// Disabled state
<Button disabled>Loading...</Button>
```

### Typography Components

Consistent text hierarchy components based on our typography system.

#### Headings
```tsx
// H1 - Page titles
<H1>Ocean Temperature Monitoring</H1>

// H2 - Section headers  
<H2>Station Data Overview</H2>

// H3 - Subsection headers
<H3>Temperature Trends</H3>
```

#### Body Text
```tsx
// Paragraph text
<P>
  Ocean monitoring buoys provide critical real-time data 
  for understanding climate patterns and marine ecosystem health.
</P>

// Small text
<span className="text-small">
  Last updated: {timestamp}
</span>
```

## Layout Components

### Container

Responsive container with consistent max-width and padding.

```tsx
// Main content container
<div className="bs-container">
  <main className="bs-main">
    {/* Page content */}
  </main>
</div>
```

#### CSS Implementation
```css
.bs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.bs-main {
  padding: 24px 16px;
  min-height: calc(100vh - 56px - 56px); /* Header + Footer */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .bs-container {
    padding: 0 12px;
  }
  
  .bs-main {
    padding: 16px 12px;
  }
}
```

### Layout (Header/Footer Structure)

Main application layout component with navigation and theming.

#### Features
- Sticky header with navigation
- Theme toggle integration
- Responsive navigation
- Consistent footer
- Logo with theme adaptation

#### Implementation
```tsx
const Layout: React.FC<{children: any, title?: string}> = ({ 
  children, 
  title 
}) => {
  return (
    <div className="bs-root">
      <HeadMeta title={title} />
      
      {/* Theme initialization script */}
      <script dangerouslySetInnerHTML={{
        __html: `/* Theme detection logic */`
      }} />
      
      <header className="bs-header">
        <div className="bs-container bs-header-inner">
          <div className="bs-brand">
            <Link href="/">
              <img src="/logo.svg" alt="BlueSphere" />
              BlueSphere
            </Link>
          </div>
          
          <nav className="bs-nav">
            <NavLink href="/map">Map</NavLink>
            <NavLink href="/data">Data</NavLink>
            <NavLink href="/docs">Docs</NavLink>
            <NavLink href="/about">About</NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      
      <main className="bs-container bs-main">
        {children}
      </main>
      
      <footer className="bs-footer">
        <div className="bs-container">
          © {new Date().getFullYear()} BlueSphere
        </div>
      </footer>
    </div>
  )
}
```

## Interactive Components

### ThemeToggle

Three-state theme toggle (Light / Dark / System) with persistence.

#### Implementation
```tsx
const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  
  useEffect(() => {
    const saved = localStorage.getItem('bs-theme') as typeof theme
    if (saved) setTheme(saved)
  }, [])
  
  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : 
                 theme === 'dark' ? 'system' : 'light'
    setTheme(next)
    localStorage.setItem('bs-theme', next)
    
    // Apply theme
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }
  
  const getIcon = () => {
    switch (theme) {
      case 'light': return '☀️'
      case 'dark': return '🌙'  
      case 'system': return '💻'
    }
  }
  
  return (
    <button 
      onClick={cycleTheme}
      title={`Theme: ${theme}`}
      style={{
        background: 'none',
        border: 'none',
        fontSize: 18,
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '6px',
        transition: 'background-color 0.2s ease'
      }}
    >
      {getIcon()}
    </button>
  )
}
```

## Data Visualization Components

### OceanMap

Advanced interactive map component for displaying global buoy network.

#### Props Interface
```tsx
interface OceanMapProps {
  buoys: BuoyData[]
  onBuoySelect: (buoy: BuoyData | null) => void
  selectedBuoy: BuoyData | null
  isFullscreen?: boolean
  isDarkMode?: boolean
  showHeatmap?: boolean
  searchQuery?: string
}
```

#### Key Features
- **Interactive Markers**: Temperature-coded buoy markers with animations
- **Professional Styling**: NASA/NOAA-inspired visualizations
- **Heatmap Overlay**: Temperature gradient visualization
- **Marine Heatwave Detection**: Automatic alert overlays
- **Responsive Controls**: Fullscreen, theme, and layer toggles
- **Professional Legend**: Comprehensive temperature and status legends

#### Usage
```tsx
<OceanMap
  buoys={stationData}
  onBuoySelect={setSelectedStation}
  selectedBuoy={selectedStation}
  showHeatmap={true}
  isDarkMode={darkMode}
/>
```

### Temperature Marker System

Advanced marker system for temperature visualization on maps.

#### Features
- **Color-Coded**: Temperature-based color mapping
- **Animated**: Pulse animations for critical temperatures
- **Status Icons**: Visual indicators for station status
- **Responsive**: Scales appropriately across zoom levels
- **Accessible**: Alternative text and focus states

#### Implementation Detail
```tsx
const createAdvancedBuoyIcon = (
  status: string, 
  temp?: number, 
  isSelected?: boolean,
  animationLevel?: number
) => {
  const color = getTemperatureColor(temp || 15)
  const statusIcon = temp && temp > 26 ? '🚨' : 
                     temp && temp > 23 ? '🌡️' : '✅'
  
  return L.divIcon({
    html: `
      <div class="advanced-buoy-marker">
        ${/* Animated pulse for hot temperatures */}
        ${/* Temperature gradient ring */}
        ${/* Main marker body with icon */}
        ${/* Temperature label */}
      </div>
    `,
    iconSize: [baseSize, baseSize],
    className: 'custom-advanced-buoy-icon'
  })
}
```

### LayerControls

Map layer control component for toggling data visualizations.

#### Features
- Temperature heatmap toggle
- Marine heatwave overlay toggle
- Data source filtering
- Visual layer management

### TimeControls  

Time-series navigation component for historical data.

#### Features
- Play/pause animation controls
- Speed adjustment (1x to 50x)
- Date range selection
- Bookmark significant events
- Loop mode for continuous cycling

## Form Components

### Input Fields

Consistent form input styling with validation states.

```tsx
interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  help?: string
  required?: boolean
  type?: 'text' | 'email' | 'password' | 'number'
}

const Input: React.FC<InputProps> = ({
  label, value, onChange, error, help, required, type = 'text'
}) => (
  <div className="form-field">
    <label className="form-label">
      {label}
      {required && <span className="required">*</span>}
    </label>
    
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`form-input ${error ? 'error' : ''}`}
      required={required}
    />
    
    {help && !error && (
      <div className="form-help">{help}</div>
    )}
    
    {error && (
      <div className="form-error">{error}</div>
    )}
  </div>
)
```

### Search Input

Specialized search component with autocomplete and filtering.

```tsx
const SearchInput = ({ onSearch, placeholder, suggestions }) => {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  return (
    <div className="search-container">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onSearch(e.target.value)
        }}
        placeholder={placeholder}
        className="search-input"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              className="search-suggestion"
              onClick={() => {
                setQuery(suggestion)
                onSearch(suggestion)
                setShowSuggestions(false)
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Feedback Components

### Alert System

Contextual alerts for different message types.

```tsx
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  onDismiss?: () => void
}

const Alert: React.FC<AlertProps> = ({ type, title, message, onDismiss }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '🚨'
      default: return 'ℹ️'
    }
  }
  
  const getColor = () => {
    switch (type) {
      case 'success': return colors.success
      case 'warning': return colors.warning
      case 'error': return colors.danger
      default: return colors.accent
    }
  }
  
  return (
    <div 
      className="alert"
      style={{
        background: `${getColor()}15`,
        border: `1px solid ${getColor()}40`,
        borderRadius: 8,
        padding: 16,
        margin: '16px 0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 18 }}>{getIcon()}</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px 0', color: getColor() }}>
            {title}
          </h4>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
            {message}
          </p>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              opacity: 0.6
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
```

### Loading States

Consistent loading indicators for different contexts.

```tsx
// Spinner for general loading
const Spinner = ({ size = 24 }: { size?: number }) => (
  <div 
    className="spinner"
    style={{
      width: size,
      height: size,
      border: `2px solid ${colors.accent}20`,
      borderTop: `2px solid ${colors.accent}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}
  />
)

// Skeleton for content loading
const Skeleton = ({ width, height }: { width: string, height: string }) => (
  <div 
    className="skeleton"
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite',
      borderRadius: 4
    }}
  />
)
```

## Component Styling Patterns

### CSS-in-JS with TypeScript

Components use inline styles with TypeScript for type safety and dynamic theming:

```tsx
const dynamicStyles: CSSProperties = {
  background: `var(--bs-bg)`,
  color: `var(--bs-fg)`,
  border: `1px solid var(--bs-border)`,
  transition: 'all 0.3s ease'
}
```

### CSS Custom Properties Integration

All components support theme switching through CSS custom properties:

```css
.component {
  background: var(--bs-bg);
  color: var(--bs-fg);
  border-color: var(--bs-border);
}

[data-theme="dark"] .component {
  /* Automatic theme switching */
}
```

### Responsive Design Patterns

Components adapt to different screen sizes using consistent patterns:

```css
@media (max-width: 768px) {
  .component {
    padding: 12px;
    font-size: 14px;
  }
}

@media (min-width: 1024px) {
  .component {
    padding: 20px;
    font-size: 16px;
  }
}
```

## Testing & Quality Assurance

### Accessibility Testing
- **Screen Reader**: All components work with VoiceOver/NVDA
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG 2.1 AA compliance
- **Focus Management**: Clear focus indicators

### Browser Testing
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Feature Detection**: Graceful degradation for older browsers

### Performance Testing
- **Bundle Size**: Components optimized for minimal bundle impact  
- **Render Performance**: Smooth 60fps animations
- **Memory Usage**: Efficient re-rendering and cleanup

---

*Every component in the BlueSphere system serves the critical mission of making ocean monitoring data accessible, understandable, and actionable for global climate response.*