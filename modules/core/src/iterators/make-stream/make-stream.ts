import type {ReadableStreamType} from '../../javascript-utils/is-type';
import type {MakeDOMStreamOptions} from './make-dom-stream';
import type {MakeNodeStreamOptions} from './make-node-stream';

import {isBrowser} from '@loaders.gl/loader-utils';
import {makeDOMStream} from './make-dom-stream';
import {makeNodeStream} from './make-node-stream';

export type MakeStreamOptions = MakeDOMStreamOptions | MakeNodeStreamOptions;

/**
 * Returns a stream for an (async) iterator (works in both Node.js and browsers)
 */
export function makeStream(
  data: Iterable<ArrayBuffer> | AsyncIterable<ArrayBuffer>,
  options?: MakeStreamOptions
): ReadableStreamType {
  return isBrowser ? makeDOMStream(data, options) : makeNodeStream(data, options);
}
