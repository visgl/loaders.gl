/* global TextDecoder */
import assert from '../utils/assert';
import {decompressReadStream, concatenateReadStream} from './utils/stream-utils.node';
import Headers from './headers.node';

const isBoolean = x => typeof x === 'boolean';
const isFunction = x => typeof x === 'function';
const isObject = x => x !== null && typeof x === 'object';
const isReadableNodeStream = x =>
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
export default class Response {
  // TODO - handle ArrayBuffer, ArrayBufferView, Buffer
  constructor(body, options = {}) {
    const {headers, status = 200, statusText, url} = options;

    this._url = url;
    this._ok = status === 200;
    this._status = status; // TODO - handle errors and set status
    this._statusText = statusText;
    this._headers = new Headers(headers);
    this.bodyUsed = false;

    debugger
    this._body = isReadableNodeStream(body) ? decompressReadStream(body, headers) : body;
  }

  // Subset of Properties

  get ok() {
    return this._ok;
  }

  get status() {
    return this._status;
  }

  get statusText() {
    return this._statusText;
  }

  get url() {
    return this._url;
  }

  get headers() {
    return this._headers;
  }

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
      return this._body;
    }
    const data = await concatenateReadStream(this._body);
    return data;
  }

  async text() {
    debugger
    const arrayBuffer = await this.arrayBuffer();
    const textDecoder = new TextDecoder();
    return textDecoder.decode(arrayBuffer);
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }
}
