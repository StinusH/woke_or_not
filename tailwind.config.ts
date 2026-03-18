import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        bgSoft: "var(--color-bg-soft)",
        fg: "var(--color-fg)",
        fgMuted: "var(--color-fg-muted)",
        accent: "var(--color-accent)",
        accentHover: "var(--color-accent-hover)",
        accentMuted: "var(--color-accent-muted)",
        card: "var(--color-card)",
        line: "var(--color-line)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"]
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadein: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        rise: "rise 400ms ease-out forwards",
        fadein: "fadein 300ms ease-out forwards"
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
