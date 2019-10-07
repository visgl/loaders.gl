const getWebpackConfig = require('ocular-dev-tools/config/webpack.config');

module.exports = (env = {}) => {
  const config = getWebpackConfig(env);

  config.module.rules.push({
    // Load worker tests
    test: /\.worker\.js$/,
    use: {
      loader: 'worker-loader'
    }
  });

  // Uncomment to debug config
  // console.error(JSON.stringify(config, null, 2));

  return [
    config,
    // For worker tests
    // Output bundles to root and can be loaded with `new Worker('/*.worker.js')`
    {
      mode: 'development',
      entry: {
        'json-loader': './modules/core/test/worker-utils/json-loader.worker.js',
        'jsonl-loader': './modules/core/test/worker-utils/jsonl-loader.worker.js'
      },
      output: {
        filename: '[name].worker.js'
      },
      target: 'webworker'
    }
  ];
};
