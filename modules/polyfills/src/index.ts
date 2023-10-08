/* eslint-disable dot-notation */
import {isBrowser} from './utils/is-browser';

import {TextDecoder, TextEncoder} from './lib/encoding';

// Node specific
import {atob, btoa} from './node/buffer/btoa.node';

import {encodeImageNode} from './node/images/encode-image.node';
import {parseImageNode, NODE_FORMAT_SUPPORT} from './node/images/parse-image.node';

// FILESYSTEM POLYFILLS
export {NodeFile} from './filesystems/node-file';
export {NodeFileSystem} from './filesystems/node-filesystem';
export {fetchNode} from './filesystems/fetch-node';
import {NodeFile} from './filesystems/node-file';
import {NodeFileSystem} from './filesystems/node-filesystem';
import {fetchNode} from './filesystems/fetch-node';

// export {ReadableStreamPolyfill} from './node/file/readable-stream';
// export {BlobPolyfill} from './node/file/blob';
export {FileReaderPolyfill} from './node/file/file-reader';
export {FilePolyfill} from './node/file/file';
export {installFilePolyfills} from './node/file/install-file-polyfills';

const {versions} = require('node:process');
export const nodeVersion = parseInt(versions.node.split('.')[0]);

if (isBrowser) {
  // eslint-disable-next-line no-console
  console.error(
    'loaders.gl: The @loaders.gl/polyfills should only be used in Node.js environments'
  );
}

// FILESYSTEM POLYFILLS
globalThis.loaders = globalThis.loaders || {};
globalThis.loaders.NodeFile = NodeFile;
globalThis.loaders.NodeFileSystem = NodeFileSystem;
globalThis.loaders.fetchNode = fetchNode;

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

if (!('atob' in globalThis) && atob) {
  globalThis['atob'] = atob;
}
if (!('btoa' in globalThis) && btoa) {
  globalThis['btoa'] = btoa;
}

// NODE IMAGE FUNCTIONS:
// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (!('_encodeImageNode' in globalThis) && encodeImageNode) {
  globalThis['_encodeImageNode'] = encodeImageNode;
}

if (!('_parseImageNode' in globalThis) && parseImageNode) {
  globalThis['_parseImageNode'] = parseImageNode;
  globalThis['_imageFormatsNode'] = NODE_FORMAT_SUPPORT;
}

// DEPRECATED POLYFILL:
// - Node v18+: No, not needed
// - Node v16 and lower: Yes
// - Browsers (evergreen): Not needed.
// - IE11: No. This polyfill is node only, install external polyfill
import {Headers as HeadersNode} from './node/fetch/headers.node';
import {Response as ResponseNode} from './node/fetch/response.node';
import {fetchNode as fetchNodePolyfill} from './node/fetch/fetch.node';

if (nodeVersion < 18) {
  if (!('Headers' in globalThis) && HeadersNode) {
    // @ts-expect-error
    globalThis.Headers = HeadersNode;
  }

  if (!('Response' in globalThis) && ResponseNode) {
    // @ts-expect-error
    globalThis.Response = ResponseNode;
  }

  if (!('fetch' in globalThis) && fetchNodePolyfill) {
    // @ts-expect-error
    globalThis.fetch = fetchNodePolyfill;
  }
}
