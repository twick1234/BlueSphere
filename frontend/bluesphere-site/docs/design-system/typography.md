# Typography

## Typography Philosophy

BlueSphere's typography system prioritizes data clarity, scientific credibility, and international accessibility. Our type choices support rapid information scanning, detailed data analysis, and clear hierarchical relationships essential for climate monitoring applications.

## Font Stack

### System Font Stack
```css
font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 
             Roboto, Ubuntu, Cantarell, 'Noto Sans', 'Helvetica Neue', 
             Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
```

**Rationale**: System fonts provide optimal performance, native OS integration, and broad language support while maintaining professional readability across all devices.

### Monospace Stack (Data Display)
```css
font-family: ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', 
             'Roboto Mono', Consolas, 'Courier New', monospace;
```

**Usage**: Station IDs, coordinates, precise measurements, timestamps, and code snippets.

## Type Scale & Hierarchy

### Display Typography
```css
/* H1 - Page Headlines */
h1 {
  font-size: 34px;      /* 2.125rem */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 18px 0;
}

/* H2 - Section Headers */
h2 {
  font-size: 26px;      /* 1.625rem */
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  margin: 16px 0;
}

/* H3 - Subsection Headers */
h3 {
  font-size: 20px;      /* 1.25rem */
  font-weight: 600;
  line-height: 1.4;
  margin: 14px 0;
}

/* H4 - Component Headers */
h4 {
  font-size: 16px;      /* 1rem */
  font-weight: 600;
  line-height: 1.4;
  margin: 12px 0;
}
```

### Body Typography
```css
/* Body Text */
p, .body-text {
  font-size: 16px;      /* 1rem */
  font-weight: 400;
  line-height: 1.625;   /* 26px */
  margin-bottom: 16px;
}

/* Small Text */
.text-small {
  font-size: 14px;      /* 0.875rem */
  line-height: 1.5;
}

/* Caption Text */
.text-caption {
  font-size: 12px;      /* 0.75rem */
  line-height: 1.4;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### Data Typography
```css
/* Large Data Display */
.data-large {
  font-family: var(--mono-font);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

/* Regular Data Display */
.data-regular {
  font-family: var(--mono-font);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

/* Small Data Display */
.data-small {
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}
```

## Color & Contrast

### Text Color Hierarchy
```css
/* Primary Text */
.text-primary {
  color: var(--bs-fg);      /* High contrast for body text */
}

/* Secondary Text */
.text-secondary {
  color: var(--bs-muted);   /* Medium contrast for supporting text */
  opacity: 0.8;
}

/* Tertiary Text */
.text-tertiary {
  color: var(--bs-muted);   /* Low contrast for least important text */
  opacity: 0.6;
}

/* Link Text */
.text-link {
  color: var(--bs-accent);
  text-decoration: none;
}

.text-link:hover {
  text-decoration: underline;
}
```

### Semantic Text Colors
```css
/* Status Colors */
.text-success { color: var(--bs-success); }
.text-warning { color: var(--bs-warning); }
.text-danger { color: var(--bs-danger); }

/* Temperature Colors */
.text-temp-hot { color: var(--temp-critical); }
.text-temp-warm { color: var(--temp-warm); }
.text-temp-normal { color: var(--temp-normal); }
.text-temp-cold { color: var(--temp-cold); }
```

## Responsive Typography

### Breakpoint Scaling
```css
/* Mobile First Approach */
@media (max-width: 768px) {
  h1 { font-size: 28px; margin: 16px 0; }
  h2 { font-size: 22px; margin: 14px 0; }
  h3 { font-size: 18px; margin: 12px 0; }
  p { font-size: 15px; line-height: 1.6; }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  h1 { font-size: 30px; }
  h2 { font-size: 24px; }
}

/* Desktop */
@media (min-width: 1025px) {
  h1 { font-size: 34px; }
  h2 { font-size: 26px; }
  
  /* Larger displays can handle more generous spacing */
  p { line-height: 1.7; }
}
```

## Component-Specific Typography

### Navigation Typography
```css
.nav-brand {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.nav-link {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
}
```

### Button Typography
```css
.button-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
}

.button-small {
  font-size: 12px;
  font-weight: 500;
}
```

### Form Typography
```css
.form-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
}

.form-input {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.4;
}

.form-help {
  font-size: 12px;
  font-weight: 400;
  color: var(--bs-muted);
  margin-top: 4px;
}

.form-error {
  font-size: 12px;
  font-weight: 500;
  color: var(--bs-danger);
  margin-top: 4px;
}
```

### Data Visualization Typography
```css
/* Chart Labels */
.chart-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.chart-label {
  font-size: 11px;
  font-weight: 500;
  fill: var(--bs-muted);
}

.chart-value {
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 600;
}

/* Map Legend */
.legend-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.legend-item {
  font-size: 11px;
  font-weight: 400;
  line-height: 1.4;
}
```

## Typography Implementation

### React Components
```tsx
// Typography components from DesignSystem.tsx
export const H1 = ({ children }: { children: ReactNode }) => (
  <h1 style={{
    fontSize: 34,
    margin: '18px 0',
    color: colors.primary,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em'
  }}>
    {children}
  </h1>
)

export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 style={{
    fontSize: 26,
    margin: '16px 0',
    color: colors.primary,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em'
  }}>
    {children}
  </h2>
)

export const P = ({ children }: { children: ReactNode }) => (
  <p style={{
    fontSize: 16,
    lineHeight: '26px',
    color: colors.text,
    marginBottom: 16
  }}>
    {children}
  </p>
)
```

### CSS Utilities
```css
/* Typography Utilities */
.text-xs { font-size: 12px; }
.text-sm { font-size: 14px; }
.text-base { font-size: 16px; }
.text-lg { font-size: 18px; }
.text-xl { font-size: 20px; }
.text-2xl { font-size: 24px; }

.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.font-mono { font-family: var(--mono-font); }

.leading-tight { line-height: 1.2; }
.leading-normal { line-height: 1.4; }
.leading-relaxed { line-height: 1.6; }

.tracking-tight { letter-spacing: -0.02em; }
.tracking-normal { letter-spacing: 0; }
.tracking-wide { letter-spacing: 0.02em; }
```

## Accessibility Guidelines

### Reading Experience
- **Line Height**: Minimum 1.5x font size for body text
- **Paragraph Spacing**: Equal to line height for optimal scanning
- **Text Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Clear visual focus for keyboard navigation

### Internationalization
- **Language Support**: System fonts provide broad Unicode coverage
- **RTL Support**: Layout adapts for right-to-left languages
- **Font Scaling**: Respects user's browser font size preferences
- **Reading Direction**: CSS logical properties for international layouts

### Readability Best Practices
- **Optimal Line Length**: 45-75 characters per line for body text
- **Hierarchy Clarity**: Consistent heading structure (H1 → H2 → H3)
- **Scan-friendly**: Important information in headings and first sentences
- **White Space**: Generous margins and padding for comfortable reading

## Usage Guidelines

### Do's
✅ Use system font stack for performance and native feel
✅ Maintain consistent type hierarchy throughout the application
✅ Use monospace fonts for data that needs alignment
✅ Scale typography responsively across breakpoints
✅ Ensure sufficient contrast for all text elements

### Don'ts
❌ Don't use more than 3 different font sizes on a single screen
❌ Don't use decorative fonts that impair data readability
❌ Don't rely solely on typography to convey meaning
❌ Don't use font weights that aren't available in system fonts
❌ Don't ignore user font size preferences

## Testing & Validation

### Accessibility Testing
```bash
# Test with screen readers
npm run test:a11y

# Validate contrast ratios
npm run test:contrast

# Test with different font sizes
# Browser settings: 200% font size
```

### Cross-browser Testing
- **Safari**: System font rendering on macOS/iOS
- **Chrome**: Font rendering consistency across platforms
- **Firefox**: International character support
- **Edge**: Windows system font integration

### Performance Testing
- **Font Loading**: System fonts load instantly
- **Render Blocking**: No custom font downloads required
- **CLS Impact**: Minimal layout shift with system fonts

---

*Typography serves as the foundation for clear communication in climate science. Every typographic decision supports rapid comprehension of critical ocean monitoring data.*