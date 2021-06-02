require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx']
});

// Determine Node version
let version = 10;
if (typeof process !== 'undefined') {
  const matches = process.version.match(/v([0-9]*)/);
  version = (matches && parseFloat(matches[1])) || version;
}

// Note: This constant will be inlined by babel plugin during transpilation
// But for node we read it from lerna.json
// @ts-ignore TS2339: Property does not exist on type 'Global'
global.__VERSION__ = require('../lerna.json').version;
// @ts-ignore TS2339: Property does not exist on type 'Global'
global.nodeVersion = version;

require('./modules');
