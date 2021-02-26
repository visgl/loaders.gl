const {resolve} = require('path');
const PACKAGE_ROOT = resolve('.');

module.exports = {
  mode: 'production',
  output: {
    path: PACKAGE_ROOT,
    filename: 'dist/converter.min.js',
    library: 'converter',
    libraryTarget: 'commonjs'
  },
  target: 'node'
};
