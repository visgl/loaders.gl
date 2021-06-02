const {getBabelConfig, deepMerge} = require('ocular-dev-tools');

module.exports = api => {
  const defaultConfig = getBabelConfig(api, {react: true});

  const config = deepMerge(defaultConfig, {
    plugins: ['version-inline'],
    ignore: [
      // Don't transpile workers, they are transpiled separately
      '**/*.worker.js',
      '**/workers/*.js',
      // Don't transpile files in libs, we use this folder to store external,
      // already transpiled and minified libraries and scripts.
      // e.g. draco, basis, las-perf etc.
      /src\/libs/,
      // babel can't process .d.ts
      /\.d\.ts$/
    ]
  });

  console.error('***BABEL***', config.presets);
  return config;
};
