// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import '@loaders.gl/polyfills';
import {encode, encodeURLtoURL} from '@loaders.gl/core';

test('encode uses command-line writer hooks in Node.js', async () => {
  const calls: string[][] = [];
  const writer = {
    name: 'CommandWriter',
    id: 'command-writer',
    module: 'core',
    version: 'latest',
    extensions: [],
    options: {},
    encode: async () => new ArrayBuffer(0),
    encodeURLtoURL: async (inputUrl: string, outputUrl: string) => {
      calls.push([inputUrl, outputUrl]);
      return inputUrl;
    }
  } as any;

  expect(await encodeURLtoURL('/tmp/source', '/tmp/target', writer)).toBe('/tmp/source');
  const input = new Uint8Array([1, 2, 3]);
  expect(new Uint8Array(await encode(input.buffer, writer))).toEqual(input);
  expect(calls).toEqual([
    ['/tmp/source', '/tmp/target'],
    ['/tmp/input', '/tmp/output']
  ]);
});

test('encodeURLtoURL requires a command-line writer hook', async () => {
  await expect(
    encodeURLtoURL('/tmp/source', '/tmp/target', {name: 'MissingHook'} as any)
  ).rejects.toThrow();
});
