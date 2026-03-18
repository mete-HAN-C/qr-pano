/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base palette
        bg: {
          primary:   "#0a0a0a",
          secondary: "#111111",
          card:      "#161616",
          elevated:  "#1c1c1c",
        },
        // Neon accent — electric blue
        neon: {
          blue:  "#00d2ff",
          green: "#00ff9d",
        },
        // Neutral grays
        border: {
          subtle: "rgba(255,255,255,0.06)",
          muted:  "rgba(255,255,255,0.10)",
          glow:   "rgba(0,210,255,0.25)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glass":      "0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        "neon-blue":  "0 0 16px rgba(0,210,255,0.35), 0 0 40px rgba(0,210,255,0.12)",
        "neon-green": "0 0 16px rgba(0,255,157,0.35), 0 0 40px rgba(0,255,157,0.12)",
        "input":      "0 0 0 2px rgba(0,210,255,0.25)",
      },
      backgroundImage: {
        "gradient-neon":
          "linear-gradient(135deg, #00d2ff 0%, #00ff9d 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease forwards",
        "slide-up":   "slideUp 0.35s ease forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%":   { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0,210,255,0.3)" },
          "50%":      { boxShadow: "0 0 24px rgba(0,210,255,0.7)" },
        },
      },
    },
  },
  plugins: [],
};
