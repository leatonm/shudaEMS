/** EMT Response Simulator — dispatch-bay visual language. */
export const theme = {
  colors: {
    background: '#061018',
    backgroundAlt: '#0A1A24',
    surface: '#102832',
    surfaceLight: '#183844',
    /** Signal teal — primary brand */
    emsBlue: '#1ECAD4',
    primary: '#1ECAD4',
    primaryDark: '#1498A0',
    /** CAD amber — urgency / highlights */
    accent: '#F0B429',
    accentLight: '#7EE8F0',
    success: '#3DDC97',
    warning: '#F5A623',
    error: '#FF5A5F',
    critical: '#FF3B4A',
    text: '#E8F4F7',
    textMuted: '#8AA8B4',
    border: '#254555',
    cadGlow: 'rgba(30, 202, 212, 0.28)',
    amberGlow: 'rgba(240, 180, 41, 0.18)',
    dangerGlow: 'rgba(255, 90, 95, 0.16)',
    successGlow: 'rgba(61, 220, 151, 0.14)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
  },
};

export const priorityColors: Record<number, string> = {
  1: '#FF5A5F',
  2: '#F5A623',
  3: '#1ECAD4',
};
