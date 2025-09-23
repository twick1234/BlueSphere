/**
 * BlueSphere Skip Links Component
 *
 * Provides keyboard navigation shortcuts to main content areas
 * WCAG 2.1 AA Guideline 2.4.1 - Bypass Blocks
 */

import React from 'react';
import { useSkipLinks } from '../../hooks/useAccessibility';

interface SkipLinksProps {
  additionalLinks?: Array<{
    href: string;
    label: string;
  }>;
}

export function SkipLinks({ additionalLinks = [] }: SkipLinksProps) {
  const { skipLinks, isVisible } = useSkipLinks();

  const allLinks = [...skipLinks, ...additionalLinks];

  return (
    <>
      <div className={`skip-links ${isVisible ? 'visible' : ''}`}>
        {allLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="skip-link"
            onFocus={() => document.body.classList.add('user-is-tabbing')}
          >
            {link.label}
          </a>
        ))}
      </div>

      <style jsx>{`
        .skip-links {
          position: absolute;
          top: -100px;
          left: 0;
          z-index: 9999;
          width: 100%;
          pointer-events: none;
        }

        .skip-links.visible {
          pointer-events: auto;
        }

        .skip-link {
          position: absolute;
          top: -100px;
          left: 8px;
          background: #1e293b;
          color: #ffffff;
          padding: 12px 16px;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          border: 2px solid #3b82f6;
          transition: top 0.3s ease;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .skip-link:focus {
          top: 8px;
          outline: 2px solid #fbbf24;
          outline-offset: 2px;
        }

        .skip-link:hover {
          background: #334155;
          transform: translateY(-1px);
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .skip-link {
            background: #000000;
            color: #ffffff;
            border: 3px solid #ffffff;
          }

          .skip-link:focus {
            outline: 3px solid #ffff00;
            background: #ffffff;
            color: #000000;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .skip-link {
            transition: none;
          }

          .skip-link:hover {
            transform: none;
          }
        }

        /* Ensure skip links work with screen magnification */
        @media (min-width: 1280px) and (min-height: 720px) {
          .skip-link {
            font-size: 16px;
            padding: 14px 20px;
          }
        }
      `}</style>
    </>
  );
}