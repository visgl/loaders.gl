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

test.each([
  ['W/"fixture"', false],
  ['W/"fixture"', true],
  ['unquoted', false]
] as const)('remote archive rejects ETag %s with Last-Modified=%s and cancels its response', async (entityTag, lastModified) => {
  const canceled = vi.fn();
  const response = new Response(new ReadableStream({cancel: canceled}), {
    status: 206,
    headers: {
      'Content-Range': `bytes 0-0/${input.size}`,
      ETag: entityTag,
      ...(lastModified ? {'Last-Modified': 'Mon, 12 Oct 2026 12:00:00 GMT'} : {})
    }
  });
  await expect(
    openTileConversionArchive(
      {input: 'https://example.invalid/archive', format: '3tz'},
      16384,
      new AbortController().signal,
      async () => response
    )
  ).rejects.toMatchObject({code: 'ARCHIVE_VALIDATOR_UNSUPPORTED'});
  expect(canceled).toHaveBeenCalledOnce();
});

test('Last-Modified-only archives retain their qualified fallback identity', async () => {
  const bytes = new Uint8Array(await input.arrayBuffer());
  const fetcher: typeof fetch = async (_input, options) => {
    const match = /^bytes=(\d+)-(\d+)$/.exec(new Headers(options?.headers).get('range')!);
    const start = Number(match![1]);
    const end = Number(match![2]);
    return new Response(bytes.slice(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
        'Last-Modified': 'Mon, 12 Oct 2026 12:00:00 GMT',
        Date: 'Mon, 12 Oct 2026 13:00:00 GMT'
      }
    });
  };
  const archive = await openTileConversionArchive(
    {input: 'https://example.invalid/archive', format: '3tz'},
    16384,
    new AbortController().signal,
    fetcher
  );
  try {
    expect(archive.descriptor!.identity!.etag).toBeUndefined();
    expect(archive.descriptor!.identity!.lastModified).toBe('Mon, 12 Oct 2026 12:00:00 GMT');
    expect((await (await archive.fetcher(archive.rootUrl)).json()).root.content.uri).toBe(
      'meshes/triangle.glb'
    );
  } finally {
    await archive.close();
  }
});

test.each([
  undefined,
  'invalid',
  '2026-10-12T13:00:00Z',
  'Mon, 12 Oct 2026 12:00:59 GMT'
])('Last-Modified fallback rejects unqualified Date %s before reading ranges', async responseDate => {
  const canceled = vi.fn();
  await expect(
    openTileConversionArchive(
      {input: 'https://example.invalid/archive', format: '3tz'},
      16384,
      new AbortController().signal,
      async () =>
        new Response(new ReadableStream({cancel: canceled}), {
          status: 206,
          headers: {
            'Content-Range': `bytes 0-0/${input.size}`,
            'Last-Modified': 'Mon, 12 Oct 2026 12:00:00 GMT',
            ...(responseDate ? {Date: responseDate} : {})
          }
        })
    )
  ).rejects.toMatchObject({code: 'ARCHIVE_VALIDATOR_UNSUPPORTED'});
  expect(canceled).toHaveBeenCalledOnce();
});
