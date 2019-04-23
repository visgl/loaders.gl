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
      '@luma.gl/addons': resolve('node_modules/@luma.gl/addons')
    }
  }
};
