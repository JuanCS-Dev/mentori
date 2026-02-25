/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Space Mono"', "monospace"],
      },
      colors: {
        cyber: {
          bg: "#09090B",
          surface: "#121216",
          border: "#27272A",
          accent: "#00F0FF",
          text: {
            primary: "#FAFAFA",
            secondary: "#A1A1AA",
            muted: "#52525B",
          },
          status: {
            success: "#22C55E",
            error: "#EF4444",
            warning: "#F59E0B",
            info: "#00F0FF",
          },
        },
      },
      boxShadow: {
        cyber:
          "0 0 0 1px rgba(255,255,255,0.05), 0 8px 16px -4px rgba(0,0,0,0.5)",
        "cyber-glow": "0 0 15px rgba(0,240,255,0.15)",
      },
      borderRadius: {
        tactical: "4px",
        "nested-outer": "12px",
        "nested-inner": "8px",
      },
    },
  },
  plugins: [],
};
