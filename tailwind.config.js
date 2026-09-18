/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cinzel", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#07080f",
        panel: "#12131f",
        gold: "#f5c542",
        neon: "#7cf0ff",
        ember: "#ff6b4a",
        void: "#8b5cff",
      },
    },
  },
  plugins: [],
};
