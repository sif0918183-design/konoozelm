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
          50: '#f0f9f0',
          100: '#dcf0dc',
          200: '#bbe0bb',
          300: '#8eca8e',
          400: '#5eb35e',
          500: '#3d983d',
          600: '#2f7a2f',
          700: '#266026',
          800: '#214b21',
          900: '#1c3d1c',
          950: '#0d220d',
        },
        gold: {
          50: '#fdf9e7',
          100: '#faf0c3',
          200: '#f5e28a',
          300: '#f0d051',
          400: '#ebbe1a',
          500: '#d4a610',
          600: '#a8830d',
          700: '#7c620a',
          800: '#504608',
          900: '#242305',
          950: '#121202',
        },
      },
      fontFamily: {
        arabic: ['Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};