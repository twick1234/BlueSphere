/**
 * BlueSphere Accessible Button Component
 *
 * Fully accessible button implementation with comprehensive ARIA support
 * WCAG 2.1 AA compliant with focus management and keyboard navigation
 */

import React, { forwardRef, useState, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  description?: string;
  announcement?: string;
  onPress?: () => void;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    description,
    announcement,
    onPress,
    onClick,
    disabled,
    className = '',
    ...props
  }, ref) => {
    const { announce, prefersReducedMotion, prefersHighContrast } = useAccessibility();
    const [isPressed, setIsPressed] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      // Announce button action
      if (announcement) {
        announce(announcement, 'polite');
      }

      // Call both handlers
      onPress?.();
      onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === ' ' || event.key === 'Enter') {
        setIsPressed(true);
      }
    };

    const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === ' ' || event.key === 'Enter') {
        setIsPressed(false);
      }
    };

    const getVariantClasses = () => {
      const base = 'button-base';
      const variants = {
        primary: 'button-primary',
        secondary: 'button-secondary',
        outline: 'button-outline',
        ghost: 'button-ghost',
        danger: 'button-danger'
      };
      return `${base} ${variants[variant]}`;
    };

    const getSizeClasses = () => {
      const sizes = {
        sm: 'button-sm',
        md: 'button-md',
        lg: 'button-lg'
      };
      return sizes[size];
    };

    const isDisabled = disabled || loading;

    return (
      <>
        <button
          ref={ref || buttonRef}
          className={`
            accessible-button
            ${getVariantClasses()}
            ${getSizeClasses()}
            ${fullWidth ? 'button-full-width' : ''}
            ${isPressed ? 'button-pressed' : ''}
            ${isDisabled ? 'button-disabled' : ''}
            ${prefersHighContrast ? 'high-contrast' : ''}
            ${className}
          `}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-describedby={description ? `${props.id || 'button'}-description` : undefined}
          aria-busy={loading}
          {...props}
        >
          {loading && (
            <span className="loading-spinner" aria-hidden="true">
              ⟳
            </span>
          )}

          {icon && iconPosition === 'left' && (
            <span className="button-icon icon-left" aria-hidden="true">
              {icon}
            </span>
          )}

          <span className={loading ? 'button-text-loading' : 'button-text'}>
            {children}
          </span>

          {icon && iconPosition === 'right' && (
            <span className="button-icon icon-right" aria-hidden="true">
              {icon}
            </span>
          )}
        </button>

        {description && (
          <div
            id={`${props.id || 'button'}-description`}
            className="button-description"
          >
            {description}
          </div>
        )}

        <style jsx>{`
          .accessible-button {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 2px solid transparent;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: ${prefersReducedMotion ? 'none' : 'all 0.2s ease'};
            box-sizing: border-box;
            font-family: inherit;
            line-height: 1;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }

          .accessible-button:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          .accessible-button:focus:not(:focus-visible) {
            outline: none;
          }

          .accessible-button:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          /* Button Variants */
          .button-primary {
            background: #3b82f6;
            color: #ffffff;
            border-color: #3b82f6;
          }

          .button-primary:hover:not(.button-disabled) {
            background: #2563eb;
            border-color: #2563eb;
            transform: ${prefersReducedMotion ? 'none' : 'translateY(-1px)'};
            box-shadow: ${prefersReducedMotion ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.4)'};
          }

          .button-secondary {
            background: #64748b;
            color: #ffffff;
            border-color: #64748b;
          }

          .button-secondary:hover:not(.button-disabled) {
            background: #475569;
            border-color: #475569;
            transform: ${prefersReducedMotion ? 'none' : 'translateY(-1px)'};
          }

          .button-outline {
            background: transparent;
            color: #3b82f6;
            border-color: #3b82f6;
          }

          .button-outline:hover:not(.button-disabled) {
            background: #3b82f6;
            color: #ffffff;
          }

          .button-ghost {
            background: transparent;
            color: #374151;
            border-color: transparent;
          }

          .button-ghost:hover:not(.button-disabled) {
            background: #f3f4f6;
            color: #1f2937;
          }

          .button-danger {
            background: #ef4444;
            color: #ffffff;
            border-color: #ef4444;
          }

          .button-danger:hover:not(.button-disabled) {
            background: #dc2626;
            border-color: #dc2626;
          }

          /* Button Sizes */
          .button-sm {
            padding: 8px 16px;
            font-size: 14px;
            min-height: 36px;
            min-width: 64px;
          }

          .button-md {
            padding: 12px 24px;
            font-size: 16px;
            min-height: 44px;
            min-width: 88px;
          }

          .button-lg {
            padding: 16px 32px;
            font-size: 18px;
            min-height: 52px;
            min-width: 112px;
          }

          /* States */
          .button-full-width {
            width: 100%;
          }

          .button-disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
          }

          .button-pressed {
            transform: translateY(1px);
          }

          /* Loading state */
          .loading-spinner {
            display: inline-flex;
            animation: ${prefersReducedMotion ? 'none' : 'spin 1s linear infinite'};
            font-size: 16px;
          }

          .button-text-loading {
            opacity: 0.7;
          }

          /* Icons */
          .button-icon {
            display: inline-flex;
            align-items: center;
            font-size: 16px;
          }

          .icon-left {
            margin-right: 4px;
          }

          .icon-right {
            margin-left: 4px;
          }

          /* Description */
          .button-description {
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
          }

          /* High contrast mode */
          .high-contrast.button-primary {
            background: #000000;
            color: #ffffff;
            border: 3px solid #ffffff;
          }

          .high-contrast.button-primary:hover:not(.button-disabled) {
            background: #ffffff;
            color: #000000;
            border-color: #000000;
          }

          .high-contrast.button-outline {
            border: 3px solid #000000;
            color: #000000;
          }

          .high-contrast:focus {
            outline: 3px solid #ffff00;
            outline-offset: 2px;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          /* Touch targets - minimum 44px for mobile accessibility */
          @media (pointer: coarse) {
            .button-sm {
              min-height: 44px;
              padding: 12px 16px;
            }
          }

          /* Print styles */
          @media print {
            .accessible-button {
              background: transparent !important;
              color: #000000 !important;
              border: 2px solid #000000 !important;
            }
          }
        `}</style>
      </>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';