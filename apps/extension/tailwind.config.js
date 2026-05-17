/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx,html}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0b0d12',
          elevated: '#11141b',
          muted: '#1a1e27',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.14)',
        },
        text: {
          DEFAULT: '#e7e9ee',
          muted: '#a4a9b5',
          dim: '#6b7180',
        },
        brand: {
          50: '#eef0ff',
          100: '#dde1ff',
          200: '#b8c0ff',
          300: '#8e99ff',
          400: '#6b76fa',
          500: '#4f54ee',
          600: '#3f3dd9',
          700: '#332fb0',
          800: '#2b2a8d',
          900: '#252570',
        },
        accent: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(0,0,0,0.45), 0 2px 8px -2px rgba(0,0,0,0.3)',
        glow: '0 0 0 1px rgba(139,92,246,0.35), 0 8px 30px -8px rgba(79,84,238,0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4f54ee 0%, #8b5cf6 100%)',
        'brand-radial': 'radial-gradient(80% 60% at 50% 0%, rgba(79,84,238,0.25), transparent 70%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 140ms ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
