const {resolve} = require('path');
const PACKAGE_ROOT = resolve('.');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  node: {
    fs: 'empty',
    process: false
  },
  output: {
    path: PACKAGE_ROOT,
    filename: 'vendor/converter.min.js',
    library: 'converter',
    libraryTarget: 'commonjs'
  },
  stats: 'detailed',
  target: 'node'
};
