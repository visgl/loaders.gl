// This file contains webpack configuration settings that allow
// examples to be built against the source code in this repo instead
// of building against their installed version.
//
// This enables using the examples to debug the main library source
// without publishing or npm linking, with conveniences such hot reloading etc.
const webpack = require('webpack');
const resolve = require('path').resolve;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {getOcularConfig} = require('ocular-dev-tools');
const ALIASES = getOcularConfig({root: resolve(__dirname, '..')}).aliases;
const ROOT_DIR = resolve(__dirname, '..');
const LERNA_INFO = require(resolve(ROOT_DIR, 'lerna.json'));

const BABEL_CONFIG = {
  presets: ['@babel/env'],
  plugins: [
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.worker.js']
      }
    ],
    ['@babel/plugin-transform-runtime', {useESModules: true}],
    'version-inline'
  ],
  ignore: ['**/*.worker.js']
};

const DECK_LINK_ALIASES = {
  // TODO - add all aliases
  '@deck.gl/core': resolve(ROOT_DIR, '../deck.gl/modules/core/src'),
  '@deck.gl/layers': resolve(ROOT_DIR, '../deck.gl/modules/layers/src'),
  '@deck.gl/mesh-layers': resolve(ROOT_DIR, '../deck.gl/modules/mesh-layers/src'),
  '@deck.gl/geo-layers': resolve(ROOT_DIR, '../deck.gl/modules/geo-layers/src'),
  '@deck.gl/react': resolve(ROOT_DIR, '../deck.gl/modules/react/src')
};

const MATH_LINK_ALIASES = {
  '@math.gl/core': resolve(ROOT_DIR, '../math.gl/modules/core/src'),
  '@math.gl/culling': resolve(ROOT_DIR, '../math.gl/modules/culling/src'),
  '@math.gl/geospatial': resolve(ROOT_DIR, '../math.gl/modules/geospatial/src')
};

const LUMA_LINK_ALIASES = {
  '@luma.gl/experimental': resolve(ROOT_DIR, '../luma.gl/modules/experimental/src'),
  '@luma.gl/constants': resolve(ROOT_DIR, '../luma.gl/modules/constants/src'),
  '@luma.gl/core': resolve(ROOT_DIR, '../luma.gl/modules/core/src'),
  '@luma.gl/debug': resolve(ROOT_DIR, '../luma.gl/modules/debug/src'),
  '@luma.gl/engine': resolve(ROOT_DIR, '../luma.gl/modules/engine/src'),
  '@luma.gl/gltools': resolve(ROOT_DIR, '../luma.gl/modules/gltools/src'),
  '@luma.gl/shadertools': resolve(ROOT_DIR, '../luma.gl/modules/shadertools/src'),
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
    contentBase: [resolve('.'), resolve('../../'), resolve('../../../')]
  },

  // this is required by draco
  node: {
    fs: 'empty'
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    // mainFields: ['esnext', 'browser', 'module', 'main'],
    // Imports the library from its src directory in this repo
    alias: Object.assign({}, ALIASES)
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: {
          presets: ['@babel/preset-typescript', [
            '@babel/preset-env',
            {
              exclude: [/transform-async-to-generator/, /transform-regenerator/]
            }
          ], '@babel/preset-react']
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                exclude: [/transform-async-to-generator/, /transform-regenerator/] 
              }
            ], '@babel/preset-react']
        }
      },
      {
        // Unfortunately, webpack doesn't import library sourcemaps on its own...
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      },
      {
        // This is required to handle inline worker!
        test: /worker.*\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: BABEL_CONFIG
          }
        ]
      },
      // workers need to be completely transpiled
      {
        // Load worker tests
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader'
        }
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(LERNA_INFO.version)
    })
  ]
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
  // We need to have 1 `React` instance when running `yarn start-local-deck`
  Object.assign(config.resolve.alias, {
    react: resolve(ROOT_DIR, 'node_modules/react')
  });

  return config;
}

function addLocalDevSettings(config, opts) {
  // Merge local config with module config
  config = Object.assign({}, LOCAL_DEVELOPMENT_CONFIG, config);
  // Generate initial resolve object.
  config.resolve = config.resolve || {};
  // Generate initial alias object
  config.resolve.alias = config.resolve.alias || {};
  // Merge aliases from config with loacal config aliases
  Object.assign(config.resolve.alias, LOCAL_DEVELOPMENT_CONFIG.resolve.alias);
  // Use extensions from local config
  config.resolve.extensions = LOCAL_DEVELOPMENT_CONFIG.resolve.extensions;
  // Generate initial config mudule
  config.module = config.module || {};
  // Get module config rules
  const configRules = config.module.rules || [];
  // Merge local rules with module config rules
  config.module.rules = LOCAL_DEVELOPMENT_CONFIG.module.rules.concat(configRules);
  // Use initial config plugins
  config.plugins = config.plugins || [];
  // Do concatenation of local and module config plugins
  config.plugins = config.plugins.concat(LOCAL_DEVELOPMENT_CONFIG.plugins);
  // Uncomment to validate generated config
  // console.log(config);

  return config;
}

function addAnalyzerSettings(config) {
  config.mode = 'production';

  config.resolve = config.resolve || {};
  // 'esnext' picks up ES6 dist for smaller bundles

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
  const babelRule = config.module.rules.find((rule) => rule.loader === 'babel-loader');

  // If found, inject excludes in @babel/present-env to prevent transpile
  if (babelRule && babelRule.options && babelRule.options.presets) {
    babelRule.options.presets = babelRule.options.presets.map((preset) => {
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

module.exports =
  (baseConfig, opts = {}) =>
  (env) => {
    let config = baseConfig;

    /* eslint-disable no-console */
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
