/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        google: {
          blue:         '#1a73e8',
          'blue-dark':  '#1557b0',
          'blue-light': '#e8f0fe',
          'blue-faint': '#f0f4ff',
          gray:         '#5f6368',
          'gray-dark':  '#202124',
          'gray-mid':   '#80868b',
          'gray-light': '#dadce0',
          'gray-bg':    '#f1f3f4',
          'gray-panel': '#f8f9fa',
          green:        '#188038',
          'green-bg':   '#e6f4ea',
          orange:       '#ea8600',
          'orange-bg':  '#fef7e0',
          red:          '#d93025',
          'red-bg':     '#fce8e6',
        },
      },
      fontFamily: {
        google: ['"Google Sans"', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
