/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10026B",
          light: "#1a0494",
          dark: "#0a0147",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#C2B30C",
          light: "#d4c40e",
          dark: "#9e920a",
          foreground: "#10026B",
        },
        page: "#F4F3FF",
        card: {
          DEFAULT: "#FFFFFF",
          hover: "#FAFAFE",
        },
        brand: "#E8E6FF",
        heading: "#10026B",
        subtext: "#6B63A3",
        "muted-label": "#9B94C7",
        sidebar: {
          DEFAULT: "#10026B",
          text: "#C5BFEF",
          active: "#1a0494",
          accent: "#C2B30C",
        },
        success: "#16A34A",
        warning: "#D97706",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(16 2 107 / 0.06), 0 1px 2px -1px rgb(16 2 107 / 0.06)",
        "card-hover": "0 10px 25px -5px rgb(16 2 107 / 0.12), 0 8px 10px -6px rgb(16 2 107 / 0.08)",
      },
      height: {
        15: "3.75rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
