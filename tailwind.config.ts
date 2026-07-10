import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Surfaces ── */
        bg: "#F6F7F5",
        surface: "#F0F2EF",
        "surface-raised": "#FFFFFF",
        "surface-hover": "#E8ECE8",

        /* ── Text ── */
        ink: "#171A1F",
        "ink-muted": "#59616D",
        "ink-faint": "#818995",
        "ink-inverse": "#F6F7F5",

        /* ── Borders ── */
        line: "#DDE2E6",
        "line-strong": "#C7CED4",

        /* ── Primary: deep indigo ── */
        primary: "#3157D5",
        "primary-hover": "#2848B5",
        "primary-soft": "#EDF1FF",
        "primary-muted": "#C7D2FA",

        /* ── Secondary: precise teal ── */
        secondary: "#24835B",
        "secondary-hover": "#1E6D4C",
        "secondary-soft": "#E5F3EC",
        "secondary-muted": "#B7DCC9",

        /* ── Accent: measured blue ── */
        accent: "#657080",
        "accent-soft": "#EBEEF1",

        /* ── Semantic ── */
        success: "#24835B",
        "success-soft": "#E5F3EC",
        warning: "#C88624",
        "warning-soft": "#FFF3DB",
        danger: "#C74D4D",
        "danger-soft": "#FCEAEA",
        info: "#3157D5",
        "info-soft": "#EDF1FF",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        /* Display — use with font-display */
        "display-xl": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "display-md": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],

        /* Headings — sans-serif, bold */
        "heading-lg": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.015em" }],
        "heading-md": ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
        "heading-sm": ["1.125rem", { lineHeight: "1.4" }],

        /* Body */
        "body-lg": ["1.0625rem", { lineHeight: "1.7" }],
        "body-md": ["0.9375rem", { lineHeight: "1.65" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.6" }],

        /* Labels */
        label: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        "label-caps": ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.08em" }],

        /* Mono / data */
        "data-lg": ["2rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "data-md": ["1.25rem", { lineHeight: "1.2" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.625rem",
        "2xl": "0.75rem",
        "3xl": "0.875rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
        sm: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        md: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        lg: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
        glow: "0 0 24px rgba(49, 87, 213, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
