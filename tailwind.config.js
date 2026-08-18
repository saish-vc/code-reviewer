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
          white: '#FFFFFF',
          offWhite: '#F4F4F2',
          lightGray: '#E5E5E5',
          gray: '#9A9A9A',
          darkGray: '#333333',
          nearBlack: '#0B0C0E',
          black: '#000000',
          accent: '#FF4500', // Small orange accent
          surface: '#14161B', // Kept for Download component compatibility temporarily
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Space Mono"', 'monospace'],
        display: ['"IBM Plex Mono"', '"Space Mono"', 'monospace'], // Technical display font
      },
      letterSpacing: {
        tightest: '-0.04em',
        widestEditorial: '0.2em',
      }
    },
  },
  plugins: [],
}
