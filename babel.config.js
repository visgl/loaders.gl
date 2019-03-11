const getBabelConfig = require('ocular-dev-tools/config/babel.config');

module.exports = api => {
  const config = getBabelConfig(api);

  config.plugins = config.plugins || [];
  config.plugins.push([
    'babel-plugin-inline-import',
    {
      extensions: ['.worker.js']
    }
  ]);

  config.ignore = ['**/*.worker.js'];

  return config;
};
