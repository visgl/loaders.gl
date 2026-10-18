// SPDX-License-Identifier: MIT
import {expect, test, vi} from 'vitest';

vi.mock('get-pixels', () => {
  throw new Error('get-pixels is not installed');
});
vi.mock('save-pixels', () => {
  throw new Error('save-pixels is not installed');
});
vi.mock('ndarray', () => {
  throw new Error('ndarray is not installed');
});

test('Node transports and native blob streams load without optional image codecs', async () => {
  await import('../../src/polyfills/index');
  const {BlobPolyfill} = await import('../../src/polyfills/file/blob');
  expect(typeof globalThis.loaders.NodeFileSystem).toBe('function');
  const stream = new BlobPolyfill(['native']).stream();
  expect(stream).toBeInstanceOf(ReadableStream);
  const reader = stream.getReader();
  expect(new TextDecoder().decode((await reader.read()).value)).toBe('native');
  expect((await reader.read()).done).toBe(true);
});

test('missing image codecs report installation instructions at the point of use', async () => {
  const {parseImageNode, encodeImageNode} = await import(
    '../../src/polyfills/images/image-codecs-node'
  );
  await expect(parseImageNode(new ArrayBuffer(0), 'image/png')).rejects.toThrow(
    'Install get-pixels'
  );
  await expect(
    encodeImageNode({data: new Uint8Array(4), width: 1, height: 1}, {type: 'png'})
  ).rejects.toThrow('Install save-pixels and ndarray');
});
