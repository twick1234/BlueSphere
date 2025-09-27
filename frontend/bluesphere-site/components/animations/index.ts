/**
 * BlueSphere Animation Components Export
 *
 * Centralized exports for all animation components and utilities
 * Easy import for enhanced UX across the marine platform
 */

// Core animation utilities
export * from '../../lib/animations'

// Page transition components
export { PageTransition, LoadingScreen, useRouteChange } from './PageTransition'

// Navigation animations
export { AnimatedNav, FloatingActionButton, AnimatedBreadcrumb } from './AnimatedNav'

// Data visualization animations
export {
  AnimatedMetricCard,
  AnimatedChartContainer,
  AnimatedDataList,
  RealTimeDataFeed
} from './AnimatedDataViz'

// Marine-specific animations
export { AnimatedSharkTracker } from './AnimatedSharkTracker'

// 3D Ocean visualization
export { Ocean3D, Ocean3DSimple } from './Ocean3D'

// Micro-interactions and loading components
export {
  OceanWaveLoader,
  SonarPulseLoader,
  CompassLoader,
  RippleButton,
  FloatingTooltip,
  StatusIndicator,
  WaveProgress
} from './MicroInteractions'

// Common animation presets for quick use
export const commonAnimations = {
  // Smooth fade in from bottom
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Scale and fade in
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  // Ocean wave motion
  waveFloat: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },

  // Hover lift effect
  hoverLift: {
    whileHover: {
      y: -5,
      boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  }
}