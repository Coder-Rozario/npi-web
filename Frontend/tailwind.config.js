import daisyui from 'daisyui';

const brandShades = {
  50:  "#F0F9FE",
  100: "#E0F2FE",
  200: "#BAE6FD",
  300: "#7DD3FC",
  400: "#38BDF8",
  500: "#0EA5E9",
  600: "#0186C0",
  700: "#0369A1",
  800: "#075985",
  900: "#0C4A6E",
  950: "#082F49",
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: brandShades,
        sky:  brandShades,
      },
    },
  },
  plugins: [daisyui],
}
