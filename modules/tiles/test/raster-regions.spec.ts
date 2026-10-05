// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {
  NumericRasterData,
  RasterRegionParameters,
  RasterRegionSource
} from '@loaders.gl/loader-utils';
import {createRegionExample} from '../../../examples/experimental/raster-regions/index';

/** Supplies a float region with raw and physical identify metadata. */
function createPayload(region: RasterRegionParameters): NumericRasterData {
  return {
    data: new Float32Array([0, 4]),
    dtype: 'float32',
    interleaved: true,
    width: 2,
    height: 1,
    bandCount: 1,
    crs: region.crs,
    boundingBox: region.bounds,
    transform: [
      (region.bounds[1][0] - region.bounds[0][0]) / 2,
      0,
      region.bounds[0][0],
      0,
      region.bounds[1][1] - region.bounds[0][1],
      region.bounds[0][1]
    ],
    pixelRegistration: 'area',
    bands: [{index: 3, dtype: 'float32', scale: 2, offset: 1}]
  };
}

test('independent consumer preserves dateline and polar placements through projection changes', async () => {
  const finalized = vi.fn();
  const metadata = {
    name: 'memory',
    width: 2,
    height: 1,
    bandCount: 1,
    dtype: 'float32',
    noData: null
  };
  const pending: (() => void)[] = [];
  const source = {
    getMetadata: async () => metadata,
    finalize: finalized,
    getRasterForRegion: async (region: RasterRegionParameters) => {
      await new Promise<void>(resolve => pending.push(resolve));
      region.signal?.throwIfAborted();
      return createPayload(region);
    }
  } as unknown as RasterRegionSource;
  let regions: RasterRegionParameters[] = [
    {
      bounds: [
        [170, -90],
        [180, 90]
      ],
      crs: 'EPSG:4326',
      width: 2,
      height: 1
    },
    {
      bounds: [
        [-180, -90],
        [-170, 90]
      ],
      crs: 'EPSG:4326',
      width: 2,
      height: 1
    }
  ];
  const example = createRegionExample(source, () => regions);
  const accepted = new Promise<NumericRasterData>(resolve =>
    example.manager.subscribe({
      onRasterLoad: request => resolve(request.raster)
    })
  );
  example.update();
  regions = regions.map(region => ({...region, crs: 'CRS:84'}));
  example.update();
  pending.splice(0).forEach(resolve => resolve());
  const result = await accepted;
  const placements = result.metadata!.regions as NumericRasterData[];
  expect(placements.map(raster => raster.boundingBox)).toEqual(
    regions.map(region => region.bounds)
  );
  expect(placements.map(raster => raster.crs)).toEqual(['CRS:84', 'CRS:84']);
  expect(example.identify(placements[0], [172.5, 0], 'CRS:84', 'physical').values).toEqual([1]);
  expect(example.identify(placements[0], [-172.5, 0], 'CRS:84').miss).toBe(true);
  expect(example.counters).toEqual({started: 2, accepted: 1, canceled: 1});
  example.finalize();
  expect(finalized).not.toHaveBeenCalled();
});

test('failed split coverage cancels unfinished siblings and recovers without finalizing the borrowed source', async () => {
  let shouldFail = true;
  let abortedTransfers = 0;
  const failure = new Error('missing split');
  const finalized = vi.fn();
  const regions: RasterRegionParameters[] = [
    {
      bounds: [
        [170, -90],
        [180, 90]
      ],
      crs: 'EPSG:4326',
      width: 2,
      height: 1
    },
    {
      bounds: [
        [-180, -90],
        [-170, 90]
      ],
      crs: 'EPSG:4326',
      width: 2,
      height: 1
    }
  ];
  const source = {
    getMetadata: async () => ({width: 2, height: 1, bandCount: 1, dtype: 'float32'}),
    finalize: finalized,
    getRasterForRegion: async (region: RasterRegionParameters) => {
      if (shouldFail && region.bounds[0][0] < 0) throw failure;
      if (shouldFail)
        await new Promise<void>((_resolve, reject) => {
          region.signal!.addEventListener(
            'abort',
            () => {
              abortedTransfers++;
              reject(region.signal!.reason);
            },
            {once: true}
          );
        });
      return createPayload(region);
    }
  } as unknown as RasterRegionSource;
  const example = createRegionExample(source, () => regions);
  const settled = new Promise<void>(resolve =>
    example.manager.subscribe({onLoadingStateChange: loading => !loading && resolve()})
  );
  const failed = new Promise<void>(resolve =>
    example.manager.subscribe({
      onRasterLoadError: (_requestId, error) => {
        expect(error).toBe(failure);
        resolve();
      }
    })
  );
  example.update();
  await failed;
  expect(abortedTransfers).toBe(1);
  expect(example.counters.accepted).toBe(0);
  await settled;
  shouldFail = false;
  const accepted = new Promise<NumericRasterData>(resolve =>
    example.manager.subscribe({onRasterLoad: request => resolve(request.raster)})
  );
  example.update();
  expect(((await accepted).metadata!.regions as NumericRasterData[]).length).toBe(2);
  expect(example.counters.accepted).toBe(1);
  example.finalize();
  expect(finalized).not.toHaveBeenCalled();
});
