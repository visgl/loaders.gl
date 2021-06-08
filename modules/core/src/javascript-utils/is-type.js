const isBoolean = (x) => typeof x === 'boolean';
const isFunction = (x) => typeof x === 'function';

export const isObject = (x) => x !== null && typeof x === 'object';
export const isPureObject = (x) => isObject(x) && x.constructor === {}.constructor;
export const isPromise = (x) => isObject(x) && isFunction(x.then);

export const isIterable = (x) => x && typeof x[Symbol.iterator] === 'function';
export const isAsyncIterable = (x) => x && typeof x[Symbol.asyncIterator] === 'function';
export const isIterator = (x) => x && isFunction(x.next);

export const isResponse = (x) =>
  (typeof Response !== 'undefined' && x instanceof Response) ||
  (x && x.arrayBuffer && x.text && x.json);

export const isFile = (x) => typeof File !== 'undefined' && x instanceof File;
export const isBlob = (x) => typeof Blob !== 'undefined' && x instanceof Blob;

export const isWritableDOMStream = (x) =>
  isObject(x) && isFunction(x.abort) && isFunction(x.getWriter);

export const isReadableDOMStream = (x) =>
  (typeof ReadableStream !== 'undefined' && x instanceof ReadableStream) ||
  (isObject(x) && isFunction(x.tee) && isFunction(x.cancel) && isFunction(x.getReader));
// Not implemented in Firefox: && isFunction(x.pipeTo)

// Check for Node.js `Buffer` without triggering bundler to include polyfill
export const isBuffer = (x) => x && typeof x === 'object' && x.isBuffer;

export const isWritableNodeStream = (x) =>
  isObject(x) && isFunction(x.end) && isFunction(x.write) && isBoolean(x.writable);
export const isReadableNodeStream = (x) =>
  isObject(x) && isFunction(x.read) && isFunction(x.pipe) && isBoolean(x.readable);
export const isReadableStream = (x) => isReadableDOMStream(x) || isReadableNodeStream(x);
export const isWritableStream = (x) => isWritableDOMStream(x) || isWritableNodeStream(x);
