// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {coreApi, load, parseFile} from '@loaders.gl/core';
import {Tiles3DArchiveFileLoader, Tiles3DArchiveSource, Tiles3DLoader} from '../src';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';
const testUrl = '@loaders.gl/3d-tiles/test/data/test.3tz';
test('Tiles3DArchiveFileLoader#load uncompressed file', async () => {
  const uncompressedFile = await load(testUrl, Tiles3DArchiveFileLoader, {
    '3d-tiles-archive': {path: 'tileset.json'}
  });
  expect(uncompressedFile.byteLength, 'tileset.json has the correct length').toEqual(2339);
});
test('Tiles3DArchiveFileLoader#parseFile reads from ReadableFile', async () => {
  const arrayBuffer = await loadArrayBufferFromFile(testUrl);
  const readableFile = await createReadableFileFromBuffer(arrayBuffer);
  const uncompressedFile = await parseFile(readableFile, Tiles3DArchiveFileLoader, {
    '3d-tiles-archive': {path: 'tileset.json'}
  });
  expect(uncompressedFile.byteLength, 'tileset.json has the correct length').toEqual(2339);
});
test('Tiles3DArchiveSource#initialize reads archive through Tiles3DSource contract', async () => {
  const source = new Tiles3DArchiveSource({
    url: testUrl,
    loader: Tiles3DLoader,
    coreApi
  });
  await source.initialize();
  const tileset = await source.getRootTileset();
  expect(source.type, 'uses the 3D Tiles source type').toBe('TILES3D');
  expect(tileset.root, 'loads root tileset metadata from the archive').toBeTruthy();
});
