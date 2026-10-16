/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  // Le mode sombre suit le système, sauf si l'utilisateur force un thème (data-theme sur <html>).
  darkMode: [
    'variant',
    [
      "@media (prefers-color-scheme: dark) { &:is(:root:not([data-theme='light']) *) }",
      "&:is(:root[data-theme='dark'] *)",
    ],
  ],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        soft: token('soft'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        primary: token('primary'),
        'primary-ink': token('primary-ink'),
        sage: token('sage'),
        peach: token('peach'),
        sky: token('sky'),
        sun: token('sun'),
        chart: token('chart'),
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        soft: '0 8px 30px -12px rgb(var(--shadow) / 0.25)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        breathe: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06)' } },
      },
      animation: {
        rise: 'rise .45s ease-out both',
        breathe: 'breathe 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
