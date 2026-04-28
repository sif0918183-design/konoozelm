/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f7f5',
          100: '#e1e9e3',
          200: '#c5d5cb',
          300: '#9db7aa',
          400: '#6f9281',
          500: '#4e7563',
          600: '#3c5c4e',
          700: '#314a40',
          800: '#283c34',
          900: '#0f2e22', // Deeper, more professional Islamic Green
          950: '#081a13',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309', // More professional Deep Gold
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        cream: {
          50: '#fafaf5',
          100: '#f5f5ed',
          200: '#e6e6d5',
          300: '#d1d1b5',
          400: '#b8b88f',
          500: '#a3a370',
        }
      },
      fontFamily: {
        arabic: ['var(--font-tajawal)', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'sans-serif'],
        amiri: ['var(--font-amiri)', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shine: 'shine 8s linear infinite',
      },
    },
  },
  plugins: [],
};