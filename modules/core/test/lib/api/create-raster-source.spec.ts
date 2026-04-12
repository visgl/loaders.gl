import {readFile} from 'node:fs/promises';

import {expect, test} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {resolvePath} from '@loaders.gl/core';
import {GeoTIFFRasterSource, GeoTIFFSource} from '@loaders.gl/geotiff';
import {createRangeStats, RangeRequestScheduler} from '@loaders.gl/loader-utils';

const TIFF_URL = resolvePath('@loaders.gl/geotiff/test/data/gfw-azores.tif');

function createViewport(bounds: [[number, number], [number, number]], crs?: string) {
  const [[minX, minY], [maxX, maxY]] = bounds;

  return {
    id: 'viewport-0',
    width: 64,
    height: 32,
    zoom: 0,
    center: [(minX + maxX) / 2, (minY + maxY) / 2],
    crs,
    bounds,
    project: (coordinates: number[]) => coordinates,
    unprojectPosition: (position: number[]) => [position[0], position[1], position[2] || 0]
  };
}

async function createFixtureBlob() {
  const file = await readFile(TIFF_URL);
  return new Blob([file]);
}

test('createDataSource selects GeoTIFFSource from URL', () => {
  const dataSource = createDataSource('https://example.com/dataset.tif', [GeoTIFFSource], {
    geotiff: {}
  });

  expect(dataSource).toBeInstanceOf(GeoTIFFRasterSource);
});

test('createDataSource selects GeoTIFFSource from explicit core.type', () => {
  const dataSource = createDataSource(new Blob([new Uint8Array([0])]), [GeoTIFFSource], {
    core: {type: 'geotiff'},
    geotiff: {}
  });

  expect(dataSource).toBeInstanceOf(GeoTIFFRasterSource);
});

test('GeoTIFFRasterSource exposes normalized metadata', async () => {
  const source = new GeoTIFFRasterSource(await createFixtureBlob(), {geotiff: {}});
  const metadata = await source.getMetadata();

  expect(metadata.crs).toBe('EPSG:4326');
  expect(metadata.boundingBox).toEqual([
    [-33.4, 37.00000000000023],
    [-20.90000000000071, 41]
  ]);
  expect(metadata.bandCount).toBe(1);
  expect(metadata.dtype).toBe('float32');
  expect(metadata.tileSize?.width).toBe(512);
  expect(metadata.tileSize?.height).toBe(512);
  expect(metadata.overviews?.length).toBe(1);
});

test('GeoTIFFRasterSource#getRaster returns typed raster data for a viewport', async () => {
  const source = new GeoTIFFRasterSource(await createFixtureBlob(), {geotiff: {}});
  const metadata = await source.getMetadata();
  const raster = await source.getRaster({
    viewport: createViewport(metadata.boundingBox!, metadata.crs)
  });

  expect(raster.width).toBe(64);
  expect(raster.height).toBe(32);
  expect(raster.bandCount).toBe(1);
  expect(raster.dtype).toBe('float32');
  expect(raster.data).toBeInstanceOf(Float32Array);
  expect((raster.data as Float32Array).length).toBe(64 * 32);
});

test('GeoTIFFRasterSource rejects viewport CRS reprojection requests', async () => {
  const source = new GeoTIFFRasterSource(await createFixtureBlob(), {geotiff: {}});
  const metadata = await source.getMetadata();

  await expect(
    source.getRaster({
      viewport: createViewport(metadata.boundingBox!, 'EPSG:3857')
    })
  ).rejects.toThrow(/does not support reprojection/i);
});

test('GeoTIFFRasterSource uses RangeRequestScheduler for remote byte-range reads', async () => {
  const file = await readFile(TIFF_URL);
  const schedulerEvents: string[] = [];
  const rangeRequests: Array<{start: number; end: number}> = [];
  const rangeScheduler = new RangeRequestScheduler({
    batchDelayMs: 0,
    onEvent: event => schedulerEvents.push(event.type)
  });

  const mockFetch = async (_url: string, options?: RequestInit) => {
    const headers = new Headers(options?.headers);
    const rangeHeader = headers.get('Range');
    const match = rangeHeader?.match(/^bytes=(\d+)-(\d+)$/);

    if (!match) {
      return new Response(file, {status: 200});
    }

    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), file.byteLength - 1);
    rangeRequests.push({start, end});

    return new Response(file.subarray(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${file.byteLength}`
      }
    });
  };

  const source = new GeoTIFFRasterSource('https://example.com/gfw-azores.tif', {
    core: {
      loadOptions: {
        core: {
          fetch: mockFetch as typeof fetch
        }
      }
    },
    geotiff: {
      rangeScheduler
    }
  });
  const metadata = await source.getMetadata();
  const raster = await source.getRaster({
    viewport: createViewport(metadata.boundingBox!, metadata.crs)
  });

  expect(rangeRequests.length).toBeGreaterThan(0);
  expect(rangeRequests.every(request => request.end - request.start + 1 < file.byteLength)).toBe(
    true
  );
  expect(schedulerEvents).toContain('request');
  expect(schedulerEvents).toContain('response');
  expect(raster.data).toBeInstanceOf(Float32Array);
});

test('GeoTIFFRasterSource preserves rangeSchedulerProps object references', async () => {
  const file = await readFile(TIFF_URL);
  const rangeStats = createRangeStats('geotiff-range-scheduler-props');
  const mockFetch = async (_url: string, options?: RequestInit) => {
    const headers = new Headers(options?.headers);
    const rangeHeader = headers.get('Range');
    const match = rangeHeader?.match(/^bytes=(\d+)-(\d+)$/);

    if (!match) {
      return new Response(file, {status: 200});
    }

    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), file.byteLength - 1);

    return new Response(file.subarray(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${file.byteLength}`
      }
    });
  };

  const source = new GeoTIFFRasterSource('https://example.com/gfw-azores.tif', {
    core: {
      loadOptions: {
        core: {
          fetch: mockFetch as typeof fetch
        }
      }
    },
    geotiff: {
      rangeSchedulerProps: {
        batchDelayMs: 0,
        stats: rangeStats
      }
    }
  });

  await source.getMetadata();

  expect(rangeStats.get('Logical Range Requests').count).toBeGreaterThan(0);
});
