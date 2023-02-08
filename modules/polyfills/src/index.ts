/* eslint-disable dot-notation */
import {isBrowser} from './utils/globals';

// import {TextDecoder, TextEncoder} from 'util';
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
export {fetchNode as _fetchNode} from './node/fetch/fetch.node';

import {installFilePolyfills} from './node/file/install-file-polyfills';
installFilePolyfills();

// POLYFILLS: TextEncoder, TextDecoder
// - Recent Node versions have these classes but virtually no encodings unless special build.
// - Browser: Edge, IE11 do not have these

const installTextEncoder = !isBrowser || !('TextEncoder' in globalThis);
if (installTextEncoder) {
  // @ts-ignore
  globalThis['TextEncoder'] = TextEncoder;
  console.error('TextEncoder installed');
} else {
  console.error('TextEncoder already available');
}

const installTextDecoder = !isBrowser || !('TextDecoder' in globalThis);
if (installTextDecoder) {
  // @ts-ignore
  globalThis['TextDecoder'] = TextDecoder;
}

// POLYFILLS: btoa, atob
// - Node: Yes
// - Browser: No

if (!isBrowser && !('atob' in globalThis) && base64.atob) {
  globalThis['atob'] = base64.atob;
}
if (!isBrowser && !('btoa' in globalThis) && base64.btoa) {
  globalThis['btoa'] = base64.btoa;
}

// POLYFILL: fetch
// - Node: Yes
// - Browser: No. For This polyfill is node only, IE11 etc, install external polyfill

if (!isBrowser && !('Headers' in globalThis) && HeadersNode) {
  // @ts-ignore
  globalThis['Headers'] = HeadersNode;
}

if (!isBrowser && !('Response' in globalThis) && ResponseNode) {
  // @ts-ignore
  globalThis['Response'] = ResponseNode;
}

if (!isBrowser && !('fetch' in globalThis) && fetchNode) {
  // @ts-ignore
  globalThis['fetch'] = fetchNode;
  console.error('fetch installed');
} else {
  console.error('fetch already available');
}

// NODE IMAGE FUNCTIONS:
// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (!isBrowser && !('_encodeImageNode' in globalThis) && encodeImageNode) {
  globalThis['_encodeImageNode'] = encodeImageNode;
}

if (!isBrowser && !('_parseImageNode' in globalThis) && parseImageNode) {
  globalThis['_parseImageNode'] = parseImageNode;
  globalThis['_imageFormatsNode'] = NODE_FORMAT_SUPPORT;
}

if (!('allSettled' in Promise)) {
  // @ts-ignore
  Promise.allSettled = allSettled;
}
