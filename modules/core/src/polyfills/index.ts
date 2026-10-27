// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable dot-notation */
import {isBrowser} from './utils/is-browser';

import {TextDecoder, TextEncoder} from './text-encoder/text-encoder';

// Node specific
import {atob, btoa} from './buffer/btoa.node.js';

import {encodeImageNode, parseImageNode, NODE_FORMAT_SUPPORT} from './images/image-codecs-node';
import {
  createImageBitmapNode,
  NodeImageBitmap,
  getImageBitmapDataNode,
  isNodeImageBitmap
} from './images/node-image-bitmap';

// FILESYSTEM POLYFILLS
import {NodeFile} from './filesystems/node-file';
import {NodeFileSystem} from './filesystems/node-filesystem';
import {fetchNode} from './filesystems/fetch-node';

import {NodeHash} from './crypto/node-hash';

// NODE VERSION
import {versions} from 'node:process';
import {ReadableStream as NodeReadableStream} from 'node:stream/web';
export const nodeVersion = parseInt(versions.node.split('.')[0]);

// STREAM POLYFILLS
import {makeNodeStream} from './streams/make-node-stream';

// Native Blob and File constructors and the FileReader adapter.
import {installFilePolyfills} from './file/install-file-polyfills';
/** Native Node.js Blob constructor. */
export const Blob = globalThis.Blob;
/** Native Node.js File constructor. */
export const File = globalThis.File;
installFilePolyfills();

if (isBrowser) {
  // eslint-disable-next-line no-console
  console.error(
    'loaders.gl: The @loaders.gl/core/polyfills should only be used in Node.js environments'
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
  globalThis.ReadableStream = NodeReadableStream as typeof ReadableStream;
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
globalThis.loaders.createImageBitmapNode = createImageBitmapNode;
globalThis.loaders.getImageBitmapDataNode = getImageBitmapDataNode;
globalThis.loaders.isImageBitmapNode = isNodeImageBitmap;

if (!globalThis.ImageBitmap) {
  (globalThis as any).ImageBitmap = NodeImageBitmap;
}

if (!('getImageBitmapData' in globalThis)) {
  (globalThis as any).getImageBitmapData = getImageBitmapDataNode;
}

// Deprecated, remove after republish
globalThis._parseImageNode = parseImageNode;
globalThis._imageFormatsNode = NODE_FORMAT_SUPPORT;

// LOAD LIBRARY

import {
  readFileAsArrayBuffer,
  readFileAsText,
  requireFromFile,
  requireFromString
} from './load-library/require-utils.node.js';

globalThis.loaders.readFileAsArrayBuffer = readFileAsArrayBuffer;
globalThis.loaders.readFileAsText = readFileAsText;
globalThis.loaders.requireFromFile = requireFromFile;
globalThis.loaders.requireFromString = requireFromString;

export {installFilePolyfills};
export {setPathPrefix, addAliases} from './utils/path-utils';
