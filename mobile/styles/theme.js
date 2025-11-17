/**
 * Stera IoT Mobile App - Design System and Theme
 * Centralized styling constants for consistent UI across the app
 */

export const COLORS = {
  // Primary Brand Colors (Stera Orange)
  primary: '#f97316',
  primaryDark: '#ea580c',
  primaryLight: '#fb923c',
  primaryLighter: '#fed7aa',

  // Activity Status Colors
  activity: {
    driving: '#3b82f6',    // Blue
    working: '#10b981',    // Green
    idle: '#f59e0b',       // Amber
    parked: '#6b7280',     // Gray
    charging: '#8b5cf6',   // Purple
    unknown: '#9ca3af'     // Light Gray
  },

  // Battery Status Colors
  battery: {
    high: '#10b981',       // Green (70-100%)
    medium: '#f59e0b',     // Amber (40-69%)
    low: '#ef4444',        // Red (0-39%)
    charging: '#8b5cf6'    // Purple
  },

  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Background Colors (Dark theme like web dashboard)
  background: {
    primary: '#1a202c',    // Dark background (matches web)
    secondary: '#2d3748',  // Card background (matches web)
    dark: '#1f2937',       // Dark gray
    darker: '#111827'      // Darker gray
  },

  // Text Colors (Dark theme)
  text: {
    primary: '#ffffff',    // White (for dark backgrounds)
    secondary: '#a0aec0',  // Light gray (matches web)
    tertiary: '#718096',   // Medium gray
    white: '#ffffff',
    light: 'rgba(255, 255, 255, 0.9)',
    lighter: 'rgba(255, 255, 255, 0.7)'
  },

  // Border Colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af'
  },

  // Shadow Color
  shadow: '#000000',

  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)'
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40
};

export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 32,
    massive: 36
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800'
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
};

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 9999
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  xl: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8
  }
};

export const LAYOUT = {
  // Screen padding
  screenPadding: SPACING.lg,
  screenPaddingHorizontal: SPACING.lg,
  screenPaddingVertical: SPACING.lg,

  // Card padding
  cardPadding: SPACING.lg,
  cardPaddingSmall: SPACING.md,

  // Header heights
  headerHeight: 60,
  headerHeightLarge: 80,

  // Tab bar height
  tabBarHeight: 60,

  // Touch target minimum size
  minTouchTarget: 44,

  // Content width
  maxContentWidth: 1200
};

export const ANIMATIONS = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  }
};

// Common component styles
export const COMMON_STYLES = {
  // Card style
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md
  },

  // Card with primary header
  cardWithHeader: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md
  },

  // Button primary
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm
  },

  // Button text
  buttonText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold
  },

  // Badge
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Badge text
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white
  },

  // Section title
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },

  // Row with space between
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  // Center content
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: SPACING.md
  }
};

// Helper function to create activity badge style
export const getActivityBadgeStyle = (activity) => ({
  ...COMMON_STYLES.badge,
  backgroundColor: COLORS.activity[activity?.toLowerCase()] || COLORS.activity.unknown
});

// Helper function to create battery bar style
export const getBatteryBarStyle = (level) => {
  let color = COLORS.battery.high;

  if (level < 40) {
    color = COLORS.battery.low;
  } else if (level < 70) {
    color = COLORS.battery.medium;
  }

  return {
    height: '100%',
    width: `${level}%`,
    backgroundColor: color,
    borderRadius: BORDER_RADIUS.md
  };
};

// Export default theme object
const theme = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  layout: LAYOUT,
  animations: ANIMATIONS,
  commonStyles: COMMON_STYLES
};

export default theme;
