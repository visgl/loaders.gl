const getWebpackConfig = require('ocular-dev-tools/config/webpack.config');

// The following files will be imported/required as array buffers via arraybuffer-loader
const BINARY_FILE_EXTENSIONS = /\.glb$|\.png$|\.jpeg$|\.gif$|\.bmp$|\.tiff$|\.bin/;

const BABEL_CONFIG = {
  presets: ['@babel/env'],
  plugins: [
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.worker.js']
      }
    ],
    ['@babel/plugin-transform-runtime', {useESModules: true}]
  ],
  ignore: ['**/*.worker.js']
};

module.exports = (env = {}) => {
  const config = getWebpackConfig(env);

  config.module.rules.push(
    {
      // This is required to handle inline worker!
      test: /\.js$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: BABEL_CONFIG
        }
      ]
    },
    {
      // Load worker tests
      test: /\.worker\.js$/,
      use: {
        loader: 'worker-loader'
      }
    },
    {
      test: /\.kml$/,
      use: 'raw-loader'
    },
    {
      test: BINARY_FILE_EXTENSIONS,
      use: 'arraybuffer-loader'
    }
  );

  return config;
};
