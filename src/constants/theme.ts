export const colors = {
  // Primary colors
  primary: {
    main: '#4DB6AC',
    dark: '#00897B',
    light: '#80CBC4',
    contrastText: '#fff',
  },
  // Secondary colors
  secondary: {
    main: '#FF6B6B',
    coral: '#FF6B6B',
    orange: '#FF9800',
    contrastText: '#fff',
  },
  // Background colors
  background: {
    default: '#F8F9FA',
    paper: '#ffffff',
    light: '#f5f5f5',
    grey: '#F0F0F0',
    darkGrey: '#E0E0E0',
  },
  // Text colors
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    hint: '#ccc',
    white: '#ffffff',
    black: '#000000',
  },
  // Status colors
  status: {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#FF9800',
    info: '#2196F3',
    urgent: '#FF5722',
  },
  // Insurance type colors
  insurance: {
    life: '#E91E63',
    health: '#4CAF50',
  },
  // Common colors
  common: {
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
};

// ============================================
// TYPOGRAPHY - Font sizes
// ============================================
export const typography = {
  fontSize: {
    xs: 12,
    sm: 13,
    md: 14,
    base: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

// ============================================
// SPACING
// ============================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// ============================================
// SHADOWS (iOS)
// ============================================
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
};

// ============================================
// ICON SIZES
// ============================================
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 64,
};
