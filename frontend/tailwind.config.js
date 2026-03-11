/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          light: '#FDFCF8',
          dark: '#1A1A1A',
        },
        primary: {
          DEFAULT: '#1A4D2E',
          light: '#2A6B42',
          dark: '#0F3A1F',
        },
        secondary: {
          DEFAULT: '#C2410C',
          light: '#EA580C',
          dark: '#9A3412',
        },
        surface: '#FFFFFF',
        border: '#E5E7EB',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
