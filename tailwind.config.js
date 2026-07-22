/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#a855f7',
          dark: '#7c3aed',
        },
        surface: {
          DEFAULT: '#23173a',
          dark: '#0f0a1a',
          light: '#1a102d',
        },
        highlight: '#fde047',
      },
    },
  },
  plugins: [],
}