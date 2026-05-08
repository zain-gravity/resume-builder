import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2E86AB",
          dark: "#1E5F8A",
          light: "#4FA8CC",
        },
        accent: {
          DEFAULT: "#A23B72",
          dark: "#7D2E5A",
          light: "#C45E95",
        },
        gold: {
          DEFAULT: "#F18F01",
          dark: "#C97800",
          light: "#FFB347",
        },
        success: "#28A745",
        warning: "#FFC107",
        danger: "#DC3545",
        glass: "rgba(255,255,255,0.25)",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        opensans: ["var(--font-opensans)", "Open Sans", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #2E86AB 0%, #A23B72 50%, #F18F01 100%)",
        "card-gradient":
          "linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
        "primary-gradient": "linear-gradient(135deg, #2E86AB 0%, #1E5F8A 100%)",
        "accent-gradient": "linear-gradient(135deg, #A23B72 0%, #7D2E5A 100%)",
        "gold-gradient": "linear-gradient(135deg, #F18F01 0%, #C97800 100%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "counter": "counter 2s ease-out forwards",
        "spin-slow": "spin 8s linear infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(31, 38, 135, 0.2)",
        "primary-glow": "0 0 30px rgba(46, 134, 171, 0.4)",
        "accent-glow": "0 0 30px rgba(162, 59, 114, 0.4)",
        "gold-glow": "0 0 30px rgba(241, 143, 1, 0.4)",
        elevated: "0 20px 60px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
