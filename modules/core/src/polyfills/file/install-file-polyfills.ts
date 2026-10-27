// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {FileReaderPolyfill} from './file-reader';

export function installFilePolyfills() {
  if (typeof FileReader === 'undefined' && !globalThis.FileReader) {
    // @ts-ignore;
    globalThis.FileReader = FileReaderPolyfill;
  }

  return global;
}
