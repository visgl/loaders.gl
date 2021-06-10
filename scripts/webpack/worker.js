// Config for bundling workers
const {resolve} = require('path');
const {getOcularConfig} = require('ocular-dev-tools');

const ALIASES = getOcularConfig({
  aliasMode: 'src',
  root: resolve(__dirname, '../..')
}).aliases;

const BABEL_CONFIG = {
  presets: [
    '@babel/typescript',
    // We must transpile to es6 to enable tree shaking
    ['@babel/preset-env', {modules: false}]
  ],
  plugins: [
    // webpack 4 cannot parse the most recent JS syntax
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    // inject __VERSION__ from package.json
    'version-inline'
  ]
};

const CONFIG = {
  mode: 'production',

  devtool: 'source-map',

  stats: 'none',

  resolve: {
    extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx'],
    alias: ALIASES
  },

  module: {
    rules: [
      {
        // Compile
        test: /\.(js|ts)$/,
        exclude: /node_modules|libs/,
        use: [
          {
            loader: 'babel-loader',
            options: BABEL_CONFIG
          }
        ]
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto"
      },
      {
        // LIBS: Already compiled, just process with babel - e.g. copy to dist
        test: /libs\.*\.js$/,
        exclude: /node_modules|/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              compact: false
            }
          }
        ]
      }
    ]
  },

  node: {
    fs: 'empty',
    Buffer: false
  }
};

// For dev workers:
// Minimize transpilation, disable regenerator transforms, and use non-transpiled vis.gl dependencies.
// TODO - duplicates local example setup. Generalize and move to ocular-dev-tools
function addESNextSettings(config) {
  // Add 'esnext' to make sure vis.gl frameworks are imported with minimal transpilation
  config.resolve = config.resolve || {};
  config.resolve.mainFields = config.resolve.mainFields || ['browser', 'module', 'main'];
  config.resolve.mainFields.shift('esnext');

  // Look for babel plugin
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  const babelRuleWrapper = config.module.rules.find(rule => {
    // console.log('rule', JSON.stringify(rule.use, null, 2));
    return rule.use && (rule.use[0].loader === 'babel-loader');
  });

  const babelRule = babelRuleWrapper && babelRuleWrapper.use[0];

  // If found, inject excludes in @babel/present-env to prevent transpile
  if (babelRule && babelRule.options && babelRule.options.presets) {
    babelRule.options.presets = babelRule.options.presets.map(preset => {
      if (preset === '@babel/preset-env' || preset[0] === '@babel/preset-env') {
        return [
          '@babel/preset-env',
          {
            targets: {chrome: 80},
            exclude: [/transform-async-to-generator/, /transform-regenerator/]
          }
        ];
      }
      return preset;
    });
  }
  return config;
}

module.exports = (env = {}) => {
  let config = CONFIG;
  if (env.dev) {
    config.mode = 'development';
    config = addESNextSettings(config);
  }
  // console.log(JSON.stringify(config, null, 2));
  return config;
};
