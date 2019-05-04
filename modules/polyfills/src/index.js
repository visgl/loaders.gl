import {encodeImageNode} from './images-node/encode-image.node';
import {parseImageNode} from './images-node/parse-image.node';

// Node 11 introduces these classes, for lower versions we use these polyfills

// Determine global variable
/* global self, window, global */
const globals = {
  self: typeof self !== 'undefined' && self,
  window: typeof window !== 'undefined' && window,
  global: typeof global !== 'undefined' && global
};

const global_ = globals.global || globals.self || globals.window;

/* global TextEncoder, TextDecoder */
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
  const {TextDecoder, TextEncoder} = require('./text-encoding/encoding');
  global_.TextDecoder = TextDecoder;
  global_.TextEncoder = TextEncoder;
}

// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (typeof global_._encodeImageNode === 'undefined') {
  global_._encodeImageNode = encodeImageNode;
}

if (typeof global_._parseImageNode === 'undefined') {
  global_._parseImageNode = parseImageNode;
}
