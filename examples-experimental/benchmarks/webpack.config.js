const COMMON_CONFIG = {
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
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: {
          presets: [
            '@babel/preset-react',
            [
              '@babel/preset-env',
              {
                // Transpiling classes kills object creation performance
                exclude: ['@babel/plugin-transform-classes']
              }
            ]
          ]
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};

function addDevConfig(config, env) {
  config = require('../webpack.config.local')(config)(env);
  return config;
}

function addProdConfig(config) {
  config.plugins = config.plugins || [];

  return Object.assign(config, {
    mode: 'production'
  });
}

module.exports = (env) => {
  env = env || {};

  let config = COMMON_CONFIG;

  if (env.local) {
    config = addDevConfig(config, env);
  }

  if (env.prod) {
    config = addProdConfig(config);
  }

  // Enable to debug config
  // console.warn(JSON.stringify(config, null, 2));

  return config;
};
