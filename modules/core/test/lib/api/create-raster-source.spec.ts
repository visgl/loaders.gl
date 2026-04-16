import {expect, test} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {fetchFile, resolvePath} from '@loaders.gl/core';
import {
  GeoTIFFRasterSource,
  GeoTIFFSourceLoader,
  OMETiffImageSource,
  OMETiffSourceLoader
} from '@loaders.gl/geotiff';
import {createRangeStats, RangeRequestScheduler} from '@loaders.gl/loader-utils';
import {flushMicrotasks} from '@loaders.gl/test-utils/vitest';

const TIFF_URL = resolvePath('@loaders.gl/geotiff/test/data/gfw-azores.tif');
const OME_TIFF_URL = resolvePath('@loaders.gl/geotiff/test/data/multi-channel.ome.tif');

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
  const file = await readFixtureBytes(TIFF_URL);
  return new Blob([file]);
}

async function createOmeFixtureBlob() {
  const file = await readFixtureBytes(OME_TIFF_URL);
  return new Blob([file]);
}

async function readFixtureBytes(url: string): Promise<Uint8Array> {
  const response = await fetchFile(url);
  return new Uint8Array(await response.arrayBuffer());
}

test('createDataSource selects GeoTIFFSourceLoader from URL', () => {
  const dataSource = createDataSource('https://example.com/dataset.tif', [GeoTIFFSourceLoader], {
    geotiff: {}
  });

  expect(dataSource).toBeInstanceOf(GeoTIFFRasterSource);
});

test('createDataSource selects GeoTIFFSourceLoader from explicit core.type', () => {
  const dataSource = createDataSource(new Blob([new Uint8Array([0])]), [GeoTIFFSourceLoader], {
    core: {type: 'geotiff'},
    geotiff: {}
  });

  expect(dataSource).toBeInstanceOf(GeoTIFFRasterSource);
});

test('createDataSource selects OMETiffSourceLoader from URL ahead of GeoTIFFSourceLoader', () => {
  const dataSource = createDataSource(
    'https://example.com/multi-channel.ome.tif',
    [GeoTIFFSourceLoader, OMETiffSourceLoader],
    {geotiff: {}, ometiff: {}}
  );

  expect(dataSource).toBeInstanceOf(OMETiffImageSource);
});

test('createDataSource selects OMETiffSourceLoader from explicit core.type', () => {
  const dataSource = createDataSource(new Blob([new Uint8Array([0])]), [OMETiffSourceLoader], {
    core: {type: 'ometiff'},
    ometiff: {}
  });

  expect(dataSource).toBeInstanceOf(OMETiffImageSource);
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

test('GeoTIFFRasterSource#getRaster clips oversized viewports to the source footprint', async () => {
  const source = new GeoTIFFRasterSource(await createFixtureBlob(), {geotiff: {}});
  const metadata = await source.getMetadata();
  const raster = await source.getRaster({
    viewport: createViewport(
      [
        [-60, 20],
        [0, 55]
      ],
      metadata.crs
    )
  });

  const values = raster.data as Float32Array;
  expect(raster.boundingBox).toEqual(metadata.boundingBox);
  expect(raster.width).toBeLessThan(64);
  expect(raster.height).toBeLessThan(32);
  expect(values.length).toBe(raster.width * raster.height);
});

test('OMETiffImageSource exposes normalized metadata', async () => {
  const source = new OMETiffImageSource(await createOmeFixtureBlob(), {
    core: {type: 'ometiff'},
    ometiff: {}
  });
  const metadata = await source.getMetadata();

  expect(metadata.name).toBe('multi-channel.ome.tif');
  expect(metadata.bandCount).toBe(3);
  expect(metadata.dtype).toBe('int8');
  expect(metadata.sizeT).toBe(1);
  expect(metadata.sizeZ).toBe(1);
  expect(metadata.levels.length).toBe(1);
  expect(metadata.labels).toContain('c');
});

test('OMETiffImageSource#getRaster returns multi-channel plane data', async () => {
  const file = await readFixtureBytes(OME_TIFF_URL);
  const source = new OMETiffImageSource(new Blob([file]), {ometiff: {}});
  const raster = await source.getRaster({channels: [0, 1, 2]});

  expect(raster.width).toBe(439);
  expect(raster.height).toBe(167);
  expect(raster.bandCount).toBe(3);
  expect(raster.dtype).toBe('int8');
  expect(Array.isArray(raster.data)).toBe(true);
  expect((raster.data as Int8Array[])[0]).toBeInstanceOf(Int8Array);
  expect((raster.data as Int8Array[])[0].length).toBe(439 * 167);
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
  const file = await readFixtureBytes(TIFF_URL);
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
  const file = await readFixtureBytes(TIFF_URL);
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

test('GeoTIFFRasterSource ignores late aborts without poisoning subsequent raster requests', async () => {
  const file = await readFixtureBytes(TIFF_URL);
  const mockFetch = async (_url: string, options?: RequestInit) => {
    const headers = new Headers(options?.headers);
    const rangeHeader = headers.get('Range');
    const match = rangeHeader?.match(/^bytes=(\d+)-(\d+)$/);

    await flushMicrotasks();

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
        stats: createRangeStats('geotiff-abort-recovery')
      }
    }
  });
  const metadata = await source.getMetadata();
  const abortController = new AbortController();

  const firstRequest = source
    .getRaster({
      viewport: createViewport(metadata.boundingBox!, metadata.crs),
      signal: abortController.signal
    })
    .catch(error => error);

  abortController.abort();

  const secondRequest = source.getRaster({
    viewport: createViewport(metadata.boundingBox!, metadata.crs)
  });

  const [, secondRaster] = await Promise.all([firstRequest, secondRequest]);

  expect(secondRaster.data).toBeInstanceOf(Float32Array);
});
