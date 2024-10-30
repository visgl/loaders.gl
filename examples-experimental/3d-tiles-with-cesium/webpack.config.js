const {resolve} = require('path');

const CONFIG = {
  mode: 'development',

  entry: {
    bundle: resolve('./app.js')
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = (env) => (env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG);
