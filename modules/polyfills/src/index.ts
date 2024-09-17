/* eslint-disable dot-notation */
import {isBrowser} from './utils/is-browser';

import {TextDecoder, TextEncoder} from './text-encoder/text-encoder';

// Node specific
import {atob, btoa} from './buffer/btoa.node';

import {encodeImageNode} from './images/encode-image-node';
import {parseImageNode, NODE_FORMAT_SUPPORT} from './images/parse-image-node';

// FILESYSTEM POLYFILLS
import {NodeFile} from './filesystems/node-file';
import {NodeFileSystem} from './filesystems/node-filesystem';
import {fetchNode} from './filesystems/fetch-node';

import {NodeHash} from './crypto/node-hash';

// NODE VERSION
// @ts-expect-error
import {versions} from 'node:process';
export const nodeVersion = parseInt(versions.node.split('.')[0]);

// STREAM POLYFILLS
import {makeNodeStream} from './streams/make-node-stream';

// BLOB AND FILE POLYFILLS
export {Blob_ as Blob} from './file/install-blob-polyfills';
export {File_ as File} from './file/install-file-polyfills';

if (isBrowser) {
  // eslint-disable-next-line no-console
  console.error(
    'loaders.gl: The @loaders.gl/polyfills should only be used in Node.js environments'
  );
}

globalThis.loaders = globalThis.loaders || {};

// STREAM POLYFILLS
export {makeNodeStream} from './streams/make-node-stream';
globalThis.loaders.makeNodeStream = makeNodeStream;

// FILESYSTEM POLYFILLS
globalThis.loaders.NodeFile = NodeFile;
globalThis.loaders.NodeFileSystem = NodeFileSystem;
globalThis.loaders.fetchNode = fetchNode;

// CRYPTO POLYFILLS
globalThis.loaders.NodeHash = NodeHash;

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

if (!globalThis.ReadableStream) {
  globalThis.ReadableStream = ReadableStream;
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

globalThis.loaders.encodeImageNode = encodeImageNode;
globalThis.loaders.parseImageNode = parseImageNode;
globalThis.loaders.imageFormatsNode = NODE_FORMAT_SUPPORT;

// Deprecated, remove after republish
globalThis._parseImageNode = parseImageNode;
globalThis._imageFormatsNode = NODE_FORMAT_SUPPORT;

// LOAD LIBRARY

import {
  readFileAsArrayBuffer,
  readFileAsText,
  requireFromFile,
  requireFromString
} from './load-library/require-utils.node';

globalThis.loaders.readFileAsArrayBuffer = readFileAsArrayBuffer;
globalThis.loaders.readFileAsText = readFileAsText;
globalThis.loaders.requireFromFile = requireFromFile;
globalThis.loaders.requireFromString = requireFromString;

export {installFilePolyfills} from './file/install-file-polyfills';

// DEPRECATED POLYFILL:
// - Node v18+: No, not needed
// - Node v16 and lower: Yes
// - Browsers (evergreen): Not needed.
// - IE11: No. This polyfill is node only, install external polyfill
import {Headers as HeadersNode} from './fetch/headers-polyfill';
import {Response as ResponseNode} from './fetch/response-polyfill';
import {fetchNode as fetchNodePolyfill} from './fetch/fetch-polyfill';

if (nodeVersion < 18) {
  if (!('Headers' in globalThis) && HeadersNode) {
    // @ts-ignore
    globalThis.Headers = HeadersNode;
  }

  if (!('Response' in globalThis) && ResponseNode) {
    // @ts-ignore
    globalThis.Response = ResponseNode;
  }

  if (!('fetch' in globalThis) && fetchNodePolyfill) {
    // @ts-ignore
    globalThis.fetch = fetchNodePolyfill;
  }
}
