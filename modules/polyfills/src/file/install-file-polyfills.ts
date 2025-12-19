// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// import {ReadableStreamPolyfill} from './readable-stream';
import {FileReaderPolyfill} from './file-reader';
import {FilePolyfill} from './file';

export function installFilePolyfills() {
  if (typeof FileReader === 'undefined' && !globalThis.FileReader) {
    // @ts-ignore;
    globalThis.FileReader = FileReaderPolyfill;
  }

  // Install minimal Node.js File polyfill
  if (typeof File === 'undefined' && !globalThis.File) {
    // @ts-ignore;
    globalThis.File = FilePolyfill;
  }

  return global;
}

export const File_ = installFilePolyfills();
