// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Readable} from 'stream';

/** Minimal shape for Node.js Buffer-like values */
type NodeBufferLike = {buffer: ArrayBufferLike; isBuffer: true};

/** Minimal shape for Node.js writable streams */
type NodeWritableStream = {
  end: (...args: unknown[]) => unknown;
  write: (...args: unknown[]) => unknown;
  writable: boolean;
};

/** A DOM or Node readable stream */
export type ReadableStreamType = ReadableStream | Readable;

/** Checks whether a value is a boolean */
const isBoolean: (value: unknown) => value is boolean = (value) => typeof value === 'boolean';

/** Checks whether a value is a function */
const isFunction: (value: unknown) => value is (...args: unknown[]) => unknown = (value) =>
  typeof value === 'function';

/** Checks whether a value is a non-null object */
export const isObject: (value: unknown) => value is Record<string, unknown> = (value) =>
  value !== null && typeof value === 'object';

/** Checks whether a value is a plain object (created by the Object constructor) */
export const isPureObject: (value: unknown) => value is Record<string, unknown> = (value) =>
  isObject(value) && value.constructor === {}.constructor;

/** Checks whether a value behaves like a promise */
export const isPromise: (value: unknown) => value is Promise<unknown> = (value) =>
  isObject(value) && isFunction((value as Promise<unknown>).then);

/** Checks whether a value implements the iterable protocol */
export const isIterable: (value: unknown) => value is Iterable<unknown> = (value) =>
  Boolean(value) && typeof (value as Iterable<unknown>)[Symbol.iterator] === 'function';

/** Checks whether a value implements the async iterable protocol */
export const isAsyncIterable: (value: unknown) => value is AsyncIterable<unknown> = (value) =>
  Boolean(value) && typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function';

/** Checks whether a value is an iterator (has a next function) */
export const isIterator: (value: unknown) => value is Iterator<unknown> = (value) =>
  Boolean(value) && isFunction((value as Iterator<unknown>).next);

/** Checks whether a value is a fetch Response or a duck-typed equivalent */
export const isResponse: (value: unknown) => value is Response = (value) =>
  (typeof Response !== 'undefined' && value instanceof Response) ||
  (isObject(value) &&
    isFunction((value as Response).arrayBuffer) &&
    isFunction((value as Response).text) &&
    isFunction((value as Response).json));

/** Checks whether a value is a File */
export const isFile: (value: unknown) => value is File = (value) =>
  typeof File !== 'undefined' && value instanceof File;

/** Checks whether a value is a Blob */
export const isBlob: (value: unknown) => value is Blob = (value) =>
  typeof Blob !== 'undefined' && value instanceof Blob;

/** Checks for Node.js Buffers without triggering bundlers to include the Buffer polyfill */
export const isBuffer: (value: unknown) => value is NodeBufferLike = (value) =>
  Boolean(
    value &&
    typeof value === 'object' &&
    (value as Partial<NodeBufferLike>).isBuffer &&
    'buffer' in (value as NodeBufferLike)
  );

/** Checks whether a value looks like a DOM WritableStream */
export const isWritableDOMStream: (
  value: unknown
) => value is WritableStream | {abort: () => unknown; getWriter: () => unknown} = (value) =>
  isObject(value) &&
  isFunction((value as WritableStream).abort) &&
  isFunction((value as WritableStream).getWriter);

/** Checks whether a value looks like a DOM ReadableStream */
export const isReadableDOMStream: (value: unknown) => value is ReadableStream = (value) =>
  (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) ||
  (isObject(value) &&
    isFunction((value as ReadableStream).tee) &&
    isFunction((value as ReadableStream).cancel) &&
    isFunction((value as ReadableStream).getReader));
// Not implemented in Firefox: && isFunction(x.pipeTo)

/** Checks whether a value looks like a Node.js writable stream */
export const isWritableNodeStream: (value: unknown) => value is NodeWritableStream = (value) =>
  isObject(value) &&
  isFunction((value as NodeWritableStream).end) &&
  isFunction((value as NodeWritableStream).write) &&
  isBoolean((value as NodeWritableStream).writable);

/** Checks whether a value looks like a Node.js readable stream */
export const isReadableNodeStream: (value: unknown) => value is Readable = (value) =>
  isObject(value) &&
  isFunction((value as Readable).read) &&
  isFunction((value as Readable).pipe) &&
  isBoolean((value as Readable).readable);

/** Checks whether a value is any readable stream (DOM or Node.js) */
export const isReadableStream: (value: unknown) => value is ReadableStreamType = (value) =>
  isReadableDOMStream(value) || isReadableNodeStream(value);

/** Checks whether a value is any writable stream (DOM or Node.js) */
export const isWritableStream: (
  value: unknown
) => value is WritableStream | NodeWritableStream = (value) =>
  isWritableDOMStream(value) || isWritableNodeStream(value);
