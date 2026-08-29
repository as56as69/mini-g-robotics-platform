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
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        kid: {
          yellow: '#FBBF24',
          orange: '#F97316',
          green: '#10B981',
          cyan: '#06B6D4',
          pink: '#EC4899',
          primary: '#6C5CE7',
          accent: '#00CEC9',
          glow: '#FF7675',
        },
        school: {
          primary: '#2563EB',
          primaryDeep: '#1E3A8A',
          live: '#10B981',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
