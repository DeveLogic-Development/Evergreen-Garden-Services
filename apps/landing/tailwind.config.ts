import type { Config } from 'tailwindcss';
import themePreset from '@evergreen/theme/tailwind-preset';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [themePreset],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Avenir Next', 'Trebuchet MS', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0px, 0px, 0px)' },
          '50%': { transform: 'translate3d(0px, -10px, 0px)' },
        },
      },
      animation: {
        drift: 'drift 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
