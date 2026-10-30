// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {cp, mkdtemp, rename, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import '@loaders.gl/core/polyfills';
import {expect, test} from 'vitest';
import {createDataSource, resolvePath} from '@loaders.gl/core';
import {GeoZarrRasterSource, GeoZarrSourceLoader} from '@loaders.gl/scientific/zarr';
import type {RasterBoundingBox, RasterViewport} from '@loaders.gl/core/loader-utils';

// OME-NGFF v0.4 datasets list level groups with scale-only transforms; each level group holds
// the data array, 1-D x/y coordinates and a CF `spatial_ref` grid mapping with a GDAL GeoTransform.
const FIXTURE_URL = pathToFileURL(
  resolvePath('@loaders.gl/scientific/test/zarr/data/cf-ome-multiscales.zarr')
).href;

function createSource(array: string, url = FIXTURE_URL): GeoZarrRasterSource {
  return createDataSource(url, [GeoZarrSourceLoader], {
    geozarr: {array}
  }) as GeoZarrRasterSource;
}

function createViewport(bounds: RasterBoundingBox): RasterViewport {
  const [[minimumX, minimumY], [maximumX, maximumY]] = bounds;
  return {
    id: 'cf-ome',
    width: 256,
    height: 256,
    zoom: 0,
    center: [(minimumX + maximumX) / 2, (minimumY + maximumY) / 2],
    bounds,
    project: coordinates => coordinates,
    unprojectPosition: position => [position[0], position[1], position[2] || 0]
  };
}

test('GeoZarrRasterSource discovers OME-NGFF levels georeferenced by per-level CF metadata', async () => {
  const metadata = await createSource('0/values').getMetadata();
  expect(metadata.crs).toMatch(/^PROJCS\["WGS 84 \/ UTM zone 19N"/);
  expect(metadata.boundingBox).toEqual([
    [500000, 4649992],
    [500008, 4650000]
  ]);
  expect(metadata.levels?.map(level => [level.id, level.array])).toEqual([
    ['0', '0/values'],
    ['1', '1/values']
  ]);
  expect(metadata.levels?.[1].metadata?.boundingBox).toEqual([
    [500000, 4649992],
    [500008, 4650000]
  ]);
  expect(metadata.tileGrid?.tileMatrixSet?.matrices).toEqual([
    {
      id: '0',
      resolution: 2,
      resolutionY: 2,
      origin: [500000, 4650000],
      cornerOfOrigin: 'topLeft',
      tileSize: [2, 2],
      matrixSize: [2, 2]
    },
    {
      id: '1',
      resolution: 4,
      resolutionY: 4,
      origin: [500000, 4650000],
      cornerOfOrigin: 'topLeft',
      tileSize: [2, 2],
      matrixSize: [1, 1]
    }
  ]);
});

test('GeoZarrRasterSource reads native windows from OME-NGFF level groups', async () => {
  const fine = await createSource('0/values').getRaster({
    viewport: createViewport([
      [500002, 4649994],
      [500006, 4649998]
    ])
  });
  expect([fine.width, fine.height]).toEqual([2, 2]);
  expect(Array.from(fine.data as Float32Array)).toEqual([5, 6, 9, 10]);

  const coarse = await createSource('1/values').getRaster({
    viewport: createViewport([
      [500004, 4649992],
      [500008, 4649996]
    ])
  });
  expect([coarse.width, coarse.height]).toEqual([1, 1]);
  expect(Array.from(coarse.data as Float32Array)).toEqual([103]);
});

test('GeoZarrRasterSource takes a level transform from its own coordinates, not an ancestor GeoTransform', async () => {
  // The level 0 grid mapping moves to the root, where both levels find it by CF proximity search.
  const directory = await mkdtemp(join(tmpdir(), 'cf-ome-'));
  const store = join(directory, 'store.zarr');
  try {
    await cp(fileURLToPath(FIXTURE_URL), store, {recursive: true});
    await rename(join(store, '0', 'spatial_ref'), join(store, 'spatial_ref'));
    await rm(join(store, '1', 'spatial_ref'), {recursive: true});

    const metadata = await createSource('1/values', pathToFileURL(store).href).getMetadata();
    expect(metadata.crs).toMatch(/^PROJCS\["WGS 84 \/ UTM zone 19N"/);
    expect(metadata.boundingBox).toEqual([
      [500000, 4649992],
      [500008, 4650000]
    ]);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
