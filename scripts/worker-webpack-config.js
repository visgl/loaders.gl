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
  root: resolve(__dirname, '..')
}).aliases;

const BABEL_CONFIG = {
  presets: [
    // We must transpile to es6 to enable tree shaking
    ['@babel/env', {modules: false}]
  ],
  plugins: [['@babel/plugin-transform-runtime', {useESModules: false}]]
};

module.exports = {
  mode: 'production',

  devtool: false,

  stats: 'minimal',

  resolve: {
    alias: ALIASES
  },

  module: {
    rules: [
      {
        // Compile ES2015 using babel
        test: /\.js$/,
        // exclude: /node_modules|transpiled/,
        exclude: /node_modules|transpiled|minified/,
        use: [
          {
            loader: 'babel-loader',
            options: BABEL_CONFIG
          }
        ]
      },
      {
        // Compile ES2015 using babel
        test: /\.transpiled.js$|\.minified.js$/,
        // exclude: /node_modules|transpiled/,
        exclude: /node_modules|/,
        use: [
          {
            loader: 'babel-loader',
            options: {}
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
