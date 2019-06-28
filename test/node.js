/* global process, console */
/* eslint-disable no-console */
/* global global */
// const {resolve} = require('path');

let version = 10;
if (typeof process !== 'undefined') {
  const matches = process.version.match(/v([0-9]*)/);
  version = (matches && parseFloat(matches[1])) || version;
  // console.log(matches, version);
}

global.nodeVersion = version;

if (version < 10) {
  console.log('Using babel/register. Node version:', version);

  const moduleAlias = require('module-alias');
  moduleAlias.addAliases({
    // Use the es5 version of arrow
    // 'apache-arrow': resolve(__dirname, '../node_modules/apache-arrow/Arrow.es5.min.js')
  });

  require('core-js/stable'); // Polyfill `Symbol` under Node.js 8

  require('@babel/register')({
    presets: [['@babel/env', {modules: 'commonjs'}]],
    plugins: [
      '@babel/transform-runtime',
      [
        'babel-plugin-inline-import',
        {
          extensions: ['.worker.js']
        }
      ]
    ],
    ignore: ['node_modules', '**/*.transpiled.js', '**/*.min.js']
  });
} else {
  console.log('Using reify. Node version:', version);
  require('reify');
}

require('./modules');
