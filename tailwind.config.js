/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', '"Roboto Mono"', 'monospace'],
      },
      colors: {
        kitchen: {
          bg: '#f8f9fa',
          card: '#ffffff',
          border: '#e2e8f0', // slate-200
          dark: '#1e1e1e', // sidebar bg
          text: {
            primary: '#202124',
            secondary: '#5f6368',
            code: '#d4d4d4', // light gray for dark bg
          },
          accent: {
            yellow: '#fef7e0',
            yellowText: '#b06000',
            green: '#e6f4ea',
            greenText: '#137333',
            red: '#fce8e6',
            redText: '#c5221f',
            blue: '#e8f0fe',
            blueText: '#1967d2',
          }
        }
      },
      boxShadow: {
        'kitchen': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'kitchen-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
      },
      borderRadius: {
        'kitchen': '12px',
      }
    },
  },
  plugins: [],
}