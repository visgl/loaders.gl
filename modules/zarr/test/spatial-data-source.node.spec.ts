// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {describe, expect, test} from 'vitest';
import {resolvePath} from '@loaders.gl/core';
import {
  OMEZarrImageSource,
  SpatialDataSource,
  ZarrArraySource
} from '@loaders.gl/zarr';

const FIXTURE_PATH = resolvePath('@loaders.gl/zarr/test/data/spatialdata-v3.zarr');
const FIXTURE_URL = pathToFileURL(FIXTURE_PATH).href;

function createSpatialDataSource(): SpatialDataSource {
  return new SpatialDataSource(FIXTURE_URL, {core: {loadOptions: {fetch: fetchFixtureFile}}});
}

async function fetchFixtureFile(url: string): Promise<Response> {
  const path = url.startsWith('file:') ? new URL(url).pathname : url;
  try {
    return new Response(await readFile(path));
  } catch {
    return new Response(null, {status: 404});
  }
}

describe('SpatialDataSource', () => {
  test('discovers typed SpatialData elements and storage references', async () => {
    const source = createSpatialDataSource();
    const metadata = await source.getMetadata();

    expect(source).toBeInstanceOf(SpatialDataSource);
    expect(metadata.version).toBe('0.1.0');
    expect(metadata.elements.map(element => `${element.kind}:${element.name}`)).toEqual([
      'image:example-image',
      'labels:nuclei',
      'points:transcripts',
      'shapes:cells',
      'table:annotations'
    ]);
    expect(metadata.points[0]).toMatchObject({
      format: 'parquet-dataset',
      axes: ['x', 'y'],
      version: '0.2'
    });
    expect(metadata.points[0].url).toMatch(/points\/transcripts\/points\.parquet$/);
    expect(metadata.shapes[0].url).toMatch(/shapes\/cells\/shapes\.parquet$/);
    expect(metadata.tables[0]).toMatchObject({format: 'anndata-zarr', version: '0.2'});
    expect(Object.isFrozen(metadata.elements)).toBe(true);
  });

  test('opens discovered raster and AnnData array elements as Zarr sources', async () => {
    const source = createSpatialDataSource();
    const imageSource = await source.createRasterSource('image', 'example-image');
    const tableArraySource = await source.createTableArraySource('annotations', 'X');

    expect(imageSource).toBeInstanceOf(OMEZarrImageSource);
    await expect(imageSource.getMetadata()).resolves.toMatchObject({width: 439, height: 167});
    expect(tableArraySource).toBeInstanceOf(ZarrArraySource);
    expect(tableArraySource.options.zarr?.path).toBe('tables/annotations');
    expect(tableArraySource.options.zarrArray?.path).toBe('X');
  });

  test('rejects unknown elements and empty table array paths', async () => {
    const source = createSpatialDataSource();

    await expect(source.getElement('points', 'missing')).rejects.toThrow(/is not available/);
    await expect(source.createTableArraySource('annotations', '/')).rejects.toThrow(
      /must not be empty/
    );
  });

  test('discovers legacy v2 SpatialData element groups', async () => {
    const source = new SpatialDataSource('https://example.com/legacy.zarr', {
      zarr: {metadataPath: 'zmetadata'},
      core: {
        loadOptions: {
          fetch: async () =>
            new Response(
              JSON.stringify({
                metadata: {
                  '.zgroup': {zarr_format: 2},
                  '.zattrs': {spatialdata_attrs: {version: '0.1'}},
                  'points/.zgroup': {zarr_format: 2},
                  'points/cells/.zgroup': {zarr_format: 2},
                  'points/cells/.zattrs': {
                    spatialdata_attrs: {version: '0.1'},
                    axes: ['x', 'y']
                  }
                }
              })
            )
        }
      }
    });

    await expect(source.getMetadata()).resolves.toMatchObject({
      version: '0.1',
      points: [{name: 'cells', format: 'parquet-dataset', axes: ['x', 'y']}]
    });
  });
});
