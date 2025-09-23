/**
 * BlueSphere Accessibility Provider
 *
 * Centralized accessibility context and utilities for the entire application
 * Provides WCAG 2.1 AA compliant features and screen reader support
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePageAnnouncement, useLiveRegion, useUserPreferences } from '../../hooks/useAccessibility';

interface AccessibilityContextType {
  // Announcements
  announce: (message: string, level?: 'polite' | 'assertive') => void;

  // Focus management
  focusElement: (selector: string) => void;
  trapFocus: boolean;
  setTrapFocus: (trap: boolean) => void;

  // User preferences
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: 'light' | 'dark';

  // Navigation
  currentPage: string;

  // Features
  skipLinksVisible: boolean;
  setSkipLinksVisible: (visible: boolean) => void;

  // Screen reader mode
  screenReaderMode: boolean;
  setScreenReaderMode: (mode: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { announce } = useLiveRegion();
  const pageAnnouncement = usePageAnnouncement();
  const { prefersReducedMotion, prefersHighContrast, prefersColorScheme } = useUserPreferences();

  const [trapFocus, setTrapFocus] = useState(false);
  const [skipLinksVisible, setSkipLinksVisible] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('');

  // Announce page changes
  useEffect(() => {
    if (pageAnnouncement) {
      announce(pageAnnouncement, 'polite');
      setCurrentPage(pageAnnouncement);
    }
  }, [pageAnnouncement, announce]);

  // Detect screen reader usage
  useEffect(() => {
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = !!(
        window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack/i) ||
        window.speechSynthesis ||
        document.body.getAttribute('aria-hidden') !== null
      );

      setScreenReaderMode(hasScreenReader);
    };

    detectScreenReader();

    // Listen for assistive technology events
    const handleFocus = () => detectScreenReader();
    document.addEventListener('focusin', handleFocus);

    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      // Announce focus change for screen readers
      const label = element.getAttribute('aria-label') ||
                   element.textContent ||
                   element.getAttribute('title') ||
                   'Element focused';
      announce(`Focused on ${label}`, 'polite');
    }
  };

  const value: AccessibilityContextType = {
    announce,
    focusElement,
    trapFocus,
    setTrapFocus,
    prefersReducedMotion,
    prefersHighContrast,
    prefersColorScheme,
    currentPage,
    skipLinksVisible,
    setSkipLinksVisible,
    screenReaderMode,
    setScreenReaderMode
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}