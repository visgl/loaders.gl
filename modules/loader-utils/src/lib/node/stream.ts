// loaders.gl, MIT license

import stream from 'stream';

export type {Writable} from 'stream';

export let Transform;

export const isSupported = Boolean(stream);

// paths

try {
  /** Wrapper for Node.js fs method */
  Transform = stream.Transform;
} catch {
  // ignore
}
