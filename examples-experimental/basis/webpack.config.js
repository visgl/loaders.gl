const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const CONFIG = {
  mode: 'development',

  entry: {
    app: resolve('./app.js')
  },

  plugins: [new HtmlWebpackPlugin({title: 'Basis Loader'})],

  node: {
    fs: 'empty'
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = (env) => (env ? require('../webpack.config.local')(CONFIG)(env) : CONFIG);
