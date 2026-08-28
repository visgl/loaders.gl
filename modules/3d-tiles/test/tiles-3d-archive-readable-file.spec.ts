// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {parse3DTilesArchive} from '../src/3d-tiles-archive/3d-tiles-archive-parser';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';
const TEST_URL = '@loaders.gl/3d-tiles/test/data/test.3tz';
test('parse3DTilesArchive#ReadableFile - file extraction', async () => {
  const arrayBuffer = await loadArrayBufferFromFile(TEST_URL);
  const archive = await parse3DTilesArchive(await createReadableFileFromBuffer(arrayBuffer));
  const tilesetJson = await archive.getFile('tileset.json');
  expect(tilesetJson.byteLength, 'reads tileset.json content').toBe(2339);
  const childTile = await archive.getFile('ll.b3dm');
  expect(childTile.byteLength, 'extracts binary tiles through hash table').toBe(9700);
  await await expect(archive.getFile('missing.b3dm')).rejects.toBeDefined();
});
