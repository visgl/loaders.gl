// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// import {ReadableStreamPolyfill} from './readable-stream';
import {BlobPolyfill} from './blob';

export function instalBlobPolyfills() {
  if (typeof Blob === 'undefined' && !globalThis.Blob) {
    // @ts-ignore;
    globalThis.Blob = BlobPolyfill;
  }

  return globalThis.Blob;
}

export const Blob_ = instalBlobPolyfills();
