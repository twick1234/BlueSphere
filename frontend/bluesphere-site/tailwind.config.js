/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // BlueSphere Brand Colors
        'bs-ocean': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49'
        },
        'bs-deep': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        'bs-coral': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        'bs-kelp': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        'bs-sand': {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006'
        },
        // Semantic Colors
        'bs-success': '#10b981',
        'bs-warning': '#f59e0b',
        'bs-error': '#ef4444',
        'bs-info': '#0ea5e9'
      },
      spacing: {
        // Custom spacing scale based on 0.25rem (4px)
        '18': '4.5rem',     // 72px
        '88': '22rem',      // 352px
        '100': '25rem',     // 400px
        '112': '28rem',     // 448px
        '128': '32rem',     // 512px
        '144': '36rem',     // 576px
        '160': '40rem',     // 640px
        '176': '44rem',     // 704px
        '192': '48rem',     // 768px
        '208': '52rem',     // 832px
        '224': '56rem',     // 896px
        '240': '60rem',     // 960px
        '256': '64rem'      // 1024px
      },
      fontSize: {
        // Enhanced typography scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }]
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'serif': ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px'
      },
      boxShadow: {
        'bs-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'bs-DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'bs-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'bs-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'bs-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'bs-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'bs-ocean': '0 10px 20px -5px rgba(14, 165, 233, 0.3)',
        'bs-coral': '0 10px 20px -5px rgba(239, 68, 68, 0.3)'
      },
      backgroundImage: {
        'bs-ocean-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        'bs-deep-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'bs-coral-gradient': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'bs-kelp-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'bs-hero-gradient': 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #fbbf24 100%)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      typography: (theme) => ({
        'bs': {
          css: {
            '--tw-prose-body': theme('colors.bs-deep.700'),
            '--tw-prose-headings': theme('colors.bs-deep.900'),
            '--tw-prose-lead': theme('colors.bs-deep.600'),
            '--tw-prose-links': theme('colors.bs-ocean.500'),
            '--tw-prose-bold': theme('colors.bs-deep.900'),
            '--tw-prose-counters': theme('colors.bs-deep.500'),
            '--tw-prose-bullets': theme('colors.bs-deep.300'),
            '--tw-prose-hr': theme('colors.bs-deep.200'),
            '--tw-prose-quotes': theme('colors.bs-deep.900'),
            '--tw-prose-quote-borders': theme('colors.bs-deep.200'),
            '--tw-prose-captions': theme('colors.bs-deep.500'),
            '--tw-prose-code': theme('colors.bs-deep.900'),
            '--tw-prose-pre-code': theme('colors.bs-deep.100'),
            '--tw-prose-pre-bg': theme('colors.bs-deep.900'),
            '--tw-prose-th-borders': theme('colors.bs-deep.300'),
            '--tw-prose-td-borders': theme('colors.bs-deep.200')
          }
        }
      })
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
}