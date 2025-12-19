const HtmlWebpackPlugin = require('html-webpack-plugin');

const CONFIG = {
  mode: 'development',

  entry: {
    app: './app.js'
  },

  plugins: [new HtmlWebpackPlugin({title: 'glTF in deck.gl'})],

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react']
        }
      }
    ]
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = (env) => (env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG);
