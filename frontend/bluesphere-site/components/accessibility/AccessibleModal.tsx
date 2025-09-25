/**
 * BlueSphere Accessible Modal Component
 *
 * Fully accessible modal implementation with focus management and ARIA support
 * WCAG 2.1 AA compliant with keyboard navigation and screen reader support
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useAccessibility';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}: AccessibleModalProps) {
  const { announce, prefersReducedMotion, setTrapFocus } = useAccessibility();
  const modalRef = useFocusTrap(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `modal-description-${Math.random().toString(36).substr(2, 9)}` : undefined;

  // Manage focus trap
  useEffect(() => {
    setTrapFocus(isOpen);
    return () => setTrapFocus(false);
  }, [isOpen, setTrapFocus]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        announce('Modal closed', 'polite');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose, announce]);

  // Announce modal state changes
  useEffect(() => {
    if (isOpen) {
      announce(`Modal opened: ${title}`, 'polite');
    }
  }, [isOpen, title, announce]);

  // Handle overlay clicks
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
      announce('Modal closed', 'polite');
    }
  };

  if (!isOpen) return null;

  const getSizeClasses = () => {
    const sizes = {
      sm: 'modal-sm',
      md: 'modal-md',
      lg: 'modal-lg',
      xl: 'modal-xl'
    };
    return sizes[size];
  };

  return (
    <>
      <div
        ref={overlayRef}
        className="modal-overlay"
        onClick={handleOverlayClick}
        aria-hidden="true"
      >
        <div
          ref={modalRef as React.RefObject<HTMLDivElement>}
          className={`modal ${getSizeClasses()} ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label={`Close ${title} modal`}
              type="button"
            >
              ✕
            </button>
          </div>

          {description && (
            <div id={descriptionId} className="modal-description">
              {description}
            </div>
          )}

          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          overflow-y: auto;
          animation: ${prefersReducedMotion ? 'none' : 'overlay-enter 0.2s ease-out'};
        }

        .modal {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-height: calc(100vh - 32px);
          width: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          animation: ${prefersReducedMotion ? 'none' : 'modal-enter 0.3s ease-out'};
          border: 1px solid #e5e7eb;
        }

        .modal:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Modal Sizes */
        .modal-sm {
          max-width: 400px;
        }

        .modal-md {
          max-width: 600px;
        }

        .modal-lg {
          max-width: 800px;
        }

        .modal-xl {
          max-width: 1200px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 0;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 16px;
        }

        .modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          line-height: 1.2;
        }

        .modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          transition: ${prefersReducedMotion ? 'none' : 'all 0.15s ease'};
          font-size: 16px;
          font-weight: bold;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-close:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          background: #dbeafe;
        }

        .modal-description {
          padding: 16px 24px 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .modal-content {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .modal {
            background: #ffffff;
            border: 3px solid #000000;
          }

          .modal-close {
            border: 2px solid #000000;
          }

          .modal-close:focus {
            outline: 3px solid #ffff00;
            background: #000000;
            color: #ffffff;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .modal {
            background: #1f2937;
            border-color: #374151;
          }

          .modal-title {
            color: #f9fafb;
          }

          .modal-close {
            color: #9ca3af;
          }

          .modal-close:hover {
            background: #374151;
            color: #f3f4f6;
          }

          .modal-description {
            color: #d1d5db;
          }
        }

        /* Animations */
        @keyframes overlay-enter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .modal-overlay {
            padding: 8px;
            align-items: flex-start;
            padding-top: 20px;
          }

          .modal {
            max-height: calc(100vh - 40px);
            margin: 0;
          }

          .modal-sm,
          .modal-md,
          .modal-lg,
          .modal-xl {
            max-width: 100%;
          }

          .modal-header,
          .modal-content {
            padding-left: 16px;
            padding-right: 16px;
          }
        }

        /* Ensure modal is accessible to screen readers */
        .modal-overlay[aria-hidden="true"] {
          pointer-events: auto;
        }

        /* Print styles */
        @media print {
          .modal-overlay {
            position: static;
            background: transparent;
            padding: 0;
          }

          .modal {
            box-shadow: none;
            border: 2px solid #000000;
            max-height: none;
            animation: none;
          }

          .modal-close {
            display: none;
          }
        }
      `}</style>
    </>
  );
}