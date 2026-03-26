import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0F1C', card: '#111827', muted: '#1F2937', border: '#243041',
        success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6'
      }
    }
  }, plugins: []
};
export default config;
