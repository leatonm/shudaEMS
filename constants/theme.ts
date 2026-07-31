/** EMT Response Simulator — high-energy dispatch-bay visual language. */
export const theme = {
  colors: {
    background: '#050A12',
    backgroundAlt: '#0A1622',
    surface: '#0E1E2C',
    surfaceLight: '#16303F',
    /** Electric cyan — primary brand */
    emsBlue: '#00E5FF',
    primary: '#00E5FF',
    primaryDark: '#00A9BF',
    /** CAD amber — urgency / highlights */
    accent: '#FFC531',
    accentLight: '#8BF3FF',
    violet: '#B36BFF',
    success: '#22F5A8',
    warning: '#FFB020',
    error: '#FF4D6D',
    critical: '#FF2D55',
    text: '#EAF6FB',
    textMuted: '#8FB0C0',
    border: '#1F4155',
    cadGlow: 'rgba(0, 229, 255, 0.28)',
    cadGlowStrong: 'rgba(0, 229, 255, 0.5)',
    amberGlow: 'rgba(255, 197, 49, 0.24)',
    violetGlow: 'rgba(179, 107, 255, 0.24)',
    dangerGlow: 'rgba(255, 77, 109, 0.22)',
    successGlow: 'rgba(34, 245, 168, 0.2)',
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
  1: '#FF2D55',
  2: '#FFC531',
  3: '#00E5FF',
};

/** Per-category accent so each lane feels distinct. */
export const categoryColors: Record<string, string> = {
  medical: '#00E5FF',
  trauma: '#FF4D6D',
  peds: '#B36BFF',
  ob: '#FF7AC6',
  mci: '#FFC531',
};

export function categoryColor(id: string): string {
  return categoryColors[id] ?? theme.colors.emsBlue;
}
