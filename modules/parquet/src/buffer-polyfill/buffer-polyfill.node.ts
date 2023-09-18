// luma.gl, MIT license

const Buffer_ = typeof Buffer !== 'undefined' ? Buffer : null;
export {Buffer_ as Buffer};
export {Buffer as BufferPolyfill} from './buffer';

import {Buffer as BufferPolyfill} from './buffer';

/** Install the Node.js Buffer polyfill (NO-OP in Node.js) */
export function installBufferPolyfill() {
  if (!Buffer_) {
    // @ts-expect-error
    globalThis.Buffer = BufferPolyfill;
  }
  // Buffer is a global variable in Node.js
}
