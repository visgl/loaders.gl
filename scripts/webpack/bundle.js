const {resolve} = require('path');
const webpack = require('webpack');

const {getOcularConfig} = require('ocular-dev-tools');

const ALIASES = getOcularConfig({
  aliasMode: 'src',
  root: resolve(__dirname, '../..')
}).aliases;

const PACKAGE_ROOT = resolve('.');
const DIST_PATH = resolve('dist');
const PACKAGE_INFO = require(resolve(PACKAGE_ROOT, 'package.json'));

/**
 * peerDependencies are excluded using `externals`
 * https://webpack.js.org/configuration/externals/
 * e.g. @deck.gl/core is not bundled with @deck.gl/geo-layers
 */
function getExternals(packageInfo) {
  const externals = {
    // Hard coded externals
  };

  const {peerDependencies = {}, browser} = packageInfo;

  Object.assign(externals, browser);

  for (const depName in peerDependencies) {
    if (depName.startsWith('@loaders.gl')) {
      // Instead of bundling the dependency, import from the global `deck` object
      externals[depName] = 'loaders';
    }
  }

  return externals;
}

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
    ['@babel/preset-env', {forceAllTransforms: true}]
  ],
  plugins: [
    '@babel/transform-runtime',
    ["@babel/plugin-transform-modules-commonjs", { allowTopLevelThis: true }],
    'version-inline'
  ]
};

const config = {
  name: 'production',
  mode: 'production',

  entry: {
    main: resolve('./src/bundle')
  },

  output: {
    libraryTarget: 'umd',
    path: DIST_PATH,
    filename: 'dist.min.js'
  },

  node: NODE,

  resolve: {
    alias: ALIASES
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: /src/,
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
  ],

  devtool: false
};

const developmentConfig = {
  ...config,
  name: 'development',
  mode: 'development',
  output: {
    filename: 'dist.dev.js'
  },
  module: {
    rules: []
  }
};

const es5Config = {
  ...config,
  name: 'es5',
  output: {
    filename: 'dist.es5.min.js'
  },
  module: {
    rules: [{
      // Compile ES2015 using babel
      test: /\.js$/,
      loader: 'babel-loader',
      include: /src/,
      options: ES5_BABEL_CONFIG
    }]
  }
};

module.exports = [config, developmentConfig, es5Config];
