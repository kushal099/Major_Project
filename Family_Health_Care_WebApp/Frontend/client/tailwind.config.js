/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#122056',
        accent: '#5B65DC',
        accentLight: '#EEEFFD',
        bgLight: '#FAFAFD',
      },
    },
  },
  plugins: [],
};
