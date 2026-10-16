// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {PMTiles, type Source} from 'pmtiles';
import {GeoTIFFRasterSource} from '@loaders.gl/raster/geotiff/index';
import {createTiffFixture} from '../modules/raster/test/geotiff/lib/tiff/tiff-fixture';
import {createPMTilesExampleArchive} from '../examples/website/tiles/create-pmtiles';
import {createPMTilesArchiveInWorker} from '../examples/website/tiles/pmtiles-worker-client';

afterEach(() => vi.restoreAllMocks());

/** Produces a tiny source covering the first northwest tile, with one irrelevant east block. */
function createRasterFixture() {
  const latitude = 85.0511287798066;
  return createTiffFixture({
    width: 4,
    height: 2,
    tileSize: [2, 2],
    bits: [8],
    values: [[1, 2, 3, 4, 5, 6, 7, 8]],
    tags: [
      {tag: 33550, type: 12, values: [90, latitude, 0]},
      {tag: 33922, type: 12, values: [0, 0, 0, -180, latitude, 0]},
      {tag: 34735, type: 3, values: [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326]}
    ]
  });
}

/** Independent PMTiles archive inspection. */
async function readArchive(blob: Blob) {
  const bytes = await blob.arrayBuffer();
  const source: Source = {
    getKey: () => 'range-export',
    getBytes: async (offset, length) => ({data: bytes.slice(offset, offset + length)})
  };
  return new PMTiles(source);
}

const OPTIONS = {
  format: 'geotiff' as const,
  tileType: 'png' as const,
  bounds: [-180, 0, 0, 85],
  zoom: 1
};

test('GeoTIFF URLs delegate selected regions to the scan-aware source and read only HTTP ranges', async () => {
  const fixture = createRasterFixture();
  const fileBytes = new Uint8Array(fixture.data);
  // A sparse 1 GiB object, with only a small header and two four-byte blocks. No large fixture allocation.
  const fileSize = 1024 ** 3;
  let returnedBytes = 0;
  const ranges: {start: number; end: number}[] = [];
  const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, options) => {
    const range = new Headers(options?.headers).get('range');
    expect(range).toMatch(/^bytes=\d+-\d+$/);
    const [start, end] = range!.slice(6).split('-').map(Number);
    ranges.push({start, end});
    expect(end - start + 1).toBeLessThanOrEqual(1024);
    const responseBytes = new Uint8Array(end - start + 1);
    responseBytes.set(fileBytes.subarray(start, Math.min(end + 1, fileBytes.length)));
    returnedBytes += responseBytes.byteLength;
    return new Response(responseBytes, {
      status: 206,
      headers: {'content-range': `bytes ${start}-${end}/${fileSize}`, etag: '"stable"'}
    });
  });
  const readRegion = vi.spyOn(GeoTIFFRasterSource.prototype, 'getRasterForRegion');
  const finalize = vi.spyOn(GeoTIFFRasterSource.prototype, 'finalize');
  const archive = await readArchive(
    await createPMTilesExampleArchive(
      'https://example.invalid/large.cog',
      OPTIONS,
      new AbortController().signal
    )
  );
  expect(fetcher).toHaveBeenCalled();
  const [requiredBlock, excludedBlock] = fixture.blocks;
  expect(
    ranges.some(
      ({start, end}) =>
        start <= requiredBlock.offset && end >= requiredBlock.offset + requiredBlock.length - 1
    )
  ).toBe(true);
  expect(
    ranges.every(
      ({start, end}) =>
        end < excludedBlock.offset || start >= excludedBlock.offset + excludedBlock.length
    )
  ).toBe(true);
  expect(readRegion.mock.contexts[0].options.geotiff.requireContentRange).toBe(true);
  expect(readRegion.mock.contexts[0].options.geotiff.rangeSchedulerProps.maxTotalBytes).toBe(
    2 ** 32 - 1
  );
  expect(returnedBytes).toBeLessThan(4096);
  expect(readRegion).toHaveBeenCalledWith(expect.objectContaining({crs: 'EPSG:4326', bands: [0]}));
  expect(finalize).toHaveBeenCalledOnce();
  expect(await archive.getHeader()).toMatchObject({tileType: 2, numAddressedTiles: 1});
  expect(new Uint8Array((await archive.getZxy(1, 0, 0))!.data).slice(0, 4)).toEqual(
    new Uint8Array([137, 80, 78, 71])
  );
});

test('GeoTIFF URL export rejects servers ignoring Range and finalizes the source', async () => {
  const cancel = vi.fn();
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new ReadableStream({cancel})));
  const finalize = vi.spyOn(GeoTIFFRasterSource.prototype, 'finalize');
  await expect(
    createPMTilesExampleArchive(
      'https://example.invalid/no-ranges',
      OPTIONS,
      new AbortController().signal
    )
  ).rejects.toThrow('200 instead of 206');
  expect(cancel).toHaveBeenCalledOnce();
  expect(finalize).toHaveBeenCalledOnce();
});

test('GeoTIFF URLs reject unsafe schemes and embedded credentials before network access', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch');
  for (const url of ['file:///data.tif', 'https://user:pass@example.invalid/data'])
    await expect(
      createPMTilesExampleArchive(url, OPTIONS, new AbortController().signal)
    ).rejects.toThrow('HTTP(S)');
  expect(fetcher).not.toHaveBeenCalled();
});

test('local GeoTIFF inputs larger than a typed array read selected regions without a complete Blob copy', async () => {
  const input = Object.defineProperty(new Blob([createRasterFixture().data]), 'size', {
    value: 8 * 1024 ** 3
  });
  const readWholeInput = vi.spyOn(input, 'arrayBuffer');
  const archive = await readArchive(
    await createPMTilesExampleArchive(input, OPTIONS, new AbortController().signal)
  );
  expect(await archive.getHeader()).toMatchObject({tileType: 2});
  expect(readWholeInput).not.toHaveBeenCalled();
});

test('a real conversion worker opens a GeoTIFF URL through the shared HTTP range transport', async () => {
  const url = new URL(
    '/__loaders_gl_test_fixtures__/test/data/pmtiles-authoring.tif',
    location.href
  ).href;
  const archive = await readArchive(
    await createPMTilesArchiveInWorker(url, OPTIONS, new AbortController().signal)
  );
  expect(await archive.getHeader()).toMatchObject({tileType: 2, numAddressedTiles: 1});
});
