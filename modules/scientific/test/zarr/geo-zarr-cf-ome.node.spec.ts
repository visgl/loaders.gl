// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {chmod, cp, mkdtemp, readFile, rename, rm, writeFile} from 'node:fs/promises';
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

/** Copies the fixture to a temporary store and runs `body` on it. */
async function withStoreCopy(body: (store: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'cf-ome-'));
  const store = join(directory, 'store.zarr');
  try {
    await cp(fileURLToPath(FIXTURE_URL), store, {recursive: true});
    await body(store);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}

/** Edits the metadata of one node, in its own zarr.json and in the root consolidated metadata. */
async function editNode(
  store: string,
  path: string,
  edit: (metadata: Record<string, any>) => void
): Promise<void> {
  const nodeFile = join(store, path, 'zarr.json');
  const node = JSON.parse(await readFile(nodeFile, 'utf8'));
  edit(node);
  await writeFile(nodeFile, JSON.stringify(node));
  const rootFile = join(store, 'zarr.json');
  const root = JSON.parse(await readFile(rootFile, 'utf8'));
  edit(root.consolidated_metadata.metadata[path]);
  await writeFile(rootFile, JSON.stringify(root));
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

test('GeoZarrRasterSource discovers OME-NGFF levels whose CRS is declared only on each level group', async () => {
  await withStoreCopy(async store => {
    for (const [level, cellSize] of [
      ['0', 2],
      ['1', 4]
    ] as const) {
      await editNode(store, `${level}/values`, node => {
        node.attributes = {};
      });
      await editNode(store, level, node => {
        node.attributes = {
          'proj:code': 'EPSG:32619',
          'spatial:dimensions': ['y', 'x'],
          'spatial:transform': [cellSize, 0, 500000, 0, -cellSize, 4650000]
        };
      });
    }

    const metadata = await createSource('0/values', pathToFileURL(store).href).getMetadata();
    expect(metadata.crs).toBe('EPSG:32619');
    expect(metadata.levels?.map(level => level.metadata?.crs)).toEqual([
      'EPSG:32619',
      'EPSG:32619'
    ]);
    expect(metadata.tileGrid?.tileMatrixSet?.crs).toBe('EPSG:32619');
    expect(metadata.tileGrid?.tileMatrixSet?.matrices.map(matrix => matrix.resolution)).toEqual([
      2, 4
    ]);
  });
});

// A root user can read a file with mode 000, so this test needs an ordinary user.
test.skipIf(process.getuid?.() === 0)(
  'GeoZarrRasterSource does not replace an unreadable local grid mapping with an ancestor',
  async () => {
    await withStoreCopy(async store => {
      // A valid ancestor grid mapping exists, but the level's own grid mapping cannot be read.
      await cp(join(store, '0', 'spatial_ref'), join(store, 'spatial_ref'), {recursive: true});
      const root = JSON.parse(await readFile(join(store, 'zarr.json'), 'utf8'));
      delete root.consolidated_metadata;
      await writeFile(join(store, 'zarr.json'), JSON.stringify(root));
      await chmod(join(store, '1', 'spatial_ref', 'zarr.json'), 0o000);

      const source = createDataSource(pathToFileURL(store).href, [GeoZarrSourceLoader], {
        zarr: {requireConsolidatedMetadata: false},
        geozarr: {array: '1/values'}
      }) as GeoZarrRasterSource;
      await expect(source.getMetadata()).rejects.toThrow();
    });
  }
);
