// luma.gl, MIT license

export {Buffer, Buffer as BufferPolyfill} from './buffer';

import {Buffer} from './buffer';

export function installBufferPolyfill() {
  // @ts-ignore
  globalThis.Buffer = globalThis.Buffer || Buffer;
}
