// Launch script for various Node test configurations

// Enables ES2015 import/export in Node.js
require('reify');

require('../aliases');

/* global process */
const path = require('path');
const moduleAlias = require('module-alias');

const {BrowserTestDriver} = require('probe.gl/test-utils');

const mode = process.argv.length >= 3 ? process.argv[2] : 'default';
const arg = process.argv.length >= 4 ? process.argv[3] : 'default';
console.log(`Running test suite in "${mode}" mode...`); // eslint-disable-line

switch (mode) {
case 'fast':
case 'test':
  require('./modules/core');
  break;

case 'dist':
  // Load deck.gl itself from the dist folder
  const dist = arg === 'default' ? 'es6' : arg;
  moduleAlias.addAlias('loaders.gl', path.resolve(`./dist/${dist}`));

  require('./modules/core');
  break;

case 'cover':
  require('@babel/register');
  require('./modules/core');
  break;

case 'browser':
  new BrowserTestDriver().run({
    process: 'webpack-dev-server',
    parameters: ['--config', 'test/webpack.config.js', '--env.testBrowser'],
    exposeFunction: 'testDone'
  });
  break;

case 'render':
  new BrowserTestDriver().run({
    process: 'webpack-dev-server',
    parameters: ['--env.render'],
    exposeFunction: 'testDone'
  });
  break;

case 'bench':
  require('./bench/index'); // Run the benchmarks
  break;

case 'analyze':
case 'analyze-size':
  const util = require('util');
  const exec = util.promisify(require('child_process').exec);
  exec(
    'webpack --config test/webpack.config.js --hide-modules --env.import-nothing --env.analyze --env.es6');
  break;

default:
  console.error(`Unknown test mode ${mode}`); // eslint-disable-line
  require('./modules/core');
}
