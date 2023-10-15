import {ReadableStream as WSPReadableStream} from 'web-streams-polyfill';

// Want a polyfill, but please don't install it
// @ts-ignore
delete globalThis.ReadableStream;

// @ts-ignore
export class ReadableStreamPolyfill<T> extends WSPReadableStream<T> implements ReadableStream {}
