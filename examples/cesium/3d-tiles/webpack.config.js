const {resolve} = require('path');

module.exports = {
  mode: 'development',

  entry: {
    bundle: resolve('./app.js')
  } // ,

  // externals: {
  //   'Cesium'
  // }
};
