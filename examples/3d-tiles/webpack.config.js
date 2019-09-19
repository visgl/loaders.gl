const CONFIG = {
  mode: 'development',

  entry: {
    app: './app.js'
  },

  output: {
    library: 'App'
  },

  resolve: {
    mainFields: ['esnext', 'browser', 'module', 'main']
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
          presets: [
            [
              '@babel/preset-env',
              {
                exclude: ['@babel/transform-regenerator']
              }
            ],
            '@babel/preset-react'
          ]
        }
      }
    ]
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('../webpack.config.local')(CONFIG)(env) : CONFIG);
