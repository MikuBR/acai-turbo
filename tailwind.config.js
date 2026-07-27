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
          DEFAULT: 'var(--accent-primary)',
          dark: 'var(--accent-secondary)',
        },
        surface: {
          DEFAULT: 'var(--bg-primary)',
          light: 'var(--bg-secondary)',
        },
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        border: {
          DEFAULT: 'var(--border)',
          light: 'var(--border-light)',
        },
        highlight: {
          DEFAULT: 'var(--highlight)',
          bg: 'var(--highlight-bg)',
        },
        muted: 'var(--text-muted)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
        light: 'var(--border-light)',
      },
      backgroundColor: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        surface: 'var(--bg-primary)',
        'surface-light': 'var(--bg-secondary)',
      },
    },
  },
  plugins: [],
}