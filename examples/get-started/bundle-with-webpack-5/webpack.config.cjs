module.exports = {
  mode: 'development',
  // experiments: { // support type: module
  //   outputModule: true,
  // },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: ["ts-loader"],
      },
    ],
  },
  devServer: {
    static: './'
  }
};