/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1d',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155'
        },
        teal: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#14b8a6',
          subtle: '#ccfbf1'
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f8fafc',
          panel: '#f1f5f9',
          border: '#e2e8f0'
        },
        status: {
          green: '#10b981',
          greenDark: '#059669',
          amber: '#f59e0b',
          amberDark: '#d97706',
          red: '#ef4444',
          redDark: '#dc2626'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
