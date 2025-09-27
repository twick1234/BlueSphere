/**
 * BlueSphere Animation System
 *
 * Centralized animation configurations for consistent UX across the platform
 * Optimized for marine data visualizations and real-time updates
 */

import { Variants, Transition } from 'framer-motion'

// Core animation timings
export const timing = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
  marine: 1.2, // Ocean-like slower timing for marine elements
}

// Easing functions inspired by ocean movements
export const easing = {
  ocean: [0.25, 0.46, 0.45, 0.94], // Smooth wave-like motion
  tide: [0.4, 0.0, 0.2, 1], // Gentle tide movement
  current: [0.68, -0.55, 0.265, 1.55], // Strong current flow
  bubble: [0.175, 0.885, 0.32, 1.275], // Air bubble rising
  default: [0.4, 0, 0.2, 1], // Material design default
}

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  }
}

export const pageTransition: Transition = {
  type: "tween",
  ease: easing.ocean,
  duration: timing.normal,
}

// Marine-specific animations
export const marineVariants: Variants = {
  // Shark movement animation
  sharkSwim: {
    x: [0, 30, -30, 0],
    y: [0, -10, 5, 0],
    rotate: [0, 2, -2, 0],
    transition: {
      duration: timing.marine * 3,
      repeat: Infinity,
      ease: easing.tide,
    }
  },

  // Ocean wave effect
  waveMotion: {
    y: [0, -15, 0],
    transition: {
      duration: timing.marine,
      repeat: Infinity,
      ease: easing.ocean,
    }
  },

  // Data bubble rising
  dataBubble: {
    y: [100, -20],
    opacity: [0, 1, 1, 0],
    scale: [0.8, 1.2, 1, 0.9],
    transition: {
      duration: timing.marine * 2,
      repeat: Infinity,
      ease: easing.bubble,
    }
  },
}

// Data visualization animations
export const dataVariants: Variants = {
  // Chart entry animation
  chartEnter: {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          duration: timing.slow,
          ease: easing.ocean
        },
        opacity: {
          duration: timing.fast
        },
      },
    },
  },

  // Real-time data update
  dataUpdate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: timing.fast,
      ease: easing.bubble,
    }
  },

  // Alert pulse
  alertPulse: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: timing.normal,
      repeat: Infinity,
      ease: easing.tide,
    }
  },
}

// Navigation animations
export const navVariants: Variants = {
  // Menu slide in
  menuSlide: {
    hidden: {
      x: -100,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    },
  },

  // Button hover effect
  buttonHover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    }
  },

  // Tab switch animation
  tabSwitch: {
    hidden: {
      opacity: 0,
      x: -20
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: timing.normal,
        ease: easing.ocean,
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: timing.fast,
        ease: easing.default,
      }
    }
  },
}

// Loading animations
export const loadingVariants: Variants = {
  // Ocean wave loader
  oceanWave: {
    y: [0, -20, 0],
    transition: {
      duration: timing.marine,
      repeat: Infinity,
      ease: easing.ocean,
    }
  },

  // Spinning compass
  compass: {
    rotate: 360,
    transition: {
      duration: timing.slower,
      repeat: Infinity,
      ease: "linear",
    }
  },

  // Sonar pulse
  sonarPulse: {
    scale: [0, 1.5],
    opacity: [1, 0],
    transition: {
      duration: timing.marine,
      repeat: Infinity,
      ease: easing.tide,
    }
  },
}

// Card and component animations
export const componentVariants: Variants = {
  // Card hover lift
  cardLift: {
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    }
  },

  // Modal appearance
  modalAppear: {
    hidden: {
      opacity: 0,
      scale: 0.75,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.75,
      y: 50,
      transition: {
        duration: timing.fast,
        ease: easing.default,
      },
    },
  },

  // List item stagger
  listStagger: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: timing.normal,
        ease: easing.ocean,
      },
    },
  },
}

// Container animations for staggered children
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1,
      ease: easing.ocean,
    },
  },
}

// Utility function to create custom marine-themed animations
export const createMarineAnimation = (
  duration: number = timing.marine,
  easeType: keyof typeof easing = 'ocean'
) => ({
  transition: {
    duration,
    ease: easing[easeType],
    repeat: Infinity,
  }
})

// Export commonly used animation combinations
export const animations = {
  // Smooth page entry
  pageEntry: {
    variants: pageVariants,
    initial: "initial",
    animate: "in",
    exit: "out",
    transition: pageTransition,
  },

  // Card interaction
  cardInteraction: {
    whileHover: componentVariants.cardLift,
    whileTap: { scale: 0.98 },
  },

  // Button interaction
  buttonInteraction: {
    whileHover: navVariants.buttonHover,
    whileTap: { scale: 0.95 },
  },

  // Data reveal
  dataReveal: {
    variants: containerVariants,
    initial: "hidden",
    animate: "visible",
  },
}