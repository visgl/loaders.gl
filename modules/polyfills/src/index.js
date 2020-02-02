/* eslint-disable dot-notation */
import {isBrowser, global} from './utils/globals';

import {TextDecoder, TextEncoder} from './libs/encoding';
import * as base64 from './text-encoding/btoa.node';

import HeadersNode from './fetch-node/headers.node';
import ResponseNode from './fetch-node/response.node';
import fetchNode from './fetch-node/fetch.node';

import {encodeImageNode} from './images-node/encode-image.node';
import {parseImageNode} from './images-node/parse-image.node';

// POLYFILLS: TextEncoder, TextDecoder
// - Node: v11 introduces these classes, for lower versions we use these polyfills
// - Browser: Edge, IE11 do not have these

if (!('TextEncoder' in global) && TextEncoder) {
  global['TextEncoder'] = TextEncoder;
}
if (!('TextDecoder' in global) && TextDecoder) {
  global['TextDecoder'] = TextDecoder;
}

// POLYFILLS: btoa, atob
// - Node: Yes
// - Browser: No

if (!isBrowser && !('atob' in global) && base64.atob) {
  global['atob'] = base64.atob;
}
if (!isBrowser && !('btoa' in global) && base64.btoa) {
  global['btoa'] = base64.btoa;
}

// POLYFILL: fetch
// - Node: Yes
// - Browser: No. For This polyfill is node only, IE11 etc, install external polyfill

if (!isBrowser && !('Headers' in global) && HeadersNode) {
  global['Headers'] = HeadersNode;
}

if (!isBrowser && !('Response' in global) && ResponseNode) {
  global['Response'] = ResponseNode;
}

if (!isBrowser && !('fetch' in global) && fetchNode) {
  global['fetch'] = fetchNode;
}

// NODE IMAGE FUNCTIONS:
// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (!isBrowser && !('_encodeImageNode' in global) && encodeImageNode) {
  global['_encodeImageNode'] = encodeImageNode;
}

if (!isBrowser && !('_parseImageNode' in global) && parseImageNode) {
  global['_parseImageNode'] = parseImageNode;
}
