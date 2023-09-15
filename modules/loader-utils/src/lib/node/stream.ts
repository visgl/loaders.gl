// loaders.gl, MIT license

import * as stream from 'stream';

export type {Writable} from 'stream';

/** Wrapper for Node.js stream method */
export const Transform = stream.Transform;

export const isSupported = Boolean(stream);
