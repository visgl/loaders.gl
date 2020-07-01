export function isObject(value: any): boolean;
export function isPureObject(value: any): boolean;
export function isPromise(value: any): boolean;

export function isIterable(value: any): boolean;
export function isAsyncIterable(value: any): boolean;
export function isIterator(value: any): boolean;
export function isResponse(value: any): boolean;

export function isFile(value: any): boolean;
export function isBlob(value: any): boolean;

export function isWritableDOMStream(value: any): boolean;

export function isReadableDOMStream(value: any): boolean;

/**
 * Check for Node.js `Buffer` without triggering bundler to include polyfill
 */ 
export function isBuffer(value: any): boolean;

export function isWritableNodeStream(value: any): boolean;

export function isReadableNodeStream(value: any): boolean;

export function isReadableStream(value: any): boolean;

export function isWritableStream(value: any): boolean;
