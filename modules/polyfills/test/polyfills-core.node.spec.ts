// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Readable} from 'node:stream';
import {expect, test} from 'vitest';

import {atob, btoa} from '../src/buffer/btoa.node';
import {decodeDataUri} from '../src/fetch/decode-data-uri';
import {Headers} from '../src/fetch/headers-polyfill';
import {Response} from '../src/fetch/response-polyfill';
import {BlobPolyfill} from '../src/file/blob';
import {FilePolyfill} from '../src/file/file';
import {FileReaderPolyfill} from '../src/file/file-reader';
import {concatenateArrayBuffers, concatenateReadStream} from '../src/filesystems/stream-utils.node';
import {makeNodeStream} from '../src/streams/make-node-stream';
import {assert} from '../src/utils/assert';

test('HeadersPolyfill normalizes and iterates header values', () => {
  const headers = new Headers([
    ['Accept', 'application/json'],
    ['Accept', 'text/plain']
  ]);
  headers.set('X-Test', 42);
  expect(headers.get('accept')).toBe('application/json, text/plain');
  expect(headers.get('X-TEST')).toBe('42');
  expect([...headers]).toEqual([
    ['accept', 'application/json, text/plain'],
    ['x-test', '42']
  ]);
  headers.delete('x-test');
  expect(headers.has('X-Test')).toBe(false);
  expect(() => headers.set('', 'invalid')).toThrow(TypeError);
});

test('decodeDataUri handles encoded and base64 data', () => {
  expect(new TextDecoder().decode(decodeDataUri('data:text/plain,hello%20world').arrayBuffer)).toBe(
    'hello world'
  );
  expect(decodeDataUri('data:;charset=utf-8,hello').mimeType).toBe('text/plain;charset=utf-8');
  expect(
    new TextDecoder().decode(decodeDataUri('data:text/plain;base64,aGVsbG8=').arrayBuffer)
  ).toBe('hello');
});

test('ResponsePolyfill reads strings, JSON, streams, and compressed bodies', async () => {
  const response = new Response('{"answer":42}', {url: 'memory:'});
  expect(response.ok).toBe(true);
  expect(await response.json()).toEqual({answer: 42});
  expect(await new Response('hello', {url: 'memory:'}).text()).toBe('hello');

  const streamResponse = new Response(Readable.from([Buffer.from('streamed')]), {url: 'memory:'});
  expect(new TextDecoder().decode(await streamResponse.arrayBuffer())).toBe('streamed');
  expect(await new Response(new Uint8Array([1, 2]), {url: 'memory:'}).blob()).toBeInstanceOf(Blob);
});

test('BlobPolyfill handles parts, slices, streams, and File metadata', async () => {
  const blob = new BlobPolyfill(['hello', new Uint8Array([32, 119, 111, 114, 108, 100])], {
    type: 'TEXT/PLAIN'
  });
  expect(blob.size).toBe(11);
  expect(blob.type).toBe('text/plain');
  expect(await blob.text()).toBe('hello world');
  expect(await blob.slice(-5).text()).toBe('world');
  const streamedBytes: number[] = [];
  for await (const chunk of blob.stream()) {
    streamedBytes.push(...chunk);
  }
  expect(new Uint8Array(streamedBytes)).toEqual(new Uint8Array(await blob.arrayBuffer()));

  const file = new FilePolyfill(['data'], 'folder/name.txt', {lastModified: 123});
  expect(file.name).toBe('folder:name.txt');
  expect(file.lastModified).toBe(123);
  expect(file[Symbol.toStringTag]).toBe('File');
});

test('FileReaderPolyfill reports text, bytes, and data URLs', async () => {
  const blob = new BlobPolyfill(['hello']);
  const reader = new FileReaderPolyfill();
  const results: unknown[] = [];
  reader.onload = event => results.push(event.target.result);
  await reader.readAsText(blob);
  await reader.readAsArrayBuffer(blob);
  await reader.readAsDataURL(blob);
  expect(results[0]).toBe('hello');
  expect(new TextDecoder().decode(results[1] as ArrayBuffer)).toBe('hello');
  expect(results[2]).toMatch(/^data:\/\/;base64,/);
  await expect(reader.readAsBinaryString(blob)).rejects.toThrow('Not implemented');
});

test('stream and binary helpers preserve data and errors', async () => {
  expect(atob('hello')).toBe('aGVsbG8=');
  expect(btoa('aGVsbG8=')).toBe('hello');
  expect(
    new Uint8Array(concatenateArrayBuffers([new Uint8Array([1]), new ArrayBuffer(2)])).length
  ).toBe(3);

  const stream = makeNodeStream(
    (async function* () {
      yield new Uint8Array([1, 2]);
      yield new Uint8Array([3]);
    })()
  );
  expect([
    ...(await new Promise<Buffer[]>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(chunks));
      stream.on('error', reject);
    }))
  ]).toHaveLength(2);

  expect(() => assert(false, 'bad')).toThrow('@loaders.gl/polyfills assertion bad');
});
