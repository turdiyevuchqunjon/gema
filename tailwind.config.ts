import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "var(--bg)",
        "bg-card": "var(--bg-card)",
        "bg-soft": "var(--bg-soft)",
        ink: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        line: "var(--line)",
      },
    },
  },
  plugins: [],
};

export default config;
