const {getBabelConfig, deepMerge} = require('ocular-dev-tools');
const __VERSION__ = require('./lerna.json').version;

module.exports = (api) => {
  const defaultConfig = getBabelConfig(api, {react: true});

  const config = deepMerge(defaultConfig, {
    plugins: [
      // inject __VERSION__ from package.json
      ['babel-plugin-global-define', {__VERSION__}]
    ],
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

  // console.debug(config);
  return config;
};
