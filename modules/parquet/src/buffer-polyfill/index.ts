// loaders.gl, MIT license
import {Buffer} from './buffer';
// @ts-expect-error
globalThis.Buffer = Buffer;
export {Buffer};
export {Buffer as BufferPolyfill};
