/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Acentos Pastel y Minimalistas
        pastel: {
          coral: {
            light: '#FFF1F2',
            border: '#FECDD3',
            DEFAULT: '#F43F5E',
            dark: '#BE123C',
          },
          mint: {
            light: '#ECFDF5',
            border: '#A7F3D0',
            DEFAULT: '#10B981',
            dark: '#047857',
          },
          sky: {
            light: '#F0F9FF',
            border: '#BAE6FD',
            DEFAULT: '#0EA5E9',
            dark: '#0369A1',
          },
          amber: {
            light: '#FFFBEB',
            border: '#FDE68A',
            DEFAULT: '#F59E0B',
            dark: '#B45309',
          },
          lavender: {
            light: '#F5F3FF',
            border: '#DDD6FE',
            DEFAULT: '#8B5CF6',
            dark: '#6D28D9',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
