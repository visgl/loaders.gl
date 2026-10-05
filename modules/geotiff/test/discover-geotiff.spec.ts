// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {discoverGeoTIFF, isTIFFHeader} from '../src/discover-geotiff';

test.each([
  [[73, 73, 42, 0], true],
  [[77, 77, 0, 42], true],
  [[73, 73, 43, 0, 8, 0, 0, 0], true],
  [[77, 77, 0, 43, 0, 8, 0, 0], true],
  [[73, 73, 43, 0, 4, 0, 0, 0], false],
  [[123, 34, 105, 100], false]
])('TIFF signature %j distinguishes format only', (bytes, expected) => {
  expect(isTIFFHeader(new Uint8Array(bytes))).toBe(expected);
});

test('extensionless detection is bounded regardless of content-type hints', async () => {
  const transport = vi.fn(
    async () =>
      new Response(new Uint8Array([73, 73, 42, 0, 0, 0, 0, 0]), {
        status: 206,
        headers: {'Content-Type': 'application/octet-stream', 'Content-Range': 'bytes 0-7/1000'}
      })
  );
  expect(await discoverGeoTIFF('local-asset', {fetch: transport})).toBe(true);
  expect(new Headers(transport.mock.calls[0][1]?.headers).get('Range')).toBe('bytes=0-7');
  await expect(
    discoverGeoTIFF('local-asset', {
      fetch: async () => new Response(new Uint8Array(100), {status: 200})
    })
  ).rejects.toThrow('206');
  await expect(
    discoverGeoTIFF('local-asset', {
      fetch: async () => new Response(new Uint8Array(9), {status: 206})
    })
  ).rejects.toThrow('budget');
  const controller = new AbortController();
  controller.abort();
  await expect(
    discoverGeoTIFF('local-asset', {fetch: transport, signal: controller.signal})
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(transport).toHaveBeenCalledTimes(1);
});
