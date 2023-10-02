/* eslint-disable dot-notation */
import {isBrowser} from './utils/globals';

import {TextDecoder, TextEncoder} from './lib/encoding';
import {allSettled} from './promise/all-settled';

// Node specific
import * as base64 from './node/buffer/btoa.node';

import {encodeImageNode} from './node/images/encode-image.node';
import {parseImageNode, NODE_FORMAT_SUPPORT} from './node/images/parse-image.node';

// export {ReadableStreamPolyfill} from './node/file/readable-stream';
// export {BlobPolyfill} from './node/file/blob';
export {FileReaderPolyfill} from './node/file/file-reader';
export {FilePolyfill} from './node/file/file';
export {installFilePolyfills} from './node/file/install-file-polyfills';

if (isBrowser) {
  // eslint-disable-next-line no-console
  console.error(
    'loaders.gl: The @loaders.gl/polyfills should only be used in Node.js environments'
  );
}

// POLYFILLS: TextEncoder, TextDecoder
// - Recent Node versions have these classes but virtually no encodings unless special build.
// - Browser: Edge, IE11 do not have these

if (!globalThis.TextEncoder) {
  // @ts-expect-error
  globalThis.TextEncoder = TextEncoder;
}

if (!globalThis.TextDecoder) {
  // @ts-expect-error
  globalThis.TextDecoder = TextDecoder;
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

globalThis.loaders = globalThis.loaders || {};

// FILESYSTEM POLYFILLS:
export {NodeFileSystem} from './filesystems/node-filesystem';
import {NodeFileSystem} from './filesystems/node-filesystem';
globalThis.loaders.NodeFileSystem = NodeFileSystem;

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

// DEPRECATED POLYFILL:
// - Node v18+: No, not needed
// - Node v16 and lower: Yes
// - Browsers (evergreen): Not needed.
// - IE11: No. This polyfill is node only, install external polyfill
import {Headers as HeadersNode} from './node/fetch/headers.node';
import {Response as ResponseNode} from './node/fetch/response.node';
import {fetchNode as fetchNode} from './node/fetch/fetch.node';

if (!isBrowser && !('Headers' in globalThis) && HeadersNode) {
  // @ts-expect-error
  globalThis.Headers = HeadersNode;
}

if (!isBrowser && !('Response' in globalThis) && ResponseNode) {
  // @ts-expect-error
  globalThis.Response = ResponseNode;
}

if (!isBrowser && !('fetch' in globalThis) && fetchNode) {
  // @ts-expect-error
  globalThis.fetch = fetchNode;
}
