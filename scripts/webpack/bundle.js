const {resolve} = require('path');
const webpack = require('webpack');

const {getOcularConfig} = require('ocular-dev-tools');
const {getExternals} = require('./helpers');

const ocularConfig = getOcularConfig({
  aliasMode: 'src',
  root: resolve(__dirname, '../..')
});

const ALIASES = ocularConfig.aliases;

const PACKAGE_ROOT = resolve('.');
const DIST_PATH = resolve('dist');
const PACKAGE_INFO = require(resolve(PACKAGE_ROOT, 'package.json'));

const NODE = {
  Buffer: false,
  fs: 'empty',
  http: 'empty',
  https: 'empty',
  path: 'empty',
  crypto: 'empty'
};

const ES5_BABEL_CONFIG = {
  presets: [
    '@babel/preset-typescript',
    ['@babel/preset-env', {forceAllTransforms: true}]
  ],
  plugins: [
    // webpack 4 cannot parse the most recent JS syntax
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    // typescript supports class properties
    '@babel/plugin-proposal-class-properties',
    // inject __VERSION__ from package.json
    'version-inline',
    ["@babel/plugin-transform-modules-commonjs", { allowTopLevelThis: true }],
  ]
};

const ES6_BABEL_CONFIG = {
  presets: [
    '@babel/preset-typescript'
  ],
  plugins: [
    // webpack 4 cannot parse the most recent JS syntax
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    // typescript supports class properties
    '@babel/plugin-proposal-class-properties',
    // inject __VERSION__ from package.json
    'version-inline'
  ]
};

const config = {
  name: 'production',
  mode: 'production',

  devtool: 'source-map',

  stats: 'errors-only',

  entry: {
    main: resolve('./src/bundle.ts')
  },

  output: {
    libraryTarget: 'umd',
    path: DIST_PATH,
    filename: 'dist.min.js'
  },

  node: NODE,

  resolve: {
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'],
    alias: ALIASES
  },

  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        loader: 'babel-loader',
        include: /src/,
        options: ES6_BABEL_CONFIG
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto"
      }
    ]
  },

  externals: getExternals(PACKAGE_INFO),

  plugins: [
    // This is used to define the __VERSION__ constant in core/lib/init.js
    // babel-plugin-version-inline uses the package version from the working directory
    // Therefore we need to manually import the correct version from the core
    // This is called in prepublishOnly, after lerna bumps the package versions
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(PACKAGE_INFO.version)
    })
  ]
};

// const developmentConfig = {
//   ...config,
//   name: 'development',
//   mode: 'development',
//   output: {
//     filename: 'dist.dev.js'
//   }
// };

const es5Config = {
  ...config,
  name: 'es5',
  output: {
    filename: 'dist.es5.min.js'
  },
  module: {
    rules: [{
      // Compile ES2015 using babel
      test: /\.(js|ts)$/,
      loader: 'babel-loader',
      include: /src/,
      options: ES5_BABEL_CONFIG
    }]
  }
};

// console.error(JSON.stringify(config, null, 2))

module.exports = [config, es5Config];
