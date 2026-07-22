/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7e22ce',
          dark: '#9333ea',
        },
        surface: {
          DEFAULT: '#faf9fc',
          light: '#f3f0fa',
        },
        highlight: '#ca8a04',
      },
    },
  },
  plugins: [],
}