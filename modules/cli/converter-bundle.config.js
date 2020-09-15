const {resolve} = require('path');
const PACKAGE_ROOT = resolve('.');

module.exports = {
  mode: 'production',
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
  target: 'node'
};
