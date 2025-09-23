/**
 * BlueSphere Accessibility Hooks
 *
 * Custom hooks for managing accessibility features throughout the application
 * WCAG 2.1 AA compliant implementations
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook for managing focus and announcing page changes to screen readers
 */
export function usePageAnnouncement() {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Extract page title from URL or use a mapping
      const pageTitles: Record<string, string> = {
        '/': 'Homepage',
        '/map': 'Ocean Map',
        '/sharks': 'Shark Tracking',
        '/species-ai': 'Species AI',
        '/conservation': 'Conservation Action Center',
        '/crisis': 'Crisis Response',
        '/analytics': 'Data Analytics',
        '/historical': 'Historical Data',
        '/education': 'Education Center',
        '/gallery': 'Marine Gallery',
        '/about': 'About BlueSphere'
      };

      const pageTitle = pageTitles[url] || 'BlueSphere Page';
      setAnnouncement(`Navigated to ${pageTitle}`);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  return announcement;
}

/**
 * Hook for managing keyboard navigation and focus management
 */
export function useKeyboardNavigation() {
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);

  const updateFocusableElements = useCallback(() => {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const elements = Array.from(document.querySelectorAll(selectors)) as HTMLElement[];
    setFocusableElements(elements);
  }, []);

  const moveFocus = useCallback((direction: 'next' | 'prev') => {
    if (focusableElements.length === 0) return;

    let newIndex = currentFocusIndex;
    if (direction === 'next') {
      newIndex = (currentFocusIndex + 1) % focusableElements.length;
    } else {
      newIndex = currentFocusIndex <= 0 ? focusableElements.length - 1 : currentFocusIndex - 1;
    }

    setCurrentFocusIndex(newIndex);
    focusableElements[newIndex]?.focus();
  }, [focusableElements, currentFocusIndex]);

  useEffect(() => {
    updateFocusableElements();
    window.addEventListener('DOMContentLoaded', updateFocusableElements);
    return () => window.removeEventListener('DOMContentLoaded', updateFocusableElements);
  }, [updateFocusableElements]);

  return { moveFocus, updateFocusableElements };
}

/**
 * Hook for managing ARIA live regions for dynamic content updates
 */
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((text: string, level: 'polite' | 'assertive' = 'polite') => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setPoliteness(level);
    setMessage(text);

    // Clear message after announcement
    timeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { message, politeness, announce };
}

/**
 * Hook for managing focus trap in modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first element
    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // This should be handled by the parent component
        container.dispatchEvent(new CustomEvent('escape'));
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);

      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for detecting user preferences (reduced motion, high contrast, etc.)
 */
export function useUserPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [prefersColorScheme, setPrefersColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const checkPreferences = () => {
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      setPrefersHighContrast(window.matchMedia('(prefers-contrast: high)').matches);
      setPrefersColorScheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    };

    checkPreferences();

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    const handleHighContrastChange = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches);
    const handleColorSchemeChange = (e: MediaQueryListEvent) => setPrefersColorScheme(e.matches ? 'dark' : 'light');

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, []);

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersColorScheme
  };
}

/**
 * Hook for managing skip links and landmark navigation
 */
export function useSkipLinks() {
  const [skipLinks] = useState([
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#main-navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' },
    { href: '#footer', label: 'Skip to footer' }
  ]);

  const [isVisible, setIsVisible] = useState(false);

  const showSkipLinks = useCallback(() => setIsVisible(true), []);
  const hideSkipLinks = useCallback(() => setIsVisible(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !isVisible) {
        showSkipLinks();
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('skip-link')) {
        hideSkipLinks();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [isVisible, showSkipLinks, hideSkipLinks]);

  return { skipLinks, isVisible };
}

/**
 * Hook for managing accessible form validation
 */
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: string, rules: ValidationRule[]) => {
    for (const rule of rules) {
      if (!rule.test(value)) {
        setErrors(prev => ({ ...prev, [name]: rule.message }));
        return false;
      }
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    return true;
  }, []);

  const touchField = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    touchField,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

/**
 * Hook for managing color contrast validation
 */
export function useColorContrast() {
  const calculateContrast = useCallback((color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      // Convert color to RGB values
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return 0;

      const [r, g, b] = rgb.map(c => {
        const value = parseInt(c, 10) / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }, []);

  const meetsWCAGStandard = useCallback((
    color1: string,
    color2: string,
    level: 'AA' | 'AAA' = 'AA',
    size: 'normal' | 'large' = 'normal'
  ): boolean => {
    const contrast = calculateContrast(color1, color2);

    if (level === 'AAA') {
      return size === 'large' ? contrast >= 4.5 : contrast >= 7;
    }

    return size === 'large' ? contrast >= 3 : contrast >= 4.5;
  }, [calculateContrast]);

  return { calculateContrast, meetsWCAGStandard };
}