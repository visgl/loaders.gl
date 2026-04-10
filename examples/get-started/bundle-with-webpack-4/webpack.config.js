const {resolve} = require('path');

module.exports = {
  mode: 'development',

  entry: {
    app: resolve('./app.js')
  },

  node: {
    fs: 'empty'
  }
};
