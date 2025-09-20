/*
 * BlueSphere Page Layout Components
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Modern page layout system inspired by GitHub, Linear, and Notion
 */

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Page Header Component
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => (
  <>
    <style jsx>{`
      .page-header {
        max-width: 1280px;
        margin: 0 auto;
        padding: 48px 24px 32px;
        border-bottom: 1px solid #d0d7de;
      }

      @media (prefers-color-scheme: dark) {
        .page-header {
          border-bottom-color: #30363d;
        }
      }

      .page-title {
        font-size: 32px;
        font-weight: 600;
        line-height: 1.2;
        color: #24292f;
        margin: 0 0 8px 0;
      }

      .page-subtitle {
        font-size: 16px;
        color: #656d76;
        margin: 0 0 24px 0;
        max-width: 600px;
      }

      @media (prefers-color-scheme: dark) {
        .page-title {
          color: #e6edf3;
        }
        .page-subtitle {
          color: #7d8590;
        }
      }

      @media (max-width: 768px) {
        .page-header {
          padding: 24px 16px 20px;
        }
        .page-title {
          font-size: 24px;
        }
        .page-subtitle {
          font-size: 14px;
        }
      }
    `}</style>
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {children}
    </header>
  </>
);

// Page Section Component
export const PageSection: React.FC<PageSectionProps> = ({ children, className = '' }) => (
  <>
    <style jsx>{`
      .page-section {
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px;
      }

      @media (max-width: 768px) {
        .page-section {
          padding: 24px 16px;
        }
      }
    `}</style>
    <section className={`page-section ${className}`}>
      {children}
    </section>
  </>
);

// Card Component
export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => (
  <>
    <style jsx>{`
      .card {
        background-color: #ffffff;
        border: 1px solid #d0d7de;
        border-radius: 12px;
        padding: 24px;
        transition: all 0.15s ease;
      }

      .card.hover:hover {
        border-color: #858f99;
        box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
        transform: translateY(-1px);
      }

      @media (prefers-color-scheme: dark) {
        .card {
          background-color: #161b22;
          border-color: #30363d;
        }
        .card.hover:hover {
          border-color: #424a53;
          box-shadow: 0 8px 24px rgba(1, 4, 9, 0.8);
        }
      }
    `}</style>
    <div className={`card ${hover ? 'hover' : ''} ${className}`}>
      {children}
    </div>
  </>
);

// Button Component
export const Button: React.FC<ButtonProps> = ({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const baseStyles = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.15s ease;
    cursor: pointer;
    border: 1px solid transparent;
    white-space: nowrap;
  `;

  const sizeStyles = {
    sm: 'padding: 6px 12px; font-size: 12px;',
    md: 'padding: 8px 16px; font-size: 14px;',
    lg: 'padding: 12px 24px; font-size: 16px;'
  };

  const variantStyles = {
    primary: `
      background-color: #0969da;
      color: #ffffff;
      border-color: #0969da;
    `,
    secondary: `
      background-color: #f6f8fa;
      color: #24292f;
      border-color: #d0d7de;
    `,
    ghost: `
      background-color: transparent;
      color: #656d76;
      border-color: transparent;
    `
  };

  const hoverStyles = {
    primary: `
      background-color: #0550ae;
      border-color: #0550ae;
    `,
    secondary: `
      background-color: #f3f4f6;
      border-color: #afb8c1;
    `,
    ghost: `
      background-color: #f6f8fa;
      color: #24292f;
    `
  };

  const darkModeStyles = {
    primary: `
      background-color: #0969da;
      color: #ffffff;
    `,
    secondary: `
      background-color: #21262d;
      color: #e6edf3;
      border-color: #30363d;
    `,
    ghost: `
      background-color: transparent;
      color: #7d8590;
    `
  };

  const darkHoverStyles = {
    primary: `
      background-color: #0860ca;
    `,
    secondary: `
      background-color: #30363d;
      border-color: #424a53;
    `,
    ghost: `
      background-color: #21262d;
      color: #e6edf3;
    `
  };

  const ButtonElement = href ? 'a' : 'button';

  return (
    <>
      <style jsx>{`
        .btn {
          ${baseStyles}
          ${sizeStyles[size]}
          ${variantStyles[variant]}
        }

        .btn:hover {
          ${hoverStyles[variant]}
          text-decoration: none;
          color: ${variant === 'primary' ? '#ffffff' : variant === 'secondary' ? '#24292f' : '#24292f'};
        }

        @media (prefers-color-scheme: dark) {
          .btn {
            ${darkModeStyles[variant]}
          }
          .btn:hover {
            ${darkHoverStyles[variant]}
            color: ${variant === 'primary' ? '#ffffff' : variant === 'secondary' ? '#e6edf3' : '#e6edf3'};
          }
        }
      `}</style>
      <ButtonElement
        className={`btn ${className}`}
        href={href}
        onClick={onClick}
        {...(href ? { target: href.startsWith('http') ? '_blank' : undefined, rel: href.startsWith('http') ? 'noopener noreferrer' : undefined } : {})}
      >
        {children}
      </ButtonElement>
    </>
  );
};

// Grid Component
interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ children, cols = 2, gap = 'md', className = '' }) => (
  <>
    <style jsx>{`
      .grid {
        display: grid;
        grid-template-columns: repeat(${cols}, 1fr);
        gap: ${gap === 'sm' ? '16px' : gap === 'md' ? '24px' : '32px'};
      }

      @media (max-width: 1024px) {
        .grid {
          grid-template-columns: repeat(${Math.min(cols, 2)}, 1fr);
        }
      }

      @media (max-width: 768px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
    <div className={`grid ${className}`}>
      {children}
    </div>
  </>
);

// Stats Component
interface StatsProps {
  stats: Array<{
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

export const Stats: React.FC<StatsProps> = ({ stats }) => (
  <>
    <style jsx>{`
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .stat-card {
        background-color: #ffffff;
        border: 1px solid #d0d7de;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #24292f;
        margin: 0 0 4px 0;
      }

      .stat-label {
        font-size: 12px;
        color: #656d76;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }

      .stat-change {
        font-size: 12px;
        margin-top: 4px;
      }

      .stat-change.up { color: #1a7f37; }
      .stat-change.down { color: #cf222e; }
      .stat-change.neutral { color: #656d76; }

      @media (prefers-color-scheme: dark) {
        .stat-card {
          background-color: #161b22;
          border-color: #30363d;
        }
        .stat-value {
          color: #e6edf3;
        }
        .stat-label {
          color: #7d8590;
        }
      }
    `}</style>
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
          {stat.change && (
            <div className={`stat-change ${stat.trend || 'neutral'}`}>
              {stat.change}
            </div>
          )}
        </div>
      ))}
    </div>
  </>
);