# Colors & Theming

## Color Philosophy

BlueSphere's color system is grounded in ocean science and climate data visualization best practices. Our palette balances scientific accuracy with emotional resonance, helping users understand critical climate data while maintaining professional credibility.

## Core Color Palette

### Primary Colors

#### Ocean Blues
```css
--bs-primary: #0a2540      /* Deep Ocean - Primary brand color */
--bs-accent: #2e7dba       /* Ocean Current - Interactive elements */
--bs-ocean: #0c6fb8        /* Open Ocean - Data visualization primary */
--bs-sky: #a6d5ff          /* Sky Blue - Light accents and backgrounds */
```

#### Supporting Colors
```css
--bs-sand: #f4e6d3         /* Sand - Warm neutral backgrounds */
--bs-text: #09233a         /* Deep Navy - Primary text color */
--bs-success: #2e7d32      /* Ocean Green - Success states */
--bs-warning: #f9a825      /* Coral Warning - Caution states */
--bs-danger: #c62828       /* Coral Bleach - Critical alerts */
```

### Temperature Color Scale

Our temperature visualization follows NASA and NOAA conventions for oceanic data:

#### Extreme Heat (26°C+)
```css
--temp-extreme: #8b0000    /* Dark Red - Extreme marine heatwave */
--temp-critical: #dc2626   /* Red - Critical temperature */
--temp-hot: #ef4444        /* Light Red - Hot conditions */
```

#### Moderate Range (18-26°C)
```css
--temp-warm: #fb923c       /* Orange - Warm water */
--temp-mild: #fbbf24       /* Yellow - Mild warm */
--temp-normal: #a3e635     /* Light Green - Normal range */
```

#### Cool Range (<18°C)
```css
--temp-cool: #22c55e       /* Green - Cool water */
--temp-cold: #0ea5e9       /* Blue - Cold water */
--temp-very-cold: #3b82f6  /* Dark Blue - Very cold */
--temp-extreme-cold: #1d4ed8 /* Navy - Extreme cold */
```

## Theme Implementation

### CSS Custom Properties

#### Light Theme (Default)
```css
:root {
  --bs-bg: #f8fafc;           /* Clean white-blue background */
  --bs-fg: #0f172a;           /* Dark text for readability */
  --bs-accent: #0ea5e9;       /* Bright ocean blue for interactions */
  --bs-muted: #64748b;        /* Subtle text and borders */
  --bs-border: #e5e7eb;       /* Light borders and dividers */
}
```

#### Dark Theme
```css
:root[data-theme="dark"] {
  --bs-bg: #0b1020;           /* Deep ocean background */
  --bs-fg: #e2e8f0;           /* Light text for dark backgrounds */
  --bs-accent: #7dd3fc;       /* Bright cyan for visibility */
  --bs-muted: #94a3b8;        /* Muted elements in dark theme */
  --bs-border: #1f2937;       /* Dark borders */
}
```

#### Auto Theme Detection
```css
@media (prefers-color-scheme: dark) {
  :root {
    --bs-bg: #0b1020;
    --bs-fg: #e2e8f0;
    --bs-border: #1f2937;
  }
}
```

### JavaScript Theme Control

#### Theme Toggle Implementation
```typescript
// Theme switching logic (from ThemeToggle.tsx)
const toggleTheme = () => {
  const current = localStorage.getItem('bs-theme') || 'system'
  const next = current === 'light' ? 'dark' : 
               current === 'dark' ? 'system' : 'light'
  
  localStorage.setItem('bs-theme', next)
  applyTheme(next)
}

const applyTheme = (theme: string) => {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
```

## Data Visualization Colors

### Status Indicators

#### Station Status Colors
```css
--status-active: #10b981     /* Green - Station operational */
--status-warning: #f59e0b    /* Amber - Elevated temperature */
--status-critical: #dc2626   /* Red - Critical conditions */
--status-offline: #6b7280    /* Gray - Station offline */
```

#### Marine Heatwave Indicators
```css
--heatwave-moderate: rgba(251, 191, 36, 0.6)   /* Yellow zone */
--heatwave-strong: rgba(239, 68, 68, 0.6)      /* Orange zone */
--heatwave-severe: rgba(220, 38, 38, 0.8)      /* Red zone */
--heatwave-extreme: rgba(139, 0, 0, 0.9)       /* Dark red zone */
```

### Color Accessibility

All color combinations meet WCAG 2.1 AA standards:

#### Contrast Ratios
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: Minimum 3:1 contrast for focus states
- **Data Visualization**: Minimum 3:1 between adjacent colors

#### Color Blind Considerations
- Temperature scales use both color and pattern differentiation
- Critical information never relies on color alone
- Icons and text labels supplement color coding
- Tested with Deuteranopia, Protanopia, and Tritanopia simulators

## Usage Guidelines

### Do's
✅ Use primary colors for brand elements and key actions
✅ Apply temperature colors consistently across all visualizations
✅ Maintain sufficient contrast for readability
✅ Use semantic colors (success, warning, danger) appropriately
✅ Test color combinations for accessibility compliance

### Don'ts
❌ Don't use temperature colors for non-temperature data
❌ Don't rely solely on color to convey critical information
❌ Don't modify brand colors without design team approval
❌ Don't use colors that don't meet accessibility standards
❌ Don't mix warm and cool temperatures on the same scale

## Implementation Examples

### React Component with Theme Colors
```tsx
import { colors } from '../components/DesignSystem'

const TemperatureDisplay = ({ temp }: { temp: number }) => {
  const getColor = () => {
    if (temp >= 26) return colors.danger
    if (temp >= 23) return colors.warning
    return colors.success
  }
  
  return (
    <div style={{ 
      color: getColor(),
      backgroundColor: `var(--bs-bg)`,
      border: `1px solid var(--bs-border)`
    }}>
      {temp.toFixed(1)}°C
    </div>
  )
}
```

### CSS with Custom Properties
```css
.temperature-indicator {
  background: var(--bs-bg);
  color: var(--bs-fg);
  border: 1px solid var(--bs-border);
  transition: background-color 0.3s ease;
}

.temperature-indicator[data-temp="hot"] {
  background: var(--temp-critical);
  color: white;
}

.temperature-indicator[data-temp="normal"] {
  background: var(--temp-normal);
  color: var(--bs-text);
}
```

## Color Testing Tools

### Accessibility Testing
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [Stark Figma Plugin](https://www.getstark.co/)

### Color Blindness Testing
- [Coblis Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- [Sim Daltonism](https://michelf.ca/projects/sim-daltonism/)

### Browser Tools
- Chrome DevTools: Rendering → Emulate vision deficiencies
- Firefox DevTools: Accessibility Inspector

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | Sep 2025 | Initial color system with temperature scales |
| 1.0.1   | Sep 2025 | Enhanced dark theme support |

---

*Color accessibility and scientific accuracy are non-negotiable aspects of the BlueSphere design system. All color decisions support our mission to make ocean monitoring data clear and actionable for global climate response.*