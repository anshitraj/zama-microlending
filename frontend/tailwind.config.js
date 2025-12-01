/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffef7',
          100: '#fffceb',
          200: '#fff7cc',
          300: '#ffefa3',
          400: '#ffe170',
          500: '#f6c65b', // Zama gold
          600: '#e7b44a',
          700: '#cc9900',
          800: '#b38600',
          900: '#997300',
        },
        'zama-gold': '#f6c65b',
        'zama-gold-dark': '#e7b44a',
      },
      backgroundColor: {
        'card': 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
      },
      borderColor: {
        'zama-gold': 'var(--border-gold)',
      },
      textColor: {
        'zama-gold': 'var(--text-gold)',
        'light': 'var(--text-light)',
        'muted': 'var(--text-muted)',
      },
      boxShadow: {
        'zama-glow': '0 0 15px var(--accent-gold-glow)',
        'zama-glow-strong': '0 0 25px var(--accent-gold-glow)',
        'zama-button': '0 0 10px var(--accent-gold-glow)',
      },
    },
  },
  plugins: [],
}

