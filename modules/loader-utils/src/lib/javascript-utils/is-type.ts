// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable @typescript-eslint/unbound-method */

import type {Readable} from 'stream';

/** Minimal shape for Node.js Buffer-like values */
type NodeBufferLike = {buffer: ArrayBufferLike; isBuffer: true};

/** Minimal shape for Node.js writable streams */
type NodeWritableStream = {
  end: (...args: unknown[]) => unknown;
  write: (...args: unknown[]) => unknown;
  writable: boolean;
};

/** Minimal shape for WritableStream-like DOM implementations */
type WritableDOMStreamLike = WritableStream | {abort: () => unknown; getWriter: () => unknown};

/** A DOM or Node readable stream */
export type ReadableStreamType = ReadableStream | Readable;

/** Checks whether a value is a boolean */
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

/** Checks whether a value is a function */
const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

/** Checks whether a value is a non-null object */
export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object';

/** Checks whether a value is a plain object (created by the Object constructor) */
export const isPureObject = (value: unknown): value is Record<string, unknown> =>
  isObject(value) && value.constructor === {}.constructor;

/** Checks whether a value is an ArrayBuffer */
export const isArrayBuffer = (value: unknown): value is ArrayBuffer =>
  typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer;

/** Checks whether a value is an ArrayBuffer */
export const isSharedArrayBuffer = (value: unknown): value is SharedArrayBuffer =>
  typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer;

/** Checks whether a value is ArrayBuffer-like */
export const isArrayBufferLike = (value: unknown): value is ArrayBufferLike =>
  isObject(value) &&
  typeof (value as ArrayBufferLike).byteLength === 'number' &&
  typeof (value as ArrayBufferLike).slice === 'function';

/** Checks whether a value behaves like a promise */
export const isPromise = (value: unknown): value is Promise<unknown> =>
  isObject(value) && 'then' in value && isFunction((value as {then: unknown}).then);

/** Checks whether a value implements the iterable protocol */
export const isIterable = (value: unknown): value is Iterable<unknown> =>
  Boolean(value) && isFunction((value as Iterable<unknown>)[Symbol.iterator]);

/** Checks whether a value implements the async iterable protocol */
export const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> =>
  Boolean(value) && isFunction((value as AsyncIterable<unknown>)[Symbol.asyncIterator]);

/** Checks whether a value is an iterator (has a next function) */
export const isIterator = (value: unknown): value is Iterator<unknown> =>
  Boolean(value) && isFunction((value as Iterator<unknown>).next);

/** Checks whether a value is a fetch Response or a duck-typed equivalent */
export const isResponse = (value: unknown): value is Response =>
  (typeof Response !== 'undefined' && value instanceof Response) ||
  (isObject(value) &&
    isFunction((value as {arrayBuffer?: unknown}).arrayBuffer) &&
    isFunction((value as {text?: unknown}).text) &&
    isFunction((value as {json?: unknown}).json));

/** Checks whether a value is a File */
export const isFile = (value: unknown): value is File =>
  typeof File !== 'undefined' && value instanceof File;

/** Checks whether a value is a Blob */
export const isBlob = (value: unknown): value is Blob =>
  typeof Blob !== 'undefined' && value instanceof Blob;

/** Checks for Node.js Buffers without triggering bundlers to include the Buffer polyfill */
export const isBuffer = (value: unknown): value is NodeBufferLike =>
  Boolean(
    value &&
      typeof value === 'object' &&
      (value as Partial<NodeBufferLike>).isBuffer &&
      'buffer' in (value as NodeBufferLike)
  );

/** Checks whether a value looks like a DOM WritableStream */
export const isWritableDOMStream = (value: unknown): value is WritableDOMStreamLike =>
  isObject(value) &&
  isFunction((value as WritableDOMStreamLike).abort) &&
  isFunction((value as WritableDOMStreamLike).getWriter);

/** Checks whether a value looks like a DOM ReadableStream */
export const isReadableDOMStream = (value: unknown): value is ReadableStream =>
  (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) ||
  (isObject(value) &&
    isFunction((value as ReadableStream).tee) &&
    isFunction((value as ReadableStream).cancel) &&
    isFunction((value as ReadableStream).getReader));
// Not implemented in Firefox: && isFunction(x.pipeTo)

/** Checks whether a value looks like a Node.js writable stream */
export const isWritableNodeStream = (value: unknown): value is NodeWritableStream =>
  isObject(value) &&
  isFunction((value as NodeWritableStream).end) &&
  isFunction((value as NodeWritableStream).write) &&
  isBoolean((value as NodeWritableStream).writable);

/** Checks whether a value looks like a Node.js readable stream */
export const isReadableNodeStream = (value: unknown): value is Readable =>
  isObject(value) &&
  isFunction((value as Readable).read) &&
  isFunction((value as Readable).pipe) &&
  isBoolean((value as Readable).readable);

/** Checks whether a value is any readable stream (DOM or Node.js) */
export const isReadableStream = (value: unknown): value is ReadableStreamType =>
  isReadableDOMStream(value) || isReadableNodeStream(value);

/** Checks whether a value is any writable stream (DOM or Node.js) */
export const isWritableStream = (value: unknown): value is WritableStream | NodeWritableStream =>
  isWritableDOMStream(value) || isWritableNodeStream(value);
