// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import test from 'test/utils/vitest-tape';
import {coreApi, load, parseFile} from '@loaders.gl/core';
import {Tiles3DArchiveFileLoader, Tiles3DArchiveSource, Tiles3DLoader} from '../src';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';

const testUrl = '@loaders.gl/3d-tiles/test/data/test.3tz';

test('Tiles3DArchiveFileLoader#load uncompressed file', async t => {
  const uncompressedFile = await load(testUrl, Tiles3DArchiveFileLoader, {
    '3d-tiles-archive': {path: 'tileset.json'}
  });
  t.deepEqual(uncompressedFile.byteLength, 2339, 'tileset.json has the correct length');
  t.end();
});

test('Tiles3DArchiveFileLoader#parseFile reads from ReadableFile', async t => {
  const arrayBuffer = await loadArrayBufferFromFile(testUrl);
  const readableFile = await createReadableFileFromBuffer(arrayBuffer);
  const uncompressedFile = await parseFile(readableFile, Tiles3DArchiveFileLoader, {
    '3d-tiles-archive': {path: 'tileset.json'}
  });

  t.deepEqual(uncompressedFile.byteLength, 2339, 'tileset.json has the correct length');
  t.end();
});

test('Tiles3DArchiveSource#initialize reads archive through Tiles3DSource contract', async t => {
  const source = new Tiles3DArchiveSource({
    url: testUrl,
    loader: Tiles3DLoader,
    coreApi
  });

  await source.initialize();
  const tileset = await source.getRootTileset();

  t.equal(source.type, 'TILES3D', 'uses the 3D Tiles source type');
  t.ok(tileset.root, 'loads root tileset metadata from the archive');
  t.end();
});
