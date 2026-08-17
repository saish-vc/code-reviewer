/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#F30000',
          darkRed: '#D00000',
          cream: '#F4EBDD',
          creamLight: '#FAF5ED',
          dark: '#0B0C0E',
          surface: '#14161B',
          surface2: '#1C1F26',
          border: '#2A2E38',
          borderRed: 'rgba(243, 0, 0, 0.3)',
          gray: '#9A9A9A',
          muted: '#6E7280',
        }
      },
      fontFamily: {
        serif: ['"Spectral"', 'Georgia', 'serif'],
        display: ['"Spectral"', 'Georgia', 'serif'],
        sans: ['"Switzer"', '"Inter"', 'sans-serif'],
        body: ['"Switzer"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widestEditorial: '0.2em',
      }
    },
  },
  plugins: [],
}
