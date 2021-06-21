const {getBabelConfig, deepMerge} = require('ocular-dev-tools');

module.exports = (api) => {
  const defaultConfig = getBabelConfig(api, {react: true});

  let config = deepMerge(defaultConfig, {
    plugins: [
      // webpack 4 cannot parse the most recent JS syntax
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      // typescript supports class properties
      '@babel/plugin-proposal-class-properties',
      // inject __VERSION__ from package.json
      'version-inline'
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

  // When building esm modules change the '>0.2%' target to 'last 2 versions' so that the regenerator runtime is not included
  if (api.env() == 'esm') {
    const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;

    // @ts-ignore
    config = deepMerge(
      config,
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: ['last 2 versions', 'maintained node versions', 'not ie 11', 'not dead'],
              modules: false
            }
          ],
          '@babel/preset-react',
          '@babel/preset-typescript'
        ]
      },
      {arrayMerge: overwriteMerge}
    );
  }

  return config;
};
