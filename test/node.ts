import {readFileSync} from 'fs';

const packageInfo = JSON.parse(readFileSync('./lerna.json', 'utf-8'));
// Note: This constant will be inlined by babel plugin during transpilation
// But for node we read it from lerna.json
// @ts-ignore TS2339: Property does not exist on type 'Global'
global.__VERSION__ = packageInfo.version;

// Determine Node version
let nodeVersion = 10;
if (typeof process !== 'undefined') {
  const matches = process.version.match(/v([0-9]*)/);
  nodeVersion = (matches && parseFloat(matches[1])) || nodeVersion;
}
// @ts-ignore TS2339: Property does not exist on type 'Global'
global.nodeVersion = nodeVersion;

import {installFilePolyfills} from '@loaders.gl/polyfills';
// Install polyfills
installFilePolyfills();

import './modules';
