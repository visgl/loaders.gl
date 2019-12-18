/* global process, global, console */
/* eslint-disable no-console */

// Determine Node version
let version = 10;
if (typeof process !== 'undefined') {
  const matches = process.version.match(/v([0-9]*)/);
  version = (matches && parseFloat(matches[1])) || version;
}

// Note: This constant will be inlined by babel plugin during transpilation
// But for node we read it from lerna.json
global.__VERSION__ = require('../lerna.json').version;
global.nodeVersion = version;

// Use reify for import/export support
console.log('Using reify. Node version:', version);
require('reify');

require('./modules');
