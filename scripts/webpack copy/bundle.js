const {resolve} = require('path');
const webpack = require('webpack');

const ALIASES = require('ocular-dev-tools/config/ocular.config')({
  aliasMode: 'src',
  root: resolve(__dirname, '../..')
}).aliases;

const PACKAGE_ROOT = resolve('.');
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

const BABEL_CONFIG = {
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
  mode: 'production',

  entry: {
    main: resolve('./src/bundle')
  },

  output: {
    libraryTarget: 'umd',
    path: PACKAGE_ROOT,
    filename: 'dist/dist.min.js'
  },

  node: NODE,

  resolve: {
    alias: ALIASES
  },

  module: {
    rules: [
      {
        // Compile ES2015 using babel
        test: /\.js$/,
        loader: 'babel-loader',
        include: /src/,
        // exclude: /transpiled/
        options: BABEL_CONFIG
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

module.exports = (env = {}) => {
  // console.log(JSON.stringify(env, null, 2));

  if (env.dev) {
    // Set development mode (no minification)
    config.mode = 'development';
    // Remove .min from the name
    config.output.filename = 'dist/dist.dev.js';
    // Disable transpilation
    config.module.rules = [];
  } else {
    // Generate a separate source map
    // @ts-ignore
    config.devtool = 'source-map';
  }


  // NOTE uncomment to display config
  // console.log('webpack config', JSON.stringify(config, null, 2));

  return config;
};
