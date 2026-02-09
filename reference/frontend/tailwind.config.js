// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
      'ripple': 'ripple 3s linear infinite',
      'float-slow': 'float 6s ease-in-out infinite',
    },
    keyframes: {
      ripple: {
        '0%': { transform: 'scale(0.8)', opacity: '1' },
        '100%': { transform: 'scale(2.5)', opacity: '0' },
      },
      float: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-20px)' },
      }
    }
    },
  },
  plugins: [],
}