/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f17171',
          500: '#8B2635',
          600: '#7a1f2d',
          700: '#6b1a26',
          800: '#5c1620',
          900: '#4a111a',
        },
        barn: '#8B2635',
        cream: '#FAF7F4',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        jolly: ['Jolly Lodger', 'cursive'],
      },
    },
  },
  plugins: [],
}
