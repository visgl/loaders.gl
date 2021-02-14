// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Config for bundling workers
const {resolve} = require('path');
const ALIASES = require('ocular-dev-tools/config/ocular.config')({
  aliasMode: 'src',
  root: resolve(__dirname, '../..')
}).aliases;

const BABEL_CONFIG = {
  presets: [
    // We must transpile to es6 to enable tree shaking
    ['@babel/preset-env', {modules: false}]
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {useESModules: false}],
    'version-inline'
  ]
};

const CONFIG = {
  mode: 'production',

  devtool: false,

  stats: 'minimal',

  resolve: {
    alias: ALIASES
  },

  module: {
    rules: [
      {
        // Compile
        test: /\.js$/,
        exclude: /node_modules|libs/,
        use: [
          {
            loader: 'babel-loader',
            options: BABEL_CONFIG
          }
        ]
      },
      {
        // LIBS: Already compled, just process with babel - e.g. copy to dist
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
  } else {
    // Generate a separate source map
    // @ts-ignore
    config.devtool = 'source-map';
  }
  // console.log(JSON.stringify(config, null, 2));
  return config;
};
