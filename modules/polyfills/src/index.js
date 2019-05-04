/* eslint-disable dot-notation */
import {isBrowser, global} from './utils/globals';

import {TextDecoder, TextEncoder} from './text-encoding/encoding';

import fetchNode from './fetch-node/fetch.node';

import {encodeImageNode} from './images-node/encode-image.node';
import {parseImageNode} from './images-node/parse-image.node';

// POLYFILLS: TextEncoder, TextDecoder
// - Node: v11 introduces these classes, for lower versions we use these polyfills
// - Browser: Edge, IE11 do not have these

if (typeof global['TextEncoder'] === 'undefined' || typeof global['TextDecoder'] === 'undefined') {
  if (!global['TextEncoder']) {
    global['TextEncoder'] = TextEncoder;
  }
  if (!global['TextDecoder']) {
    global['TextDecoder'] = TextDecoder;
  }
}

// POLYFILL: fetch
// - Node:
// - Browser: IE11 etc, This polyfill is node only, use external polyfil

if (!isBrowser && typeof global['fetch'] === 'undefined') {
  global['fetch'] = fetchNode;
}

// NODE IMAGE FUNCTIONS:
// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (!isBrowser && typeof global['_encodeImageNode'] === 'undefined') {
  global['_encodeImageNode'] = encodeImageNode;
}

if (!isBrowser && typeof global['_parseImageNode'] === 'undefined') {
  global['_parseImageNode'] = parseImageNode;
}
