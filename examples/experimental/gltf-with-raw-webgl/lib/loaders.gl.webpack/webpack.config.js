const {resolve} = require('path');

module.exports = {
  entry: './app.js',
  output: {
    path: __dirname + '/lib',
    filename: 'loaders.gl.js',
    libraryTarget: 'var',
    library: 'Loaders'
  }
};
