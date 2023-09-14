// luma.gl, MIT license

export {Buffer, Buffer as BufferPolyfill} from './buffer';

import {Buffer} from './buffer';

/** Install Node.js Buffer polyfill (NO-OP in Node.js) */
export function installBufferPolyfill() {
  // @ts-ignore
  globalThis.Buffer = globalThis.Buffer || Buffer;
}
