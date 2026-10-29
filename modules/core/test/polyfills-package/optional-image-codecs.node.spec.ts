import {expect, test, vi} from 'vitest';
vi.mock('sharp', () => {
  throw new Error('sharp is not installed');
});
// SPDX-License-Identifier: MIT

test('Node transports and native blob streams load without optional image codecs', async () => {
  await import('../../src/polyfills/index');
  expect(typeof globalThis.loaders.NodeFileSystem).toBe('function');
  const stream = new Blob(['native']).stream();
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
    'npm install sharp'
  );
  await expect(
    encodeImageNode({data: new Uint8Array(4), width: 1, height: 1}, {type: 'png'})
  ).rejects.toThrow('npm install sharp');
});
