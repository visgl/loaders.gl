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

  // config.ignore = ['**/*.worker.js', '**/*.transpiled.js', '**/*.min.js'];
  config.ignore = ['**/*.worker.js'];

  // TEST to prevent compilation of already transpiled files
  config.overrides = config.overrides || [];
  config.overrides.push({
    // Tell babel these are already large and minified
    // https://babeljs.io/docs/en/options#overrides
    test: /min.js|transpiled.js/,
    compact: false,
    sourceMaps: false
  });

  return config;
};
