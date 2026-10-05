// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {RangeRequestScheduler, sampleRaster} from '@loaders.gl/loader-utils';
import {GeoTIFFRasterSource} from '../src/geotiff-source-loader';

/** Builds a 4 KiB float TIFF, optionally with a wider second band, using one geographic strip. */
function createFloatTIFF(mixed = false): Uint8Array {
  const bytes = new Uint8Array(mixed ? 4120 : 4104);
  const view = new DataView(bytes.buffer);
  bytes.set([73, 73, 42, 0]);
  view.setUint32(4, 8, true);
  const entries = [
    [256, 4, 1, 2],
    [257, 4, 1, 1],
    [258, 3, mixed ? 2 : 1, mixed ? (64 << 16) | 32 : 32],
    [259, 3, 1, 1],
    [262, 3, 1, 1],
    [273, 4, 1, 4096],
    [277, 3, 1, mixed ? 2 : 1],
    [278, 4, 1, 1],
    [279, 4, 1, mixed ? 24 : 8],
    [284, 3, 1, 1],
    [339, 3, mixed ? 2 : 1, mixed ? (3 << 16) | 3 : 3],
    [33550, 12, 3, 184],
    [33922, 12, 6, 208],
    [34735, 3, 16, 256]
  ];
  view.setUint16(8, entries.length, true);
  entries.forEach(([tag, type, count, value], index) => {
    const offset = 10 + index * 12;
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    view.setUint32(offset + 8, value, true);
  });
  [1, 1, 0].forEach((value, index) => view.setFloat64(184 + index * 8, value, true));
  [0, 0, 0, 0, 1, 0].forEach((value, index) => view.setFloat64(208 + index * 8, value, true));
  [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326].forEach((value, index) =>
    view.setUint16(256 + index * 2, value, true)
  );
  view.setFloat32(4096, 4, true);
  if (mixed) {
    view.setFloat64(4100, 1e100, true);
    view.setFloat32(4108, 8, true);
    view.setFloat64(4112, 2e100, true);
  } else {
    view.setFloat32(4100, 8, true);
  }
  return bytes;
}

test('real GeoTIFF shared ranges preserve active subscribers, cache bounds, reasons and borrowed scheduler', async () => {
  const bytes = createFloatTIFF();
  const scheduler = new RangeRequestScheduler({batchDelayMs: 0});
  const source = new GeoTIFFRasterSource('https://example.invalid/asset', {
    geotiff: {
      rangeScheduler: scheduler,
      rangeCacheProps: {maxEntries: 2, maxBytes: 2048}
    }
  });
  let dataRequests = 0;
  let abortedTransfers = 0;
  let transportSignal: AbortSignal | undefined;
  let releaseTransfer: (() => void) | undefined;
  let reportStarted: (() => void) | undefined;
  source.fetch = async (_url, options) => {
    const range = new Headers(options?.headers).get('Range')!.match(/^bytes=(\d+)-(\d+)$/)!;
    const offset = Number(range[1]);
    const end = Math.min(Number(range[2]), bytes.length - 1);
    if (offset >= 4096) {
      dataRequests++;
      transportSignal = options!.signal!;
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          abortedTransfers++;
          reject(transportSignal!.reason);
        };
        transportSignal!.addEventListener('abort', abort, {once: true});
        releaseTransfer = () => {
          transportSignal!.removeEventListener('abort', abort);
          resolve();
        };
        reportStarted?.();
      });
    }
    return new Response(bytes.slice(offset, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${offset}-${end}/${bytes.length}`}
    });
  };
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBe('EPSG:4326');
  expect(metadata.bands?.[0].dtype).toBe('float32');
  const parameters = {bounds: metadata.boundingBox!, crs: metadata.crs!, width: 2, height: 1};
  const firstController = new AbortController();
  const secondController = new AbortController();
  const started = new Promise<void>(resolve => {
    reportStarted = resolve;
  });
  const first = source.getRasterForRegion({...parameters, signal: firstController.signal});
  const second = source.getRasterForRegion({...parameters, signal: secondController.signal});
  await started;
  const reason = new DOMException('obsolete coverage', 'AbortError');
  firstController.abort(reason);
  await expect(first).rejects.toBe(reason);
  expect(transportSignal!.aborted).toBe(false);
  releaseTransfer!();
  const raster = await second;
  expect(sampleRaster(raster, [0, 0]).values).toEqual([4]);
  expect(sampleRaster(raster, [1, 0]).values).toEqual([8]);
  await source.getRasterForRegion(parameters);
  expect(dataRequests).toBe(1);
  expect((source as any)._rangeCache.byteLength).toBeLessThanOrEqual(2048);
  (source as any)._rangeCache.clear();
  const lastStarted = new Promise<void>(resolve => {
    reportStarted = resolve;
  });
  const last = source.getRasterForRegion({...parameters, signal: secondController.signal});
  await lastStarted;
  secondController.abort(reason);
  await expect(last).rejects.toBe(reason);
  await Promise.resolve();
  expect(transportSignal!.aborted).toBe(true);
  expect(abortedTransfers).toBe(1);
  source.finalize();
  await expect(
    scheduler.scheduleRequest({
      sourceId: 'borrowed',
      offset: 0,
      length: 1,
      fetchRange: async () => new ArrayBuffer(1)
    })
  ).resolves.toHaveProperty('byteLength', 1);
  scheduler.finalize();
});

test.each([
  ['revision', 'revision changed'],
  ['placement', 'Contradictory'],
  ['oversized', 'byte budget'],
  ['truncated', 'expected 8']
])('real GeoTIFF rejects %s responses before publishing scientific values', async (failure, message) => {
  const bytes = createFloatTIFF();
  const source = new GeoTIFFRasterSource('https://example.invalid/asset', {});
  source.fetch = async (_url, options) => {
    const range = new Headers(options?.headers).get('Range')!.match(/^bytes=(\d+)-(\d+)$/)!;
    const offset = Number(range[1]);
    const end = Math.min(Number(range[2]), bytes.length - 1);
    const dataRequest = offset >= 4096;
    const body =
      dataRequest && failure === 'oversized'
        ? new Uint8Array(9)
        : bytes.slice(offset, dataRequest && failure === 'truncated' ? end : end + 1);
    return new Response(body, {
      status: 206,
      headers: {
        'Content-Range':
          dataRequest && failure === 'placement'
            ? `bytes ${offset - 1}-${end - 1}/${bytes.length}`
            : `bytes ${offset}-${end}/${bytes.length}`,
        ETag: dataRequest && failure === 'revision' ? '"second"' : '"first"'
      }
    });
  };
  try {
    const metadata = await source.getMetadata();
    await expect(
      source.getRasterForRegion({
        bounds: metadata.boundingBox!,
        crs: metadata.crs!,
        width: 2,
        height: 1
      })
    ).rejects.toThrow(message);
    if (failure === 'revision') await expect(source.getMetadata()).rejects.toThrow('recreate');
  } finally {
    source.finalize();
  }
});

test('real GeoTIFF byte-cache retention can be disabled', async () => {
  const bytes = createFloatTIFF();
  const source = new GeoTIFFRasterSource('https://example.invalid/asset', {
    geotiff: {
      rangeCacheProps: {maxEntries: 0, maxBytes: 0}
    }
  });
  let dataRequests = 0;
  source.fetch = async (_url, options) => {
    const range = new Headers(options?.headers).get('Range')!.match(/^bytes=(\d+)-(\d+)$/)!;
    const offset = Number(range[1]);
    const end = Math.min(Number(range[2]), bytes.length - 1);
    if (offset >= 4096) dataRequests++;
    return new Response(bytes.slice(offset, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${offset}-${end}/${bytes.length}`}
    });
  };
  try {
    const metadata = await source.getMetadata();
    const parameters = {bounds: metadata.boundingBox!, crs: metadata.crs!, width: 2, height: 1};
    await source.getRasterForRegion(parameters);
    await source.getRasterForRegion(parameters);
    expect(dataRequests).toBe(2);
    expect((source as any)._rangeCache.byteLength).toBe(0);
  } finally {
    source.finalize();
  }
});

test('real mixed GeoTIFF preserves selected representations and preflights native allocations', async () => {
  const bytes = createFloatTIFF(true);
  const source = new GeoTIFFRasterSource('https://example.invalid/mixed', {});
  source.fetch = async (_url, options) => {
    const range = new Headers(options?.headers).get('Range')!.match(/^bytes=(\d+)-(\d+)$/)!;
    const offset = Number(range[1]);
    const end = Math.min(Number(range[2]), bytes.length - 1);
    return new Response(bytes.slice(offset, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${offset}-${end}/${bytes.length}`}
    });
  };
  try {
    const metadata = await source.getMetadata();
    expect(metadata.bands?.map(band => band.dtype)).toEqual(['float32', 'float64']);
    const state = await (source as any)._initPromise;
    const readRasters = vi.spyOn(state.images[0], 'readRasters');
    const parameters = {bounds: metadata.boundingBox!, crs: metadata.crs!, width: 2, height: 1};
    const selected = await source.getRasterForRegion({
      ...parameters,
      bands: [0],
      interleaved: true,
      maxDecodedBytes: 50
    });
    expect(selected.dtype).toBe('float32');
    expect(selected.data).toBeInstanceOf(Float32Array);
    expect(Array.from(selected.data as Float32Array)).toEqual([4, 8]);
    await expect(
      source.getRasterForRegion({...parameters, bands: [0], interleaved: true, maxDecodedBytes: 49})
    ).rejects.toThrow('Native decode');
    expect(readRasters).toHaveBeenCalledTimes(1);
    const mixed = await source.getRasterForRegion({...parameters, maxDecodedBytes: 100});
    expect(mixed.dtype).toBe('mixed');
    expect(mixed.data[0]).toBeInstanceOf(Float32Array);
    expect(mixed.data[1]).toBeInstanceOf(Float64Array);
    expect(sampleRaster(mixed, [1, 0]).values).toEqual([8, 2e100]);
    await expect(source.getRasterForRegion({...parameters, interleaved: true})).rejects.toThrow(
      'planar'
    );
    expect(readRasters).toHaveBeenCalledTimes(2);
  } finally {
    source.finalize();
  }
});
