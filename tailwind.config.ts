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
        bg: "#F7F9FB",
        surface: "#F2F4F6",
        "surface-raised": "#FFFFFF",
        "surface-hover": "#E6E8EA",

        /* ── Text ── */
        ink: "#191C1E",
        "ink-muted": "#464554",
        "ink-faint": "#777586",
        "ink-inverse": "#EFF1F3",

        /* ── Borders ── */
        line: "#E2E8F0",
        "line-strong": "#C7CBD4",

        /* ── Primary: deep indigo ── */
        primary: "#4338CA",
        "primary-hover": "#3730A3",
        "primary-soft": "#EEF2FF",
        "primary-muted": "#C7D2FE",

        /* ── Secondary: precise teal ── */
        secondary: "#0D9488",
        "secondary-hover": "#0F766E",
        "secondary-soft": "#CCFBF1",
        "secondary-muted": "#99F6E4",

        /* ── Accent: measured blue ── */
        accent: "#2563EB",
        "accent-soft": "#DBEAFE",

        /* ── Semantic ── */
        success: "#15803D",
        "success-soft": "#DCFCE7",
        warning: "#A16207",
        "warning-soft": "#FEF9C3",
        danger: "#BA1A1A",
        "danger-soft": "#FEE2E2",
        info: "#2563EB",
        "info-soft": "#DBEAFE",
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
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
        sm: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        md: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        lg: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
        glow: "0 0 30px rgba(67, 56, 202, 0.12)",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        "gradient-warm": "linear-gradient(135deg, #EEF2FF 0%, #F7F9FB 44%, #ECFDF5 100%)",
        "gradient-hero": "linear-gradient(145deg, #1E1B4B 0%, #312E81 54%, #0F766E 100%)",
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
