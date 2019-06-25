/* global process */
let version = 10;
if (typeof process !== 'undefined') {
  const matches = process.version.match(/v([0-9]*)/);
  version = (matches && parseFloat(matches[1])) || version;
  // console.log(matches, version);
}
if (version < 10) {
  console.log('Using babel/register. Node version:', version);
  require('core-js/stable');
  require('regenerator-runtime/runtime');
  require('@babel/register')({
    presets: [['@babel/env', { modules: 'commonjs' }]]
  });
} else {
  console.log('Using reify. Node version:', version);
  require('reify');
}

require('./modules');
