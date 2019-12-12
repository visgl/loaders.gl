const getBabelConfig = require('ocular-dev-tools/config/babel.config');

module.exports = api => {
  const config = getBabelConfig(api);

  config.plugins = config.plugins || [];
  config.plugins.push('version-inline');

  // https://babeljs.io/docs/en/options#overrides
  const overrides = config.overrides || [];
  // TEST to prevent compilation of already transpiled files
  // TODO: Ideally these files should be copied to the right dist folder without any further modification
  // It still seems they are being parsed by babel which does take a relatively long time
  overrides.push({
    test: /src\/libs/,
    compact: false,
    sourceMaps: false
  });
  // Default babel config (env, plugin) only apply to the rest of the files
  overrides.push({
    exclude: /src\/libs/,
    ...config
  });

  return {
    // Don't transpile workers, they are transpiled separately
    ignore: ['**/*.worker.js', '**/workers/*.js', /src\/libs/],
    overrides
  };
};
