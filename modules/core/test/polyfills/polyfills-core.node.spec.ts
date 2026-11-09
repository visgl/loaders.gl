// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Readable} from 'node:stream';
import {expect, test} from 'vitest';

import {atob, btoa} from '../../src/polyfills/buffer/btoa.node';
import {addAliases, resolvePath, setPathPrefix} from '../../src/polyfills/utils/path-utils';
import {FileReaderPolyfill} from '../../src/polyfills/file/file-reader';
import {
  concatenateArrayBuffers,
  concatenateReadStream
} from '../../src/polyfills/filesystems/stream-utils.node';
import {makeNodeStream} from '../../src/polyfills/streams/make-node-stream';
import {assert} from '../../src/polyfills/utils/assert';

test('polyfills path aliases and prefixes are independent', () => {
  setPathPrefix('polyfills-root/');
  try {
    addAliases({'polyfills-fixture:': 'fixture/'});
    expect(resolvePath('polyfills-fixture:file.bin')).toBe('polyfills-root/fixture/file.bin');
  } finally {
    setPathPrefix('');
  }
});

test('FileReaderPolyfill reports text, bytes, and data URLs', async () => {
  const blob = new Blob(['hello']);
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

  expect(() => assert(false, 'bad')).toThrow('@loaders.gl/core/polyfills assertion bad');
});
