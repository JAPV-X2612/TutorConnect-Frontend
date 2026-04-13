/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006A75',   // teal principal — botones, headers, progress
          foreground: '#FFFFFF', // texto sobre fondo primary
        },
        secondary: {
          DEFAULT: '#CBD5E1',   // gris claro — botones secundarios, disabled
          foreground: '#334155', // texto sobre fondo secondary
        },
        accent: {
          DEFAULT: '#F97316',   // naranja — icono tutor, highlights
          foreground: '#FFFFFF',
        },
        text: {
          primary:   '#0F172A', // títulos
          secondary: '#334155', // párrafos
          muted:     '#475569', // subtítulos, labels
          subtle:    '#64748B', // hints, placeholders
          link:      '#006A75', // links e.g. "Inicia sesión"
        },
        border: '#CBD5E1',
        background: '#FFFFFF',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
