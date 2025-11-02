module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/tab/index.html',
  ],
  darkMode: 'class', // Enable dark mode via class strategy
  theme: {
    extend: {
      colors: {
        // Bitcoin brand colors
        bitcoin: {
          DEFAULT: '#F7931A',
          hover: '#FF9E2D',
          active: '#E88711',
          light: '#FFA43D',
          subtle: 'rgba(247, 147, 26, 0.12)',
          muted: 'rgba(247, 147, 26, 0.24)',
          // Legacy colors for backwards compatibility
          orange: '#F7931A',
          dark: '#4d4d4d',
        },

        // Extended gray scale for dark mode
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D4D4D4',   // text-secondary in dark mode
          400: '#A3A3A3',   // text-tertiary in dark mode
          500: '#737373',   // text-quaternary in dark mode
          600: '#525252',   // border-hover in dark mode
          650: '#323232',   // Custom - surface-active
          700: '#404040',   // border-default in dark mode
          750: '#2E2E2E',   // Custom - surface-hover, border-subtle
          800: '#242424',   // bg-tertiary in dark mode
          850: '#1E1E1E',   // Custom - surface-default (cards)
          900: '#1A1A1A',   // bg-secondary in dark mode
          950: '#0F0F0F',   // bg-primary in dark mode
        },

        // Semantic colors optimized for dark mode
        green: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        red: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        blue: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
        },

        // Primary colors (for backwards compatibility)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },

      // Dark mode shadows
      boxShadow: {
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'md': '0 4px 12px -2px rgba(0, 0, 0, 0.6)',
        'lg': '0 10px 24px -4px rgba(0, 0, 0, 0.7)',
        'xl': '0 20px 40px -8px rgba(0, 0, 0, 0.8)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.85)',

        // Glow effects
        'glow-bitcoin': '0 0 24px rgba(247, 147, 26, 0.35)',
        'glow-bitcoin-strong': '0 0 32px rgba(247, 147, 26, 0.5)',
        'glow-success': '0 0 24px rgba(34, 197, 94, 0.35)',
        'glow-error': '0 0 24px rgba(239, 68, 68, 0.35)',
      },

      // Animation for skeleton loader
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-in-top': {
          '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'slide-in-top': 'slide-in-top 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      backgroundSize: {
        '200': '200% 100%',
      },

      width: {
        'popup': '600px',
      },
      height: {
        'popup': '400px',
      },

      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
