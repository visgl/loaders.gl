const getBabelConfig = require('ocular-dev-tools/config/babel.config');

module.exports = api => {
  const config = getBabelConfig(api);

  config.plugins = config.plugins || [];
  config.plugins.push('version-inline');

  return {
    ...config,
    ignore: [
      // Don't transpile workers, they are transpiled separately
      '**/*.worker.js',
      '**/workers/*.js',
      // Don't transpile files in libs, we use this folder to store external,
      // already transpiled and minified libraries and scripts.
      // e.g. draco, basis, las-perf etc.
      /src\/libs/
    ]
  };
};
