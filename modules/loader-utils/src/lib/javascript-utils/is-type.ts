// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Readable} from 'stream';

type NodeBufferLike = {buffer: ArrayBufferLike; isBuffer: true};
type NodeWritableStream = {
  end: (...args: unknown[]) => unknown;
  write: (...args: unknown[]) => unknown;
  writable: boolean;
};

/** A DOM or Node readable stream */
export type ReadableStreamType = ReadableStream | Readable;

const isBoolean: (value: unknown) => value is boolean = (value) => typeof value === 'boolean';
const isFunction: (value: unknown) => value is (...args: unknown[]) => unknown = (value) =>
  typeof value === 'function';

export const isObject: (value: unknown) => value is Record<string, unknown> = (value) =>
  value !== null && typeof value === 'object';

export const isPureObject: (value: unknown) => value is Record<string, unknown> = (value) =>
  isObject(value) && value.constructor === {}.constructor;

export const isPromise: (value: unknown) => value is Promise<unknown> = (value) =>
  isObject(value) && isFunction((value as Promise<unknown>).then);

export const isIterable: (value: unknown) => value is Iterable<unknown> = (value) =>
  Boolean(value) && typeof (value as Iterable<unknown>)[Symbol.iterator] === 'function';

export const isAsyncIterable: (value: unknown) => value is AsyncIterable<unknown> = (value) =>
  Boolean(value) && typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function';

export const isIterator: (value: unknown) => value is Iterator<unknown> = (value) =>
  Boolean(value) && isFunction((value as Iterator<unknown>).next);

export const isResponse: (value: unknown) => value is Response = (value) =>
  (typeof Response !== 'undefined' && value instanceof Response) ||
  (isObject(value) &&
    isFunction((value as Response).arrayBuffer) &&
    isFunction((value as Response).text) &&
    isFunction((value as Response).json));

export const isFile: (value: unknown) => value is File = (value) =>
  typeof File !== 'undefined' && value instanceof File;

export const isBlob: (value: unknown) => value is Blob = (value) =>
  typeof Blob !== 'undefined' && value instanceof Blob;

/** Check for Node.js `Buffer` without triggering bundler to include buffer polyfill */
export const isBuffer: (value: unknown) => value is NodeBufferLike = (value) =>
  Boolean(
    value &&
      typeof value === 'object' &&
      (value as Partial<NodeBufferLike>).isBuffer &&
      'buffer' in (value as NodeBufferLike)
  );

export const isWritableDOMStream: (
  value: unknown
) => value is WritableStream | {abort: () => unknown; getWriter: () => unknown} = (value) =>
  isObject(value) &&
  isFunction((value as WritableStream).abort) &&
  isFunction((value as WritableStream).getWriter);

export const isReadableDOMStream: (value: unknown) => value is ReadableStream = (value) =>
  (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) ||
  (isObject(value) &&
    isFunction((value as ReadableStream).tee) &&
    isFunction((value as ReadableStream).cancel) &&
    isFunction((value as ReadableStream).getReader));
// Not implemented in Firefox: && isFunction(x.pipeTo)

export const isWritableNodeStream: (value: unknown) => value is NodeWritableStream = (value) =>
  isObject(value) &&
  isFunction((value as NodeWritableStream).end) &&
  isFunction((value as NodeWritableStream).write) &&
  isBoolean((value as NodeWritableStream).writable);

export const isReadableNodeStream: (value: unknown) => value is Readable = (value) =>
  isObject(value) &&
  isFunction((value as Readable).read) &&
  isFunction((value as Readable).pipe) &&
  isBoolean((value as Readable).readable);

export const isReadableStream: (value: unknown) => value is ReadableStreamType = (value) =>
  isReadableDOMStream(value) || isReadableNodeStream(value);

export const isWritableStream: (
  value: unknown
) => value is WritableStream | NodeWritableStream = (value) =>
  isWritableDOMStream(value) || isWritableNodeStream(value);
