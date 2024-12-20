// tailwind.config.js
import forms from '@tailwindcss/forms';

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    forms,
  ],
}