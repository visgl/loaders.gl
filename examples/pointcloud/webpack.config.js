const CONFIG = {
  mode: 'development',

  entry: {
    app: './app.js'
  },

  output: {
    library: 'App'
  },

  module: {
    rules: [
      {
        // Transpile ES6 to ES5 with babel
        // Remove if your app does not use JSX or you don't need to support old browsers
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: {
<<<<<<< HEAD:examples/pointcloud/webpack.config.js
          presets: ['@babel/preset-react']
=======
          presets: ['@babel/preset-env', '@babel/preset-react']
>>>>>>> gltf: gltf-loader waits until all assets loaded.:examples/3d-tiles/webpack.config.js
        }
      }
    ]
  },
  node: {
    fs: 'empty'
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('../webpack.config.local')(CONFIG)(env) : CONFIG);
