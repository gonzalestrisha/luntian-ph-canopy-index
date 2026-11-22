/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        emerald: {
          500: '#10B981',
          600: '#059669',
        },
        ochre: {
          500: '#D97706',
          600: '#B45309',
        }
      }
    },
  },
  plugins: [],
}
