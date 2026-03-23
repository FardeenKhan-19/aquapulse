import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        surface: 'var(--color-surface)',
        accent: 'var(--color-accent)',
        cyan: 'var(--color-cyan)',
        purple: 'var(--color-purple)',
        teal: 'var(--color-teal)',
        amber: 'var(--color-amber)',
        coral: 'var(--color-coral)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'pulse-cyan': 'pulseCyan 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-up': 'fadeUp 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseCyan: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 212, 255, 0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
