/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#070709',
          850: '#0c0c0f',
          800: '#121216',
          700: '#1b1b22',
          600: '#262630',
        },
        brand: {
          green: '#22c55e',
          cyan: '#06b6d4',
          purple: '#a855f7',
          pink: '#ec4899',
          yellow: '#eab308',
        }
      },
      fontFamily: {
        sans: ['Urbanist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
