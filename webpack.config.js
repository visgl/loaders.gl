/* eslint-disable import/no-extraneous-dependencies */
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
  // console.log(JSON.stringify(config, null, 2));

  return [config];
};
