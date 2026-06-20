/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A", // Deep Navy
        secondary: "#3B82F6", // Electric Blue
        accent: "#FBBF24", // Gold
        background: "#F8FAFC",
      },
    },
  },
  plugins: [],
}
