/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent: TRG gold. Change these 3 values to re-tint the whole app.
        accent: {
          400: '#D4B877', // lighter gold — text + icons on dark
          500: '#C2A35E', // primary gold — buttons, logo, highlights
          600: '#A8884A', // darker gold — hover/pressed
        },
      },
    },
  },
  plugins: [],
}
