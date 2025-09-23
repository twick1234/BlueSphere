/**
 * BlueSphere Live Region Component
 *
 * Provides screen reader announcements for dynamic content updates
 * WCAG 2.1 AA Guideline 4.1.3 - Status Messages
 */

import React from 'react';
import { useLiveRegion } from '../../hooks/useAccessibility';

interface LiveRegionProps {
  className?: string;
  level?: 'polite' | 'assertive';
}

export function LiveRegion({ className = '', level = 'polite' }: LiveRegionProps) {
  const { message } = useLiveRegion();

  return (
    <div
      className={`live-region ${className}`}
      aria-live={level}
      aria-atomic="true"
      role="status"
    >
      {message}

      <style jsx>{`
        .live-region {
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}