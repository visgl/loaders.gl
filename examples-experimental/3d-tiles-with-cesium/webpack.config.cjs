const {resolve} = require('path');

const CONFIG = {
  mode: 'development',

  entry: {
    bundle: resolve('./app.js')
  },
  resolve: {
    tsconfig: false
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = (env) => (env?.local ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG);
