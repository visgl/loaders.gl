"use strict";module.export({isPromise:()=>isPromise,isIterable:()=>isIterable,isAsyncIterable:()=>isAsyncIterable,isIterator:()=>isIterator,isFetchResponse:()=>isFetchResponse,isWritableDOMStream:()=>isWritableDOMStream,isReadableDOMStream:()=>isReadableDOMStream,isWritableNodeStream:()=>isWritableNodeStream,isReadableNodeStream:()=>isReadableNodeStream,isReadableStream:()=>isReadableStream,isWritableStream:()=>isWritableStream},true);const isBoolean = x => typeof x === 'boolean';
const isFunction = x => typeof x === 'function';
const isObject = x => x !== null && typeof x === 'object';

const isPromise = x => isObject(x) && isFunction(x.then);

const isIterable = x => x && typeof x[Symbol.iterator] === 'function';

const isAsyncIterable = x => x && typeof x[Symbol.asyncIterator] === 'function';

const isIterator = x => isObject(x) && 'done' in x && 'value' in x;

const isFetchResponse = x =>
  (typeof window !== 'undefined' && x instanceof window.Response) ||
  (x.arrayBuffer && x.json && x.body);

const isWritableDOMStream = x => {
  return isObject(x) && isFunction(x.abort) && isFunction(x.getWriter);
};

const isReadableDOMStream = x => {
  return (
    isObject(x) &&
    isFunction(x.tee) &&
    isFunction(x.cancel) &&
    isFunction(x.pipeTo) &&
    isFunction(x.getReader)
  );
};

const isWritableNodeStream = x => {
  return isObject(x) && isFunction(x.end) && isFunction(x.write) && isBoolean(x.writable);
};

const isReadableNodeStream = x => {
  return isObject(x) && isFunction(x.read) && isFunction(x.pipe) && isBoolean(x.readable);
};

const isReadableStream = x => isReadableDOMStream(x) || isReadableNodeStream(x);

const isWritableStream = x => isWritableDOMStream(x) || isWritableNodeStream(x);
