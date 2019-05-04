import {isBrowser, global} from './utils/globals';
import {encodeImageNode} from './images-node/encode-image.node';
import {parseImageNode} from './images-node/parse-image.node';

// Node 11 introduces these classes, for lower versions we use these polyfills

/* global TextEncoder, TextDecoder */
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
  const {TextDecoder, TextEncoder} = require('./text-encoding/encoding');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}

// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (!isBrowser && typeof global._encodeImageNode === 'undefined') {
  global._encodeImageNode = encodeImageNode;
}

if (!isBrowser && typeof global._parseImageNode === 'undefined') {
  global._parseImageNode = parseImageNode;
}
