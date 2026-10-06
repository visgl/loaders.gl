// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createTileConversionArchive} from '@loaders.gl/tile-converter/v5/browser';
import {createTileConversionArchive as createRootArchive} from '@loaders.gl/tile-converter/v5';
import {GZipCompressor} from '@loaders.gl/compression';
import JSZip from 'jszip';

// Format owners test archive structure exhaustively; this only checks converter handoff/diagnostics.
test.each(['3tz', 'slpk'] as const)('converter hands off a bounded %s Blob', async format => {
  expect(createRootArchive).toBe(createTileConversionArchive);
  const path = format === '3tz' ? 'tileset.json' : '3dSceneLayer.json.gz';
  const text = new TextEncoder().encode('{}').buffer;
  const bytes = format === '3tz' ? text : await new GZipCompressor().compress(text);
  const files = [{resourceId: path, blob: new Blob([bytes])}];
  const archive = await createTileConversionArchive(files, {format, maxArchiveBytes: 1000});
  expect(archive.type).toBe(
    format === '3tz' ? 'application/vnd.maxar.archive.3tz+zip' : 'application/octet-stream'
  );
  const zip = await JSZip.loadAsync(await archive.arrayBuffer(), {checkCRC32: true});
  expect(await zip.file(path)!.async('arraybuffer')).toEqual(bytes);
  expect(Object.keys(zip.files)).toEqual([
    path,
    format === '3tz' ? '@3dtilesIndex1@' : '@specialIndexFileHASH128@'
  ]);
  await expect(
    createTileConversionArchive(files, {format, maxArchiveBytes: archive.size - 1})
  ).rejects.toThrow('byte limit');
});

test('converter archive rejects invalid budget, format, and duplicate resource IDs', async () => {
  await expect(
    createTileConversionArchive([], {format: '3tz', maxArchiveBytes: -1})
  ).rejects.toMatchObject({code: 'INVALID_ARCHIVE_BYTE_LIMIT'});
  await expect(
    createTileConversionArchive([], {format: '3tz', maxArchiveBytes: NaN})
  ).rejects.toMatchObject({code: 'INVALID_ARCHIVE_BYTE_LIMIT'});
  await expect(
    createTileConversionArchive([], {format: 'zip' as '3tz', maxArchiveBytes: 1000})
  ).rejects.toMatchObject({code: 'INVALID_ARCHIVE_FORMAT'});
  const file = {resourceId: 'tileset.json', blob: new Blob(['{}'])};
  await expect(
    createTileConversionArchive([file, file], {format: '3tz', maxArchiveBytes: 1000})
  ).rejects.toMatchObject({code: 'DUPLICATE_ARCHIVE_RESOURCE'});
});

test('selecting SLPK does not silently relabel 3D Tiles resources', async () => {
  await expect(
    createTileConversionArchive([{resourceId: 'tileset.json', blob: new Blob(['{}'])}], {
      format: 'slpk',
      maxArchiveBytes: 1000
    })
  ).rejects.toThrow('root 3dSceneLayer.json.gz');
});

test.each([
  '3tz',
  'slpk'
] as const)('converter forwards cancellation to %s packaging', async format => {
  const resourceId = format === '3tz' ? 'tileset.json' : '3dSceneLayer.json.gz';
  const reason = new Error('cancel packaging');
  await expect(
    createTileConversionArchive([{resourceId, blob: new Blob()}], {
      format,
      maxArchiveBytes: 1000,
      signal: AbortSignal.abort(reason)
    })
  ).rejects.toBe(reason);
});
