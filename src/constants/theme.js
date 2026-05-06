export const COLORS = {
  // Islam Learning Platform palette (green/black) from provided UI sheet
  // Background primary: #111111, Surface/Cards: #1E1E1C
  // Teal primary: #1D9E75, Teal deep: #0F6B56, Teal wash: #1F5E5E
  primary: '#1D9E75',
  primaryDark: '#0F6B56',
  primaryLight: '#1F5E5E',

  // Kept for backwards compatibility across UI; mapped to teal palette
  gold: '#1D9E75',
  goldLight: '#1F5E5E',
  goldDark: '#0F6B56',

  // Background layers - Matt black
  background: '#111111',
  backgroundLight: '#1E1E1C',
  backgroundCard: '#1E1E1C',
  backgroundElevated: '#3D3D3B',

  // Surface
  surface: '#1E1E1C',
  surfaceLight: '#3D3D3B',
  surfaceBorder: '#3D3D3B',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
  textGold: '#FBBF24',

  // Accent colors
  // Keep but tone into teal variants so UI stays green/black
  accent1: '#1D9E75',
  accent2: '#1F5E5E',
  accent3: '#0F6B56',
  accent4: '#1D9E75',

  // Status
  success: '#1D9E75',
  error: '#F87171',
  warning: '#1F5E5E',
  info: '#38BDF8',

  // Glow colors
  glowPrimary: 'rgba(29, 158, 117, 0.28)',
  glowGold: 'rgba(31, 94, 94, 0.22)',
  glowPurple: 'rgba(29, 158, 117, 0.18)',
  glowCyan: 'rgba(15, 107, 86, 0.18)',

  // Gradients
  gradientPrimary: ['#1D9E75', '#0F6B56', '#0F6B56'],
  gradientGold: ['#1F5E5E', '#1D9E75', '#0F6B56'],
  gradientDark: ['#111111', '#1E1E1C', '#1E1E1C'],
  gradientCard: ['#1E1E1C', '#3D3D3B'],
  gradientHero: ['transparent', 'rgba(17, 17, 17, 0.6)', '#111111'],
  gradientOverlay: ['transparent', 'rgba(17, 17, 17, 0.8)', '#111111'],

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const SIZES = {
  // Font sizes
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
  hero: 48,

  // Spacing
  spacing_xs: 4,
  spacing_sm: 8,
  spacing_md: 12,
  spacing_base: 16,
  spacing_lg: 20,
  spacing_xl: 24,
  spacing_xxl: 32,
  spacing_xxxl: 48,

  // Border radius
  radius_sm: 8,
  radius_md: 12,
  radius_lg: 16,
  radius_xl: 20,
  radius_xxl: 24,
  radius_full: 999,

  // Component sizes
  buttonHeight: 56,
  inputHeight: 56,
  headerHeight: 60,
  tabBarHeight: 70,
  cardWidth: 150,
  cardHeight: 220,
};

export const SHADOWS = {
  glow: (color = COLORS.glowPrimary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  }),
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
