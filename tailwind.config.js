/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Manrope", "Segoe UI", "sans-serif"] },
      colors: {
        ink: "#173a3a",
        teal: { 50: "#effbf9", 100: "#d7f5ef", 500: "#20a88a", 600: "#168773", 700: "#126b5e" },
        lavender: "#8e82d9",
        mist: "#f4f8f8"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 58, 58, 0.08)",
        card: "0 8px 30px rgba(34, 90, 84, 0.08)"
      }
    }
  },
  plugins: []
};
