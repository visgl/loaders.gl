// luma.gl, MIT license

import {Buffer as BufferPolyfill} from './buffer';

/** Install the Node.js Buffer polyfill (NO-OP in Node.js) */
export function installBufferPolyfill(): typeof Buffer {
  const Buffer_ = typeof Buffer !== 'undefined' ? Buffer : null;
  if (!Buffer_) {
    // @ts-expect-error
    globalThis.Buffer = BufferPolyfill;
    return BufferPolyfill as unknown as typeof Buffer;
  }
  // Buffer is a global variable in Node.js
  return Buffer_;
}
