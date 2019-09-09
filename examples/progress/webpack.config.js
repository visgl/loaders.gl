const {resolve} = require('path');

const CONFIG = {
  mode: 'development',

  entry: {
    app: resolve('./app.js')
  },

  node: {
    fs: 'empty'
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('../webpack.config.local')(CONFIG)(env) : CONFIG);
