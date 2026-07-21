import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        mist: 'var(--mist)',
        fog: 'var(--fog)',
        forest: 'var(--forest)',
        canopy: 'var(--canopy)',
        sun: 'var(--sun)',
        trail: 'var(--trail)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pan': {
          '0%': { transform: 'scale(1.08) translate(0, 0)' },
          '100%': { transform: 'scale(1.08) translate(-1.5%, -1%)' },
        },
        'mark-draw': {
          '0%': { strokeDashoffset: '120' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
        'fade-up-delay': 'fade-up 0.7s ease-out 0.15s both',
        'fade-up-late': 'fade-up 0.7s ease-out 0.3s both',
        'soft-pan': 'soft-pan 18s ease-in-out alternate infinite',
      },
    },
  },
  plugins: [],
};

export default config;
