/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10026B",
          light: "#1a0494",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#C2B30C",
          light: "#d4c40e",
          foreground: "#10026B",
        },
        page: "#F4F3FF",
        card: {
          DEFAULT: "#FFFFFF",
        },
        brand: "#E8E6FF",
        heading: "#10026B",
        subtext: "#6B63A3",
        "muted-label": "#9B94C7",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(16 2 107 / 0.06), 0 1px 2px -1px rgb(16 2 107 / 0.06)",
      },
    },
  },
  plugins: [],
};
