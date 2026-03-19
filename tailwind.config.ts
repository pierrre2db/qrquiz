import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A5F",
        secondary: "#2E75B6",
        success: "#639922",
        "success-bg": "#EAF3DE",
        "success-border": "#C0DD97",
        warning: "#BA7517",
        "warning-bg": "#FAEEDA",
        "warning-border": "#FAC775",
        danger: "#E24B4A",
        "danger-bg": "#FFEBEE",
      },
    },
  },
  plugins: [],
};
export default config;
