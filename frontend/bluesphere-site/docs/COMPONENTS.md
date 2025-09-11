# 🧩 BlueSphere Component Architecture

## Overview

This document provides comprehensive documentation for all React components in the BlueSphere application, including their props, usage examples, and architectural decisions.

## Component Hierarchy

```
Layout (Root Layout)
├── HeadMeta (SEO & Meta Tags)
├── ThemeToggle (Dark/Light Mode)
└── Page Content
    ├── OceanMap (Interactive Map)
    │   ├── LayerControls (Map Layers)
    │   └── TimeControls (Temporal Navigation)
    ├── Chatbot (AI Assistant)
    └── DesignSystem (Component Showcase)
```

## Core Components

### Layout Component
**File**: `components/Layout.tsx`  
**Purpose**: Main application layout wrapper with navigation and theming

```typescript
interface LayoutProps {
  children: React.ReactNode
  title?: string
}
```

**Features**:
- Responsive navigation with mobile-first design
- Theme switching with system preference detection
- Logo adaptation for dark/light modes
- Consistent header, main, and footer structure
- SEO-friendly meta tag integration

**Usage**:
```tsx
import Layout from '../components/Layout'

export default function Page() {
  return (
    <Layout title="Custom Page Title">
      <div>Page content here</div>
    </Layout>
  )
}
```

### OceanMap Component
**File**: `components/OceanMap.tsx`  
**Purpose**: Interactive Leaflet-based map for ocean monitoring data

```typescript
interface OceanMapProps {
  buoys: BuoyData[]
  onBuoySelect: (buoy: BuoyData | null) => void
  selectedBuoy: BuoyData | null
  isFullscreen: boolean
  isDarkMode: boolean
  showHeatmap: boolean
  searchQuery: string
}

interface BuoyData {
  station_id: string
  name: string
  lat: number
  lon: number
  last_temp?: number
  status: 'active' | 'inactive' | 'warning'
}
```

**Features**:
- Real-time station markers with status indicators
- Interactive popups with detailed station information
- Temperature heatmap overlays
- Clustering for better performance at scale
- Search integration with map focusing
- Responsive design with touch support

**Usage**:
```tsx
import OceanMap from '../components/OceanMap'

const [selectedBuoy, setSelectedBuoy] = useState(null)
const [buoyData, setBuoyData] = useState([])

<OceanMap
  buoys={buoyData}
  onBuoySelect={setSelectedBuoy}
  selectedBuoy={selectedBuoy}
  isFullscreen={false}
  isDarkMode={isDarkMode}
  showHeatmap={true}
  searchQuery=""
/>
```

### HeadMeta Component
**File**: `components/HeadMeta.tsx`  
**Purpose**: SEO optimization and meta tag management

```typescript
interface HeadMetaProps {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
}
```

**Features**:
- Dynamic title and description generation
- Open Graph tags for social media sharing
- Twitter Card integration
- JSON-LD structured data
- Canonical URL management
- Favicon and theme color specification

**Usage**:
```tsx
import HeadMeta from '../components/HeadMeta'

<HeadMeta
  title="Marine Heatwave Alerts"
  description="Real-time monitoring of marine heatwave events"
  keywords={['ocean', 'climate', 'heatwave']}
  ogImage="/images/marine-heatwave-og.jpg"
/>
```

### ThemeToggle Component
**File**: `components/ThemeToggle.tsx`  
**Purpose**: Dark/light mode switching with persistence

```typescript
interface ThemeToggleProps {
  className?: string
}
```

**Features**:
- System preference detection
- Smooth theme transitions
- LocalStorage persistence
- Accessible button with proper ARIA labels
- Animated icon transitions

**Usage**:
```tsx
import ThemeToggle from '../components/ThemeToggle'

<ThemeToggle className="custom-class" />
```

### LayerControls Component
**File**: `components/LayerControls.tsx`  
**Purpose**: Map layer visibility and configuration controls

```typescript
interface LayerControlsProps {
  onLayerToggle: (layerId: string, enabled: boolean) => void
  layers: LayerConfig[]
  className?: string
}

interface LayerConfig {
  id: string
  name: string
  enabled: boolean
  opacity: number
  type: 'overlay' | 'base'
}
```

**Features**:
- Dynamic layer configuration
- Opacity controls for overlays
- Base layer switching
- Responsive design
- Accessibility-compliant controls

**Usage**:
```tsx
import LayerControls from '../components/LayerControls'

const layers = [
  { id: 'temperature', name: 'Temperature', enabled: true, opacity: 0.7, type: 'overlay' },
  { id: 'currents', name: 'Ocean Currents', enabled: false, opacity: 1, type: 'overlay' }
]

<LayerControls
  layers={layers}
  onLayerToggle={handleLayerToggle}
  className="layer-controls"
/>
```

### TimeControls Component
**File**: `components/TimeControls.tsx`  
**Purpose**: Temporal navigation for historical data

```typescript
interface TimeControlsProps {
  currentTime: Date
  timeRange: { start: Date; end: Date }
  onTimeChange: (time: Date) => void
  isPlaying: boolean
  onPlayPause: () => void
  playbackSpeed: number
  onSpeedChange: (speed: number) => void
}
```

**Features**:
- Time slider with precise control
- Play/pause animation
- Variable playback speed
- Time range selection
- Keyboard shortcuts
- Custom time input

**Usage**:
```tsx
import TimeControls from '../components/TimeControls'

<TimeControls
  currentTime={currentTime}
  timeRange={{ start: startDate, end: endDate }}
  onTimeChange={setCurrentTime}
  isPlaying={isAnimating}
  onPlayPause={toggleAnimation}
  playbackSpeed={1}
  onSpeedChange={setPlaybackSpeed}
/>
```

### Chatbot Component
**File**: `components/Chatbot.tsx`  
**Purpose**: AI-powered assistant for ocean data queries

```typescript
interface ChatbotProps {
  isOpen: boolean
  onToggle: () => void
  stationData?: BuoyData[]
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: any
}
```

**Features**:
- Natural language processing for ocean data queries
- Context-aware responses
- Station data integration
- Expandable/collapsible interface
- Message history
- Loading states and error handling

**Usage**:
```tsx
import Chatbot from '../components/Chatbot'

const [chatbotOpen, setChatbotOpen] = useState(false)

<Chatbot
  isOpen={chatbotOpen}
  onToggle={() => setChatbotOpen(!chatbotOpen)}
  stationData={buoyData}
/>
```

### DesignSystem Component
**File**: `components/DesignSystem.tsx`  
**Purpose**: Component showcase and design system documentation

```typescript
interface DesignSystemProps {
  showAll?: boolean
  category?: string
}
```

**Features**:
- Live component examples
- Design token showcase
- Color palette display
- Typography scale
- Interactive component demos
- Code snippets for developers

**Usage**:
```tsx
import DesignSystem from '../components/DesignSystem'

<DesignSystem showAll={true} />
```

## Common Patterns

### Prop Interfaces
All components use TypeScript interfaces for prop validation:

```typescript
// Standard props pattern
interface ComponentProps {
  // Required props (no default values)
  data: DataType[]
  onAction: (item: DataType) => void
  
  // Optional props with defaults
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  
  // Children for wrapper components
  children?: React.ReactNode
}
```

### State Management
Components follow consistent state management patterns:

```typescript
// Local state for component-specific data
const [localState, setLocalState] = useState(initialValue)

// Props for parent-child communication
const handleAction = (value) => {
  // Local updates
  setLocalState(value)
  
  // Notify parent
  onAction?.(value)
}
```

### Error Handling
All components implement consistent error boundaries:

```typescript
const [error, setError] = useState<Error | null>(null)

try {
  // Component logic
} catch (err) {
  setError(err)
  console.error('Component error:', err)
}

if (error) {
  return <ErrorDisplay error={error} />
}
```

## Styling Architecture

### CSS-in-JS Pattern
Components use Next.js styled-jsx for scoped styling:

```tsx
export default function Component() {
  return (
    <div className="component-wrapper">
      <style jsx>{`
        .component-wrapper {
          /* Component-specific styles */
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        @media (max-width: 768px) {
          .component-wrapper {
            /* Responsive adjustments */
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
```

### Theme Integration
Components support dynamic theming:

```tsx
const Component = ({ isDarkMode }) => {
  return (
    <div className="themed-component">
      <style jsx>{`
        .themed-component {
          background: ${isDarkMode ? '#1f2937' : '#ffffff'};
          color: ${isDarkMode ? '#f3f4f6' : '#111827'};
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  )
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance
All components meet accessibility standards:

```tsx
// Semantic HTML
<button 
  aria-label="Toggle theme"
  aria-pressed={isDarkMode}
  onClick={handleToggle}
>
  {isDarkMode ? '☀️' : '🌙'}
</button>

// Focus management
const buttonRef = useRef<HTMLButtonElement>(null)

useEffect(() => {
  if (shouldFocus) {
    buttonRef.current?.focus()
  }
}, [shouldFocus])

// Screen reader support
<div role="region" aria-label="Ocean monitoring data">
  {/* Component content */}
</div>
```

### Keyboard Navigation
Components support full keyboard navigation:

```tsx
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      handleAction()
      event.preventDefault()
      break
    case 'Escape':
      handleClose()
      break
  }
}
```

## Performance Optimization

### React.memo Usage
Components are optimized with memoization:

```tsx
import { memo } from 'react'

const OptimizedComponent = memo(({ data, onAction }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.data === nextProps.data
})
```

### Lazy Loading
Non-critical components use lazy loading:

```tsx
import dynamic from 'next/dynamic'

const LazyComponent = dynamic(() => import('./ExpensiveComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
})
```

### Virtual Scrolling
Large lists implement virtualization:

```tsx
import { FixedSizeList as List } from 'react-window'

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={60}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <ListItem item={data[index]} />
      </div>
    )}
  </List>
)
```

## Testing Strategy

### Component Testing
Each component includes comprehensive tests:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle', () => {
  it('toggles theme when clicked', () => {
    const onToggle = jest.fn()
    render(<ThemeToggle onToggle={onToggle} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onToggle).toHaveBeenCalledWith(true)
  })
})
```

### Integration Testing
Components are tested in realistic contexts:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { OceanMap } from '../OceanMap'
import { mockBuoyData } from '../__mocks__/data'

describe('OceanMap Integration', () => {
  it('displays station markers', async () => {
    render(<OceanMap buoys={mockBuoyData} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('station-marker')).toBeInTheDocument()
    })
  })
})
```

## Development Guidelines

### Component Creation Checklist
- [ ] TypeScript interface for props
- [ ] Default props where appropriate
- [ ] Error handling and loading states
- [ ] Responsive design implementation
- [ ] Accessibility features (ARIA, keyboard nav)
- [ ] Unit tests with good coverage
- [ ] JSDoc comments for complex logic
- [ ] Performance optimization (memo, lazy loading)
- [ ] Theme support (dark/light modes)
- [ ] Mobile touch interactions

### Code Review Criteria
- Props are properly typed and documented
- Error boundaries are implemented
- Loading and empty states are handled
- Responsive design works on all breakpoints
- Accessibility standards are met
- Performance optimizations are applied
- Tests cover critical functionality
- Code follows established patterns

This component architecture ensures consistency, maintainability, and excellent user experience across the BlueSphere platform.