import type {Writer} from '@loaders.gl/loader-utils';
import {encodeArrowSync} from './lib/encode-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {Writer} */
export const ArrowWriter = {
  name: 'Apache Arrow',
  id: 'arrow',
  module: 'arrow',
  version: VERSION,
  extensions: ['arrow', 'feather'],
  mimeTypes: ['application/octet-stream'],
  encodeSync,
  binary: true,
  options: {}
};

function encodeSync(data) {
  const arrayBuffer = encodeArrowSync(data);
  return arrayBuffer;
}
