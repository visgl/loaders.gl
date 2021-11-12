const {resolve} = require('path');
const PACKAGE_ROOT = resolve('.');

module.exports = {
  mode: 'development',
  entry: './scripts/converter.js',
  node: {
    fs: 'empty',
    process: false
  },
  output: {
    path: PACKAGE_ROOT,
    filename: 'dist/converter.min.js',
    library: 'converter',
    libraryTarget: 'commonjs'
  },
  stats: 'detailed',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  helpers: false,
                  corejs: true,
                  regenerator: true
                }
              ]
            ]
          }
        }
      }
    ]
  }
};
