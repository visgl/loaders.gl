// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoTIFFRasterSource} from '../../src/geotiff/geotiff-source';

async function createSource(): Promise<GeoTIFFRasterSource> {
  const url = new URL('./data/numeric/nodata.tif', import.meta.url);
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const source = new GeoTIFFRasterSource('https://example.invalid/nodata.tif', {});
  source.fetch = async (_url, options) => {
    const range = new Headers(options?.headers).get('Range')?.match(/^bytes=(\d+)-(\d+)$/);
    if (!range) {
      return new Response(bytes, {status: 200});
    }
    const offset = Number(range[1]);
    const end = Math.min(Number(range[2]), bytes.length - 1);
    return new Response(bytes.slice(offset, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${offset}-${end}/${bytes.length}`}
    });
  };
  return source;
}

test('resized interleaved output fills invalid pixels with noData, as planar output does', async () => {
  const source = await createSource();
  try {
    const metadata = await source.getMetadata();
    const noData = metadata.bands![0].noData!;
    expect(Number.isFinite(noData)).toBe(true);
    const parameters = {
      bounds: metadata.boundingBox!,
      crs: metadata.crs!,
      width: 8,
      height: 8
    };
    const planar = await source.getRasterForRegion({
      ...parameters,
      interleaved: false
    });
    const interleaved = await source.getRasterForRegion({
      ...parameters,
      interleaved: true
    });

    const planarData = Array.from(
      (Array.isArray(planar.data) ? planar.data[0] : planar.data) as Float32Array
    );
    const interleavedData = Array.from(interleaved.data as Float32Array);
    const mask = interleaved.validityMasks![0].data;
    const invalid = [...mask.keys()].filter(index => mask[index] === 0);
    // The fixture has invalid pixels, so the test checks the fill.
    expect(invalid.length).toBeGreaterThan(0);
    for (const index of invalid) {
      expect(interleavedData[index]).toBe(Math.fround(noData));
      expect(planarData[index]).toBe(Math.fround(noData));
    }
    expect(interleavedData).toEqual(planarData);
  } finally {
    source.destroy?.();
  }
});
