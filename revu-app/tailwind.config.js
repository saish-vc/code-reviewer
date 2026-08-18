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
          // Monochrome palette matching revu-site
          white:      '#FFFFFF',
          offWhite:   '#F4F4F2',
          lightGray:  '#E5E5E5',
          gray:       '#9A9A9A',
          darkGray:   '#444444',
          nearBlack:  '#0B0C0E',
          black:      '#000000',
          // Surfaces
          surface:    '#111111',
          surface2:   '#1A1A1A',
          border:     '#2A2A2A',
          // Orange accent — primary actions / hover only
          accent:     '#FF4500',
          // Semantic aliases kept for legacy compatibility in JSX
          dark:       '#0B0C0E',
          cream:      '#F4F4F2',
          muted:      '#9A9A9A',
        }
      },
      fontFamily: {
        sans:  ['"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body:  ['"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', '"Space Mono"', 'monospace'],
        // Keep display/serif pointing to mono for app — no serif in new system
        serif:   ['"IBM Plex Mono"', 'monospace'],
        display: ['"IBM Plex Mono"', 'monospace'],
      },
      letterSpacing: {
        tightest:        '-0.04em',
        widestEditorial: '0.2em',
      },
      // Keep red aliases as no-ops so remaining JSX class refs don't break
      // (they'll resolve to accent or be invisible). Can remove after cleanup.
    },
  },
  plugins: [],
}
