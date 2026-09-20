/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './ucode/**/*.ut',
    './src/scripts/**/*.js',
    './test/fixtures/**/*.html'
  ],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {}
  }
};
