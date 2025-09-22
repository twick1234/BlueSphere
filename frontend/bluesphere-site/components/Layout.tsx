/*
 * BlueSphere Layout Component - Wrapper for WorldClassLayout
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * This component now wraps WorldClassLayout for backward compatibility
 */

import React from 'react'
import WorldClassLayout from './WorldClassLayout'

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  noindex?: boolean;
  showNavigation?: boolean;
  showBreadcrumbs?: boolean;
  showQuickAccess?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  keywords,
  canonical,
  noindex = false,
  showNavigation = true,
  showBreadcrumbs = true,
  showQuickAccess = true
}) => {

  return (
    <WorldClassLayout
      title={title}
      description={description}
      keywords={keywords}
    >
      {children}
    </WorldClassLayout>
  )
}

export default Layout