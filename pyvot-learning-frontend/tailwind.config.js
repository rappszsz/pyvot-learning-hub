export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#EC4899',
        accent: '#D946EF',
        secondary: {
          DEFAULT: '#EC4899',
          peach: '#F9A8D4',
        },
        background: '#FDF8F5',
        text: '#374151',
        subtle: {
          DEFAULT: '#E5E7EB',
          card: '#F9F7F6',
          border: '#E5E7EB',
        },
      },
      backgroundImage: {
        'register-gradient': 'linear-gradient(110deg, #EC4899 0%, #D946EF 100%)',
      },
      borderRadius: {
        DEFAULT: '1rem',
        pill: '9999px',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
}