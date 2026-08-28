// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  _BrowserFileSystem as BrowserFileSystem,
  fetchFile,
  load,
  loadInBatches,
  selectLoader
} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {Proj4Projection} from '@math.gl/proj4';

const SHAPEFILE_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';

test.each([
  'points',
  'polygons',
  'boolean-property',
  'utf8-property'
])('ShapefileLoader#loads representative %s fixture', async fixtureName => {
  const table = await load(`${SHAPEFILE_DATA_FOLDER}/${fixtureName}.shp`, ShapefileLoader, {
    core: {worker: false},
    shapefile: {shape: 'v3'}
  });
  const expected = await (await fetchFile(`${SHAPEFILE_DATA_FOLDER}/${fixtureName}.json`)).json();

  expect(table.data).toEqual(expected.features);
});

test('ShapefileLoader#loads browser File objects', async () => {
  const fixtureName = 'points';
  const files = await getFixtureFiles(fixtureName);
  const fileSystem = new BrowserFileSystem(files);
  const table = await load(`${fixtureName}.shp`, ShapefileLoader, {
    core: {worker: false},
    fetch: fileSystem.fetch,
    shapefile: {shape: 'v3'}
  });

  expect(table.data.length).toBeGreaterThan(0);
});

test('ShapefileLoader#streams a representative fixture', async () => {
  const fixtureName = 'points';
  const batches = await loadInBatches(
    `${SHAPEFILE_DATA_FOLDER}/${fixtureName}.shp`,
    ShapefileLoader,
    {core: {worker: false}, shapefile: {shape: 'v3'}}
  );
  const tables = [];
  for await (const batch of batches) {
    if (batch?.data) {
      tables.push(batch);
    }
  }

  expect(tables).toHaveLength(1);
  expect(tables[0].data.length).toBeGreaterThan(0);
});

test('ShapefileLoader#reprojects points', async () => {
  const fixtureName = 'points';
  const table = await load(`${SHAPEFILE_DATA_FOLDER}/${fixtureName}.shp`, ShapefileLoader, {
    core: {worker: false},
    shapefile: {shape: 'v3'},
    gis: {reproject: true, _targetCrs: 'EPSG:3857'}
  });
  const expected = await (await fetchFile(`${SHAPEFILE_DATA_FOLDER}/${fixtureName}.json`)).json();
  const projection = new Proj4Projection({from: 'WGS84', to: 'EPSG:3857'});

  expect(table.data[0].geometry.coordinates).toEqual(
    projection.project(expected.features[0].geometry.coordinates)
  );
});

test.each([
  'v3',
  'arrow-table'
] as const)('ShapefileLoader#rejects %s reprojection without a .prj sidecar', async shape => {
  const response = await fetchFile(`${SHAPEFILE_DATA_FOLDER}/points.shp`);
  const arrayBuffer = await response.arrayBuffer();

  await expect(
    load(arrayBuffer, ShapefileLoader, {
      core: {worker: false},
      shapefile: {shape},
      gis: {reproject: true, _targetCrs: 'EPSG:3857'}
    })
  ).rejects.toThrow('Shapefile reprojection requires a source CRS from the .prj sidecar file');
});

test('ShapefileLoader#selects from its magic number', async () => {
  const response = await fetchFile(`${SHAPEFILE_DATA_FOLDER}/boolean-property.shp`);
  const loader = await selectLoader(await response.arrayBuffer(), [ShapefileLoader]);
  expect(loader?.id).toBe('shapefile');
});

/** Loads the sidecar files needed to exercise browser FileSystem discovery. */
async function getFixtureFiles(fixtureName: string): Promise<File[]> {
  const files: File[] = [];
  for (const extension of ['.shp', '.shx', '.dbf', '.cpg', '.prj']) {
    const filename = `${fixtureName}${extension}`;
    const response = await fetchFile(`${SHAPEFILE_DATA_FOLDER}/${filename}`);
    if (response.ok && !(response.headers.get('content-type') || '').includes('text/html')) {
      files.push(new File([await response.blob()], filename));
    }
  }
  return files;
}
