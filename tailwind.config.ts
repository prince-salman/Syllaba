import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/client/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFFDF5",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FACC15",
          500: "#EAB308",
          600: "#111111",
          700: "#1F1F1F",
          800: "#171717",
          900: "#0A0A0A",
          950: "#050505",
        },
        accent: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#F5F5F5",
          400: "#FFE4E6",
          500: "#EAB308",
          600: "#D97706",
          700: "#92400E",
          800: "#111111",
          900: "#0A0A0A",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
