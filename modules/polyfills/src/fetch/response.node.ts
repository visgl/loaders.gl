// loaders.gl, MIT license

import {assert} from '../utils/assert';
import {decompressReadStream, concatenateReadStream} from '../filesystems/stream-utils.node';
import {Headers} from './headers.node';

const isBoolean = (x) => typeof x === 'boolean';
const isFunction = (x) => typeof x === 'function';
const isObject = (x) => x !== null && typeof x === 'object';
const isReadableNodeStream = (x) =>
  isObject(x) && isFunction(x.read) && isFunction(x.pipe) && isBoolean(x.readable);

/**
 * Polyfill for Browser Response
 *
 * Under Node.js we return a mock "fetch response object"
 * so that apps can use the same API as in the browser.
 *
 * Note: This is intended to be a "lightweight" implementation and will have limitations.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/Response
 */
import * as stream from 'stream';

export class Response {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  bodyUsed: boolean = false;
  private readonly _body;

  // TODO - handle ArrayBuffer, ArrayBufferView, Buffer
  constructor(
    body,
    options: {
      headers?;
      status?: number;
      statusText?: string;
      url: string;
    }
  ) {
    const {headers, status = 200, statusText = 'OK', url} = options || {};

    this.url = url;
    this.ok = status === 200;
    this.status = status; // TODO - handle errors and set status
    this.statusText = statusText;
    this.headers = new Headers(options?.headers || {});

    // Check for content-encoding and create a decompression stream
    if (isReadableNodeStream(body)) {
      this._body = decompressReadStream(body, headers);
    } else if (typeof body === 'string') {
      this._body = stream.Readable.from([new TextEncoder().encode(body)]);
    } else {
      this._body = stream.Readable.from([body || new ArrayBuffer(0)]);
    }
  }

  // Subset of Properties

  // Returns a readable stream to the "body" of the response (or file)
  get body() {
    assert(!this.bodyUsed);
    assert(isReadableNodeStream(this._body)); // Not implemented: conversion of ArrayBuffer etc to stream
    this.bodyUsed = true;
    return this._body;
  }

  // Subset of Methods

  async arrayBuffer() {
    if (!isReadableNodeStream(this._body)) {
      return this._body || new ArrayBuffer(0);
    }
    const data = await concatenateReadStream(this._body);
    return data;
  }

  async text() {
    const arrayBuffer = await this.arrayBuffer();
    const textDecoder = new TextDecoder();
    return textDecoder.decode(arrayBuffer);
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }

  async blob() {
    if (typeof Blob === 'undefined') {
      throw new Error('Blob polyfill not installed');
    }
    return new Blob([await this.arrayBuffer()]);
  }
}
