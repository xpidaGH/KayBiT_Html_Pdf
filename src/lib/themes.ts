export type UiThemeId =
  | 'editorial-refined'
  | 'technical-systematic'
  | 'warm-approachable'
  | 'elegant-dark'
  | 'vibrant-palette';

export interface UiThemeDefinition {
  id: UiThemeId;
  name: string;
  tagline: string;
  description: string;
  fontLabel: string;
  isDark: boolean;
  swatches: {
    canvas: string;
    surface: string;
    accent: string;
    text: string;
  };
  cssVars: Record<string, string>;
}

export const UI_THEME_STORAGE_KEY = 'kaybit_ui_theme';

export const UI_THEMES: UiThemeDefinition[] = [
  {
    id: 'editorial-refined',
    name: 'Editorial & Refined',
    tagline: 'Serif typography · Generous whitespace · Clean light paper',
    description: 'High-contrast literary serif headings paired with warm alabaster surfaces and bronze-amber accents.',
    fontLabel: 'Playfair Display & Source Serif 4',
    isDark: false,
    swatches: {
      canvas: '#faf9f6',
      surface: '#ffffff',
      accent: '#b45309',
      text: '#1c1917',
    },
    cssVars: {
      '--bg-canvas': '#faf9f6',
      '--bg-surface': '#ffffff',
      '--bg-surface-elevated': '#f5f4f0',
      '--bg-input': '#f5f4f0',
      '--text-primary': '#1c1917',
      '--text-secondary': '#44403c',
      '--text-muted': '#78716c',
      '--border-subtle': '#e7e5e4',
      '--border-strong': '#d6d3d1',
      '--accent-primary': '#b45309',
      '--accent-hover': '#92400e',
      '--accent-text': '#ffffff',
      '--accent-soft': 'rgba(180, 83, 9, 0.10)',
      '--font-display': "'Playfair Display', Georgia, serif",
      '--font-body': "'Source Serif 4', Georgia, serif",
      '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
      '--radius-card': '0.5rem',
      '--radius-button': '0.375rem',
    },
  },
  {
    id: 'technical-systematic',
    name: 'Technical & Systematic',
    tagline: 'Monospace fonts · High-density · Visible grid borders',
    description: 'Precision engineering workstation with crisp 1px structural grid lines, tabular numerals, and cyan-blue accents.',
    fontLabel: 'JetBrains Mono',
    isDark: false,
    swatches: {
      canvas: '#f1f5f9',
      surface: '#ffffff',
      accent: '#0284c7',
      text: '#0f172a',
    },
    cssVars: {
      '--bg-canvas': '#f1f5f9',
      '--bg-surface': '#ffffff',
      '--bg-surface-elevated': '#f8fafc',
      '--bg-input': '#f8fafc',
      '--text-primary': '#0f172a',
      '--text-secondary': '#334155',
      '--text-muted': '#64748b',
      '--border-subtle': '#cbd5e1',
      '--border-strong': '#94a3b8',
      '--accent-primary': '#0284c7',
      '--accent-hover': '#0369a1',
      '--accent-text': '#ffffff',
      '--accent-soft': 'rgba(2, 132, 199, 0.10)',
      '--font-display': "'JetBrains Mono', ui-monospace, monospace",
      '--font-body': "'JetBrains Mono', ui-monospace, monospace",
      '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
      '--radius-card': '0.125rem',
      '--radius-button': '0.125rem',
    },
  },
  {
    id: 'warm-approachable',
    name: 'Warm & Approachable',
    tagline: 'Pastel cards · Rounded pill buttons · Soft corners',
    description: 'Friendly studio palette with warm peach-tinted cards, soft 16px corners, and pill-shaped action controls.',
    fontLabel: 'Plus Jakarta Sans & DM Sans',
    isDark: false,
    swatches: {
      canvas: '#fdf8f6',
      surface: '#fff7ed',
      accent: '#ea580c',
      text: '#292524',
    },
    cssVars: {
      '--bg-canvas': '#fdf8f6',
      '--bg-surface': '#fff7ed',
      '--bg-surface-elevated': '#ffffff',
      '--bg-input': '#ffffff',
      '--text-primary': '#292524',
      '--text-secondary': '#57534e',
      '--text-muted': '#78716c',
      '--border-subtle': '#fed7aa',
      '--border-strong': '#fdba74',
      '--accent-primary': '#ea580c',
      '--accent-hover': '#c2410c',
      '--accent-text': '#ffffff',
      '--accent-soft': 'rgba(234, 88, 12, 0.12)',
      '--font-display': "'Plus Jakarta Sans', system-ui, sans-serif",
      '--font-body': "'DM Sans', system-ui, sans-serif",
      '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
      '--radius-card': '1rem',
      '--radius-button': '9999px',
    },
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    tagline: 'Sleek dark mode · Tailored high-contrast accents',
    description: 'Deep obsidian slate surfaces with crisp optical contrast and refined indigo-violet focus highlights.',
    fontLabel: 'Plus Jakarta Sans & JetBrains Mono',
    isDark: true,
    swatches: {
      canvas: '#020617',
      surface: '#0f172a',
      accent: '#6366f1',
      text: '#f8fafc',
    },
    cssVars: {
      '--bg-canvas': '#020617',
      '--bg-surface': '#0f172a',
      '--bg-surface-elevated': '#1e293b',
      '--bg-input': '#020617',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#cbd5e1',
      '--text-muted': '#94a3b8',
      '--border-subtle': '#1e293b',
      '--border-strong': '#334155',
      '--accent-primary': '#6366f1',
      '--accent-hover': '#4f46e5',
      '--accent-text': '#ffffff',
      '--accent-soft': 'rgba(99, 102, 241, 0.18)',
      '--font-display': "'Plus Jakarta Sans', system-ui, sans-serif",
      '--font-body': "'Plus Jakarta Sans', system-ui, sans-serif",
      '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
      '--radius-card': '0.75rem',
      '--radius-button': '0.5rem',
    },
  },
  {
    id: 'vibrant-palette',
    name: 'Vibrant Palette',
    tagline: 'High-energy · Bold electric color schemes',
    description: 'Midnight cobalt canvas energized with electric magenta-pink primary actions and vivid cyan highlights.',
    fontLabel: 'Outfit & Plus Jakarta Sans',
    isDark: true,
    swatches: {
      canvas: '#090d16',
      surface: '#111827',
      accent: '#ec4899',
      text: '#ffffff',
    },
    cssVars: {
      '--bg-canvas': '#090d16',
      '--bg-surface': '#111827',
      '--bg-surface-elevated': '#1e1b4b',
      '--bg-input': '#0f172a',
      '--text-primary': '#ffffff',
      '--text-secondary': '#e2e8f0',
      '--text-muted': '#94a3b8',
      '--border-subtle': '#312e81',
      '--border-strong': '#4338ca',
      '--accent-primary': '#ec4899',
      '--accent-hover': '#db2777',
      '--accent-text': '#ffffff',
      '--accent-soft': 'rgba(236, 72, 153, 0.20)',
      '--font-display': "'Outfit', system-ui, sans-serif",
      '--font-body': "'Plus Jakarta Sans', system-ui, sans-serif",
      '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
      '--radius-card': '0.875rem',
      '--radius-button': '0.625rem',
    },
  },
];

export function getSavedUiTheme(): UiThemeId {
  try {
    const saved = localStorage.getItem(UI_THEME_STORAGE_KEY) as UiThemeId | null;
    if (saved && UI_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'elegant-dark';
}

export function applyUiTheme(themeId: UiThemeId): void {
  const theme = UI_THEMES.find((t) => t.id === themeId) || UI_THEMES[3];
  const root = document.documentElement;

  root.setAttribute('data-ui-theme', theme.id);
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  Object.entries(theme.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  try {
    localStorage.setItem(UI_THEME_STORAGE_KEY, theme.id);
  } catch {
    // Ignore storage errors
  }
}
