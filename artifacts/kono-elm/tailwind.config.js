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
          50: '#f0f5f3',
          100: '#dce8e1',
          200: '#bcd1c6',
          300: '#8fad9f',
          400: '#638676',
          500: '#466859',
          600: '#365245',
          700: '#2d4339',
          800: '#26372f',
          900: '#154734', // Deep Islamic Green
          950: '#0c221a',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#b8860b', // Deep Islamic Gold
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
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
      },
    },
  },
  plugins: [],
};