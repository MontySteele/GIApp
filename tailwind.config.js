/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        pyro: '#ff6b3d',
        hydro: '#4cc2f1',
        anemo: '#74c2a8',
        electro: '#b388ff',
        dendro: '#a5c83b',
        cryo: '#9fccfa',
        geo: '#fab73f',
        rarity: {
          3: '#4a5568',
          4: '#9f7aea',
          5: '#f6ad55',
        }
      },
    },
  },
  plugins: [],
}
