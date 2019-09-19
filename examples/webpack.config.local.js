// This file contains webpack configuration settings that allow
// examples to be built against the source code in this repo instead
// of building against their installed version.
//
// This enables using the examples to debug the main library source
// without publishing or npm linking, with conveniences such hot reloading etc.
const webpack = require('webpack');
const resolve = require('path').resolve;
// eslint-disable-next-line import/no-extraneous-dependencies
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// eslint-disable-next-line import/no-extraneous-dependencies
const ALIASES = require('ocular-dev-tools/config/ocular.config')({
  root: resolve(__dirname, '..')
}).aliases;

const ROOT_DIR = resolve(__dirname, '..');

const DECK_LINK_ALIASES = {
  // TODO - add all aliases
  '@deck.gl/core': resolve(ROOT_DIR, '../deck.gl/modules/core/src'),
  '@deck.gl/layers': resolve(ROOT_DIR, '../deck.gl/modules/layers/src'),
  '@deck.gl/mesh-layers': resolve(ROOT_DIR, '../deck.gl/modules/mesh-layers/src'),
  '@deck.gl/geo-layers': resolve(ROOT_DIR, '../deck.gl/modules/geo-layers/src'),
  '@deck.gl/react': resolve(ROOT_DIR, '../deck.gl/modules/react/src')
};

const MATH_LINK_ALIASES = {
  'math.gl': resolve(ROOT_DIR, '../math.gl/modules/core/src'),
  '@math.gl/culling': resolve(ROOT_DIR, '../math.gl/modules/culling/src'),
  '@math.gl/geospatial': resolve(ROOT_DIR, '../math.gl/modules/geospatial/src')
};

const LUMA_LINK_ALIASES = {
  '@luma.gl/addons': resolve(ROOT_DIR, '../luma.gl/modules/addons/src'),
  '@luma.gl/constants': resolve(ROOT_DIR, '../luma.gl/modules/constants/src'),
  '@luma.gl/core': resolve(ROOT_DIR, '../luma.gl/modules/core/src'),
  '@luma.gl/debug': resolve(ROOT_DIR, '../luma.gl/modules/debug/src'),
  '@luma.gl/webgl': resolve(ROOT_DIR, '../luma.gl/modules/webgl/src')
};

// Support for hot reloading changes to the library:
const LOCAL_DEVELOPMENT_CONFIG = {
  mode: 'development',

  devtool: 'source-map',

  // suppress warnings about bundle size
  devServer: {
    stats: {
      warnings: false
    },
    contentBase: [resolve('.'), resolve('../../')]
  },

  // this is required by draco
  node: {
    fs: 'empty'
  },

  resolve: {
    // Imports the library from its src directory in this repo
    alias: Object.assign({}, ALIASES)
  },

  module: {
    rules: [
      {
        // Unfortunately, webpack doesn't import library sourcemaps on its own...
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      }
    ]
  },

  plugins: [new webpack.EnvironmentPlugin(['MapboxAccessToken'])]
};

function addLocalDependency(config, dependency) {
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};

  switch (dependency) {
    case 'deck':
      Object.assign(config.resolve.alias, DECK_LINK_ALIASES);
      break;
    case 'luma':
      Object.assign(config.resolve.alias, LUMA_LINK_ALIASES);
      break;
    case 'math':
      Object.assign(config.resolve.alias, MATH_LINK_ALIASES);
      break;
    default:
  }

  return config;
}

function addLocalDevSettings(config, opts) {
  config = Object.assign({}, LOCAL_DEVELOPMENT_CONFIG, config);
  config.resolve = config.resolve || {};
  // config.resolve.mainFields = LOCAL_DEVELOPMENT_CONFIG.resolve.mainFields;
  config.resolve.alias = config.resolve.alias || {};
  Object.assign(config.resolve.alias, LOCAL_DEVELOPMENT_CONFIG.resolve.alias);

  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules = config.module.rules.concat(LOCAL_DEVELOPMENT_CONFIG.module.rules);

  config.plugins = config.plugins || [];
  config.plugins = config.plugins.concat(LOCAL_DEVELOPMENT_CONFIG.plugins);

  return config;
}

function addAnalyzerSettings(config) {
  config.mode = 'production';

  config.resolve = config.resolve || {};

  config.plugins = config.plugins || [];
  config.plugins.push(new BundleAnalyzerPlugin());
  return config;
}

// Use non-transpiled vis.gl dependencies and disable regenerator transforms
function addESNextSettings(config) {
  // Add 'esnext' to make sure vis.gl frameworks are imported with minimal transpilation
  config.resolve = config.resolve || {};
  config.resolve.mainFields = config.resolve.mainFields || ['browser', 'module', 'main'];
  config.resolve.mainFields.shift('esnext');

  // Look for babel plugin
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  const babelRule = config.module.rules.find(rule => rule.loader === 'babel-loader');

  // If found, inject excludes in @babel/present-env to prevent transpile
  if (babelRule && babelRule.options && babelRule.options.presets) {
    babelRule.options.presets = babelRule.options.presets.map(preset => {
      if (preset === '@babel/preset-env') {
        return [
          '@babel/preset-env',
          {
            exclude: [/transform-async-to-generator/, /transform-regenerator/]
          }
        ];
      }
      return preset;
    });
  }
  return config;
}

module.exports = (baseConfig, opts = {}) => env => {
  let config = baseConfig;

  /* eslint-disable no-console */
  /* global console */
  if (env && env.help) {
    console.log(
      '--env.esnext: Use non-transpiled vis.gl dependencies and disable regenerator transforms'
    );
    console.log('--env.local: Build against local src for modules in this repo');
    console.log('--env.math,luma,deck: Build against local src for external repos');
    console.log('--env.analyze: Add bundle size analyzer plugin');
  }

  console.log('For documentation on build options, run: "yarn start --env.help"');

  /* eslint-enable no-console */
  if (env && env.esnext) {
    config = addESNextSettings(config);
  }

  if (env && env.local) {
    config = addLocalDevSettings(config, opts);
  }

  // Iterate over env keys and see if they match a local dependency
  for (const key in env || {}) {
    config = addLocalDependency(config, key);
  }

  if (env && env.analyze) {
    config = addAnalyzerSettings(config);
  }

  // uncomment to debug
  // console.warn(JSON.stringify(config, null, 2));
  return config;
};
