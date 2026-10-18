// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ArrayBufferFile} from '@loaders.gl/loader-utils';
import {DATA_ARRAY} from '@loaders.gl/tiles-3d/i3s/test/data/test.zip';
const localHeaderSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
import {
  createReadableFileFromBuffer,
  createReadableFileFromPath,
  createBrowserReadableFile
} from 'test/utils/readable-files';
const SLPK_URL = '@loaders.gl/tiles-3d/i3s/test/data/DA12_subset.slpk';

test('ReadableFile#ArrayBufferFile range reads and stat', async () => {
  const arrayBuffer = Uint8Array.from([10, 20, 30, 40, 50]).buffer;
  const readableFile = new ArrayBufferFile(arrayBuffer);

  expect(readableFile.handle, 'retains the original ArrayBuffer').toBe(arrayBuffer);
  expect(new Uint8Array(await readableFile.read()), 'reads all bytes').toEqual(
    Uint8Array.from([10, 20, 30, 40, 50])
  );
  expect(new Uint8Array(await readableFile.read(1, 3)), 'reads a byte range').toEqual(
    Uint8Array.from([20, 30, 40])
  );
  expect(await readableFile.stat(), 'reports the in-memory file size').toEqual({
    size: 5,
    bigsize: 5n,
    isDirectory: false
  });

  const abortController = new AbortController();
  abortController.abort();
  await expect(readableFile.read(0, 1, abortController.signal)).rejects.toThrow('Request aborted');
  await readableFile.close();
});

test('ReadableFile#BlobFile range reads and stat', async () => {
  const readableFile = createBrowserReadableFile(DATA_ARRAY.buffer);
  const size = readableFile.bigsize;
  expect(size, 'returns expected bigsize').toBe(BigInt(DATA_ARRAY.byteLength));
  const prefix = await readableFile.read(0n, 4);
  expect(new Uint8Array(prefix), 'reads the zip signature').toEqual(localHeaderSignature);
  const stat = await readableFile.stat();
  expect(stat.size, 'stat.size matches buffer length').toBe(DATA_ARRAY.byteLength);
  expect(stat.bigsize, 'stat.bigsize matches buffer length').toBe(BigInt(DATA_ARRAY.byteLength));
});
// Node-like coverage only executes when NodeFile is available
if (!globalThis.window) {
  test('ReadableFile#NodeFile range reads and stat', async () => {
    const readableFile = await createReadableFileFromPath(SLPK_URL);
    const stat = await readableFile.stat();
    expect(stat.size > 0, 'stat returns a size').toBeTruthy();
    const header = await readRange(readableFile, 0n, 4n);
    expect(new Uint8Array(header), 'reads header bytes from disk').toEqual(localHeaderSignature);
    await readableFile.close?.();
  });
}
test('ReadableFile#buffer adapter supports slices', async () => {
  const readableFile = await createReadableFileFromBuffer(DATA_ARRAY.buffer);
  const midSection = await readableFile.read(2n, 4);
  expect(new Uint8Array(midSection), 'reads arbitrary slice').toEqual(
    new Uint8Array(DATA_ARRAY.slice(2, 6))
  );
  const trailing = await readableFile.read(BigInt(DATA_ARRAY.byteLength - 4), 4);
  expect(new Uint8Array(trailing), 'reads trailing bytes').toEqual(
    new Uint8Array(DATA_ARRAY.slice(-4))
  );
});
