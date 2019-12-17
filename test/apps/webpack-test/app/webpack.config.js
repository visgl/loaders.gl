const {resolve} = require('path');

module.exports = {
  mode: 'development',
  entry: {
    main: resolve('./main.js')
  },
  output: {
    filename: 'dist.js'
  },
  module: {
    rules: []
  },
  resolve: {
    alias: {
      '@luma.gl/experimental': resolve('node_modules/@luma.gl/experimental')
    }
  }
};
