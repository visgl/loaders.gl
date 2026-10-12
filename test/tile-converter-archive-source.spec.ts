// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {BlobFile} from '@loaders.gl/loader-utils';
import {
  createTileConversionArchiveTransport,
  openTileConversionArchive
} from '@loaders.gl/tile-converter/v5/adapters';
import {createTiles3DConversionArchive} from './utils/tile-browser-archive-conversion';

let input: File;
beforeAll(async () => {
  input = await createTiles3DConversionArchive();
});

test('portable archive transport reuses indexed reads and closes its owned file exactly once', async () => {
  const file = new BlobFile(input);
  const close = vi.spyOn(file, 'close');
  const archive = await createTileConversionArchiveTransport(
    file,
    '3tz',
    16384,
    new AbortController().signal
  );
  const metadata = await archive.fetcher(archive.rootUrl);
  expect((await metadata.json()).root.content.uri).toBe('meshes/triangle.glb');
  await Promise.all([archive.close(), archive.close()]);
  expect(close).toHaveBeenCalledOnce();
  await expect(archive.fetcher(archive.rootUrl)).rejects.toMatchObject({
    code: 'ARCHIVE_SOURCE_CLOSED'
  });
});

test.each([
  'https://other.invalid/tileset.json',
  'https://conversion.invalid/outside',
  'https://conversion.invalid/input.3tz/%2e%2e%2fescape'
])('portable archive requests remain confined: %s', async url => {
  const archive = await openTileConversionArchive(
    {input, format: '3tz'},
    16384,
    new AbortController().signal
  );
  try {
    await expect(archive.fetcher(url)).rejects.toThrow(/inside|escape/);
  } finally {
    await archive.close();
  }
});

test('failed archive initialization releases injected storage and validates its byte budget', async () => {
  const file = new BlobFile(input);
  const close = vi.spyOn(file, 'close');
  await expect(
    createTileConversionArchiveTransport(file, '3tz', 1, new AbortController().signal)
  ).rejects.toThrow(/16 MiB/);
  expect(close).toHaveBeenCalledOnce();
});
