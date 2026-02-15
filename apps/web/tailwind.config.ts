import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: 'rgb(var(--color-brand-900-rgb) / <alpha-value>)',
          800: 'rgb(var(--color-brand-800-rgb) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600-rgb) / <alpha-value>)',
          500: 'rgb(var(--color-brand-500-rgb) / <alpha-value>)',
          400: 'rgb(var(--color-brand-400-rgb) / <alpha-value>)',
          300: 'rgb(var(--color-brand-300-rgb) / <alpha-value>)',
        },
        accent: {
          500: 'rgb(var(--color-accent-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600-rgb) / <alpha-value>)',
        },
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
        text: 'rgb(var(--color-text-rgb) / <alpha-value>)',
        'text-invert': 'rgb(var(--color-text-invert-rgb) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 8px 24px rgb(var(--color-brand-900-rgb) / 0.10)',
        glass: '0 20px 35px rgb(var(--color-brand-900-rgb) / 0.14)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'float-in': 'floatIn 320ms ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
