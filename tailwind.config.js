module.exports = {
  mode: 'jit',
  content: [
      "./views/**/*.ejs", 
      "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
