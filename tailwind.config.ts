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
          50: "#F4F7F5",
          100: "#DDF1E4",
          200: "#B8E3C9",
          300: "#82CFA4",
          400: "#52B788",
          500: "#1F7A4F",
          600: "#125B3A",
          700: "#0E4A2F",
          800: "#0B3A25",
          900: "#08291A",
          950: "#0D1913",
        },
        accent: {
          50: "#FAF6EB",
          100: "#F6EDCA",
          200: "#E9E9FD",
          300: "#DCEBF7",
          400: "#F4E0E6",
          500: "#8D90F2",
          600: "#D9386A",
          700: "#9B1C44",
          800: "#5B5ED6",
          900: "#111815",
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
