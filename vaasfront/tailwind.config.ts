import type { Config } from "tailwindcss";

const config: Config = {
  content: [
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./app/**/*.{js,ts,jsx,tsx,mdx}", // This line is crucial
  ],
  theme: {
    extend: {
      // Your existing animations and fonts should be here
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      }
    },
  },
  plugins: [],
};
export default config;