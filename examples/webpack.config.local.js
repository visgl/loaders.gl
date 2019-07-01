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
  '@deck.gl/react': resolve(ROOT_DIR, '../deck.gl/modules/react/src')
};

const MATH_LINK_ALIASES = {
  'math.gl': resolve(ROOT_DIR, '../math.gl/modules/core/src'),
  '@math.gl/culling': resolve(ROOT_DIR, '../math.gl/modules/culling/src'),
  '@math.gl/geospatial': resolve(ROOT_DIR, '../math.gl/modules/geospatial/src')
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
    alias: ALIASES
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
  // 'esnext' picks up ES6 dist for smaller bundles
  config.resolve.mainFields = ['esnext', 'browser', 'module', 'main'];

  config.plugins = config.plugins || [];
  config.plugins.push(new BundleAnalyzerPlugin());
  return config;
}

module.exports = (baseConfig, opts = {}) => env => {
  let config = baseConfig;

  if (env && env.analyze) {
    config = addAnalyzerSettings(config);
  }

  if (env && env.local) {
    config = addLocalDevSettings(config, opts);
  }

  // Iterate over env keys and see if they match a local dependency
  for (const key in env || {}) {
    config = addLocalDependency(config, key);
  }

  // uncomment to debug
  // console.warn(JSON.stringify(config, null, 2));
  return config;
};
