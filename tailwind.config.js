export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        crown: {
          navy: '#173B68',
          blue: '#2563EB',
          teal: '#0F9D91',
          bg: '#F5F7FB',
          card: '#FFFFFF',
          text: '#172B4D',
          muted: '#64748B',
          border: '#E2E8F0',
          input: '#F8FAFC',
          error: '#DC2626',
          warning: '#D97706'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(23, 43, 77, 0.06), 0 1px 2px -1px rgba(23, 43, 77, 0.04)',
        elevated: '0 4px 12px -2px rgba(23, 43, 77, 0.08), 0 2px 4px -2px rgba(23, 43, 77, 0.04)'
      }
    }
  },
  plugins: []
};
