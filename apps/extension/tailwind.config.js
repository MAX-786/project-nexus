/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx", "!./node_modules/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#0c0c14",
          card: "#13131f",
          border: "#1e1e2e",
          text: "#e0e0e8",
          muted: "#8888a0",
          primary: "#7c5cfc",
          "primary-hover": "#6b4ce0",
          success: "#34d399",
          error: "#f87171",
        }
      }
    }
  },
  plugins: []
}
