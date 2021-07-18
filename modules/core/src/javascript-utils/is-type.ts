import type {Readable} from 'stream';

/** A DOM or Node readable stream */
export type ReadableStreamType = ReadableStream | Readable;

const isBoolean: (x: any) => boolean = (x) => typeof x === 'boolean';
const isFunction: (x: any) => boolean = (x) => typeof x === 'function';

export const isObject: (x: any) => boolean = (x) => x !== null && typeof x === 'object';
export const isPureObject: (x: any) => boolean = (x) =>
  isObject(x) && x.constructor === {}.constructor;
export const isPromise: (x: any) => boolean = (x) => isObject(x) && isFunction(x.then);

export const isIterable: (x: any) => boolean = (x) => x && typeof x[Symbol.iterator] === 'function';
export const isAsyncIterable: (x: any) => boolean = (x) =>
  x && typeof x[Symbol.asyncIterator] === 'function';
export const isIterator: (x: any) => boolean = (x) => x && isFunction(x.next);

export const isResponse: (x: any) => boolean = (x) =>
  (typeof Response !== 'undefined' && x instanceof Response) ||
  (x && x.arrayBuffer && x.text && x.json);

export const isFile: (x: any) => boolean = (x) => typeof File !== 'undefined' && x instanceof File;
export const isBlob: (x: any) => boolean = (x) => typeof Blob !== 'undefined' && x instanceof Blob;

/** Check for Node.js `Buffer` without triggering bundler to include buffer polyfill */
export const isBuffer: (x: any) => boolean = (x) => x && typeof x === 'object' && x.isBuffer;

export const isWritableDOMStream: (x: any) => boolean = (x) =>
  isObject(x) && isFunction(x.abort) && isFunction(x.getWriter);

export const isReadableDOMStream: (x: any) => boolean = (x) =>
  (typeof ReadableStream !== 'undefined' && x instanceof ReadableStream) ||
  (isObject(x) && isFunction(x.tee) && isFunction(x.cancel) && isFunction(x.getReader));
// Not implemented in Firefox: && isFunction(x.pipeTo)

export const isWritableNodeStream: (x: any) => boolean = (x) =>
  isObject(x) && isFunction(x.end) && isFunction(x.write) && isBoolean(x.writable);
export const isReadableNodeStream: (x: any) => boolean = (x) =>
  isObject(x) && isFunction(x.read) && isFunction(x.pipe) && isBoolean(x.readable);
export const isReadableStream: (x: any) => boolean = (x) =>
  isReadableDOMStream(x) || isReadableNodeStream(x);
export const isWritableStream: (x: any) => boolean = (x) =>
  isWritableDOMStream(x) || isWritableNodeStream(x);
