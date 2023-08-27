/* eslint-disable dot-notation */
import {isBrowser, global} from './utils/globals';

import {TextDecoder, TextEncoder} from './lib/encoding';
import {allSettled} from './promise/all-settled';

// Node specific
import * as base64 from './node/buffer/btoa.node';

import {Headers as HeadersNode} from './node/fetch/headers.node';
import {Response as ResponseNode} from './node/fetch/response.node';
import {fetchNode as fetchNode} from './node/fetch/fetch.node';

import {encodeImageNode} from './node/images/encode-image.node';
import {parseImageNode, NODE_FORMAT_SUPPORT} from './node/images/parse-image.node';

// export {ReadableStreamPolyfill} from './node/file/readable-stream';
// export {BlobPolyfill} from './node/file/blob';
export {FileReaderPolyfill} from './node/file/file-reader';
export {FilePolyfill} from './node/file/file';
export {installFilePolyfills} from './node/file/install-file-polyfills';

// POLYFILLS: TextEncoder, TextDecoder
// - Recent Node versions have these classes but virtually no encodings unless special build.
// - Browser: Edge, IE11 do not have these

const installTextEncoder = !isBrowser || !('TextEncoder' in global);
if (installTextEncoder) {
  global['TextEncoder'] = TextEncoder;
}

const installTextDecoder = !isBrowser || !('TextDecoder' in global);
if (installTextDecoder) {
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

// DEPRECATED POLYFILL:
// - Node v18+: No, not needed
// - Node v16 and lower: Yes
// - Browsers (evergreen): Not needed.
// - IE11: No. This polyfill is node only, install external polyfill

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
  global['_imageFormatsNode'] = NODE_FORMAT_SUPPORT;
}

if (!('allSettled' in Promise)) {
  // @ts-ignore
  Promise.allSettled = allSettled;
}
