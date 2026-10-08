export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6D28D9',
        accent: '#6D28D9',
        secondary: {
          DEFAULT: '#F472B6',
          peach: '#FDBA9A',
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
        'register-gradient': 'linear-gradient(110deg, #F472B6 0%, #FDBA9A 100%)',
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