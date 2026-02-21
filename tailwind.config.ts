import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050814",
        panel: "rgba(11, 18, 45, 0.56)",
        neonBlue: "#2ac7ff",
        neonPurple: "#8a7dff",
        neonCyan: "#59f6ff"
      },
      boxShadow: {
        neon: "0 0 30px rgba(42, 199, 255, 0.24)",
        panel: "inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.45)"
      },
      backgroundImage: {
        "grid-glow": "radial-gradient(circle at 20% 20%, rgba(42,199,255,0.18), transparent 35%), radial-gradient(circle at 80% 10%, rgba(138,125,255,0.15), transparent 30%), linear-gradient(120deg, #04060f, #090f22 50%, #050814)",
        "panel-stroke": "linear-gradient(120deg, rgba(89,246,255,0.26), rgba(138,125,255,0.22))"
      },
      animation: {
        pulseSlow: "pulse 4s ease-in-out infinite",
        floatY: "floatY 6s ease-in-out infinite",
        boot: "boot 2.4s steps(24) forwards"
      },
      keyframes: {
        floatY: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        boot: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
