// loaders.gl, MIT license
import {Buffer} from './buffer';

export {Buffer};
export {Buffer as BufferPolyfill};

export function installBufferPolyfill() {
  // @ts-ignore
  globalThis.Buffer = globalThis.Buffer || Buffer;
}

installBufferPolyfill();
