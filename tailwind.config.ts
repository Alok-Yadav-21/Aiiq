import type { Config } from 'tailwindcss'

/* ═══════════════════════════════════════════════════════════════════════════
   AIIQ — single-accent design tokens.

   The brand runs on ONE accent: a champagne / rose-gold ramp against warm grey
   and ink black. Tailwind's purple/indigo/violet/cyan scales are overridden by
   the same ramp so that any legacy `purple-50`, `to-indigo-600`, `text-cyan-700`
   in the codebase resolves to champagne instead of an off-brand hue.
   ═══════════════════════════════════════════════════════════════════════════ */

const champagne = {
  50: '#faf6ef',
  100: '#f3eadb',
  200: '#e7d3b4',
  300: '#d8b98a',
  400: '#c79e63',
  500: '#b5835a',
  600: '#a9774b',
  700: '#8a5e38',
  800: '#6f4a2d',
  900: '#5b3d26',
}

/* Warm neutral ramp. Overrides Tailwind's cool slate/gray so greys sit on the
   same warm axis as the canvas instead of drifting blue. */
const warm = {
  50: '#f7f6f4',
  100: '#efeeea',
  200: '#e4e2dc',
  300: '#cfccc4',
  400: '#a8a49a',
  500: '#8b8b87',
  600: '#6b6862',
  700: '#4d4a45',
  800: '#2e2c29',
  900: '#111111',
}

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Canonical brand tokens ────────────────────────────────────── */
        canvas: '#e4e3e0',
        sheet: '#ffffff',
        ink: {
          DEFAULT: '#111111',
          secondary: '#444444',
          muted: '#8b8b87',
          faint: '#b3b3af',
        },
        gold: {
          ...champagne,
          DEFAULT: '#a9774b',
          light: '#cda06f',
          deep: '#9c6d44',
        },
        line: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          soft: 'rgba(0,0,0,0.06)',
          warm: '#e6e0d4',
          card: '#ece8e0',
        },

        /* ── Semantic states — muted so they sit beside champagne ──────── */
        success: { DEFAULT: '#0f9b6c', tint: '#e9f7f1' },
        warning: { DEFAULT: '#b4802a', tint: '#fbf3e4' },
        danger: { DEFAULT: '#c8443c', tint: '#fbeceb' },

        /* ── Legacy aliases ────────────────────────────────────────────────
           Kept so the existing `allq-*` classes keep rendering while pages are
           migrated batch by batch. `purple`/`cyan`/`pink` all resolve to the
           single champagne accent — the brand has one accent, not four. */
        allq: {
          purple: champagne[600],
          'purple-dim': champagne[700],
          cyan: '#cda06f',
          'cyan-dim': champagne[600],
          pink: champagne[500],
          green: '#0f9b6c',
          amber: '#b4802a',
          red: '#c8443c',
        },

        /* Collapse off-brand hues onto the champagne ramp site-wide. */
        purple: champagne,
        violet: champagne,
        indigo: champagne,
        cyan: champagne,

        /* Warm the neutrals so `slate-*` stops reading blue. */
        slate: warm,
        gray: warm,
      },

      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg,#efd9b8 0%,#cda06f 46%,#9c6d44 100%)',
        'sheet-gradient': 'linear-gradient(180deg,#ffffff 0%,#f1f0ee 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },

      boxShadow: {
        sheet: '0 40px 90px -30px rgba(0,0,0,0.18)',
        card: '0 2px 16px rgba(45,35,20,0.06)',
        'card-hover': '0 12px 32px rgba(45,35,20,0.10)',
        pop: '0 24px 80px rgba(45,35,20,0.18)',
        /* Legacy names — retuned from neon glows to soft champagne lifts. */
        'neon-purple': '0 8px 24px -8px rgba(169,119,75,0.35)',
        'neon-cyan': '0 8px 24px -8px rgba(205,160,111,0.35)',
        'neon-sm': '0 4px 14px -4px rgba(169,119,75,0.28)',
      },

      borderRadius: {
        sheet: '30px',
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },

      letterSpacing: {
        eyebrow: '0.2em',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        timer: 'timer linear forwards',
        shimmer: 'shimmer 1.5s infinite',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        timer: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
