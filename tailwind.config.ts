import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f0c10",
        paper: "#faf8f5",
        surface: "#ffffff",
        "surface-2": "#f9f7f4",
        muted: "#6b6575",
        secondary: "#4a4550",
        rule: "#e2ddd9",
        accent: {
          DEFAULT: "#7c3aed",
          soft: "#f3f0ff",
          ink: "#5b21b6",
        },
        pink: {
          DEFAULT: "#db2777",
          soft: "#fdf2f8",
          ink: "#9d174d",
        },
        cyan: {
          DEFAULT: "#0891b2",
          soft: "#ecfeff",
          ink: "#155e75",
        },
        success: { DEFAULT: "#059669", soft: "#ecfdf5", ink: "#065f46" },
        warn: { DEFAULT: "#d97706", soft: "#fffbeb", ink: "#92400e" },
        danger: { DEFAULT: "#dc2626", soft: "#fef2f2", ink: "#991b1b" },
        // Brand UI category colors (from scheduling mockup)
        brand: {
          lea: "#3C3489",
          "lea-soft": "#EEEDFE",
          my: "#085041",
          "my-soft": "#E1F5EE",
          team: "#0C447C",
          "team-soft": "#E6F1FB",
          learn: "#633806",
          "learn-soft": "#FAEEDA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 2px 24px rgba(15,12,16,.07)",
        "card-lg": "0 8px 40px rgba(15,12,16,.10)",
        glow: "0 0 0 1px rgba(124,58,237,.2), 0 8px 30px rgba(124,58,237,.18)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      keyframes: {
        pulseDot: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".3" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        grow: {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        pulseDot: "pulseDot 2s infinite",
        "fade-up": "fade-up .4s ease both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
