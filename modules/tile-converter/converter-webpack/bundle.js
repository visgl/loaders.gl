const {resolve} = require('path');
const PACKAGE_ROOT = resolve('.');

const {getOcularConfig} = require('ocular-dev-tools');

const ocularConfig = getOcularConfig({
  aliasMode: 'src',
  root: resolve(__dirname, '../../..')
});

const ALIASES = ocularConfig.aliases;

const ES6_BABEL_CONFIG = {
  presets: ['@babel/preset-typescript'],
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

module.exports = {
  mode: 'production',
  entry: './scripts/converter.js',
  node: {
    fs: 'empty',
    process: false
  },
  output: {
    path: PACKAGE_ROOT,
    filename: 'dist/converter.min.js',
    library: 'converter',
    libraryTarget: 'commonjs'
  },
  stats: 'detailed',
  target: 'node',
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
      }
    ]
  }
};
