// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {pathToFileURL} from 'node:url';
import '@loaders.gl/polyfills';
import test from 'test/utils/vitest-tape';
import {createDataSource, resolvePath} from '@loaders.gl/core';
import {
  GeoZarrRasterSource,
  GeoZarrSourceLoader,
  type GeoZarrSourceLoaderOptions
} from '@loaders.gl/zarr';
import type {RasterBoundingBox, RasterViewport} from '@loaders.gl/loader-utils';

const CONTENT_BASE = resolvePath('@loaders.gl/zarr/test/data');
const SPATIALDATA_V3_FIXTURE = `${CONTENT_BASE}/spatialdata-v3.zarr`;
const SPATIALDATA_V3_FIXTURE_URL = pathToFileURL(SPATIALDATA_V3_FIXTURE).href;

/** Creates the minimal viewport shape accepted by raster sources. */
function createViewport(
  bounds: RasterBoundingBox,
  coordinateReferenceSystem?: string
): RasterViewport {
  const [[minimumX, minimumY], [maximumX, maximumY]] = bounds;
  return {
    id: 'geo-zarr-test',
    width: 256,
    height: 256,
    zoom: 0,
    center: [(minimumX + maximumX) / 2, (minimumY + maximumY) / 2],
    crs: coordinateReferenceSystem,
    bounds,
    project: coordinates => coordinates,
    unprojectPosition: position => [position[0], position[1], position[2] || 0]
  };
}

test('GeoZarrSourceLoader creates a source via createDataSource()', t => {
  const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [GeoZarrSourceLoader], {
    zarr: {path: 'images/example-image'},
    geozarr: {array: '0'}
  });

  t.ok(source instanceof GeoZarrRasterSource);
  t.end();
});

test('GeoZarrRasterSource reads GeoZarr proj and spatial metadata', async t => {
  const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [GeoZarrSourceLoader], {
    zarr: {path: 'images/example-image'},
    geozarr: {array: '0', defaultSelection: {c: 1}}
  });
  const metadata = await source.getMetadata();

  t.equal(metadata.name, 'Example georeferenced image');
  t.equal(metadata.crs, 'EPSG:4326');
  t.deepEqual(metadata.boundingBox, [
    [-20, -6.7],
    [23.9, 10]
  ]);
  t.deepEqual(metadata.dimensions, ['t', 'c', 'z', 'y', 'x']);
  t.deepEqual(metadata.spatialDimensions, ['y', 'x']);
  t.deepEqual(metadata.selectionDimensions, [
    {name: 't', size: 1, defaultIndex: 0},
    {name: 'c', size: 3, defaultIndex: 1},
    {name: 'z', size: 1, defaultIndex: 0}
  ]);
  t.deepEqual(metadata.tileSize, {width: 439, height: 167});
  t.end();
});

test('GeoZarrRasterSource reads a native spatial window and named dimension selection', async t => {
  const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [GeoZarrSourceLoader], {
    zarr: {path: 'images/example-image'},
    geozarr: {array: '0'}
  });
  const raster = await source.getRaster({
    viewport: createViewport(
      [
        [-20, 9],
        [-19, 10]
      ],
      'EPSG:4326'
    ),
    selection: {t: 0, c: 2, z: 0}
  });

  t.equal(raster.width, 10);
  t.equal(raster.height, 10);
  t.equal(raster.bandCount, 1);
  t.equal(raster.dtype, 'int8');
  t.ok(raster.data instanceof Int8Array);
  t.equal(raster.data.length, 100);
  t.deepEqual(raster.boundingBox, [
    [-20, 9],
    [-19, 10]
  ]);
  t.end();
});

test('GeoZarrRasterSource derives georeferencing from regular CF coordinate arrays', async t => {
  const baseUrl = 'https://example.com/cf.zarr';
  const fetcher = createCFZarrFetcher(baseUrl);
  const options: GeoZarrSourceLoaderOptions = {
    core: {
      loadOptions: {
        core: {fetch: fetcher as typeof fetch}
      }
    },
    zarr: {requireConsolidatedMetadata: false},
    geozarr: {array: 'temperature', defaultSelection: {time: 1}}
  };
  const source = new GeoZarrRasterSource(baseUrl, options);
  const metadata = await source.getMetadata();
  const raster = await source.getRaster({
    viewport: createViewport(
      [
        [100.5, 8.5],
        [102.5, 10.5]
      ],
      'EPSG:4326'
    )
  });

  t.equal(metadata.crs, 'EPSG:4326');
  t.deepEqual(metadata.transform, [1, 0, 99.5, 0, -1, 10.5]);
  t.deepEqual(metadata.boundingBox, [
    [99.5, 8.5],
    [102.5, 10.5]
  ]);
  t.deepEqual(metadata.selectionDimensions, [{name: 'time', size: 2, defaultIndex: 1}]);
  t.equal(metadata.noData, 255);
  t.equal(raster.width, 2);
  t.equal(raster.height, 2);
  t.deepEqual(Array.from(raster.data as Uint8Array), [12, 13, 15, 16]);
  t.end();
});

test('GeoZarrRasterSource validates CRS and named selections', async t => {
  const source = createDataSource(SPATIALDATA_V3_FIXTURE_URL, [GeoZarrSourceLoader], {
    zarr: {path: 'images/example-image'},
    geozarr: {array: '0'}
  });
  const viewport = createViewport(
    [
      [-20, 9],
      [-19, 10]
    ],
    'EPSG:3857'
  );

  await t.rejects(source.getRaster({viewport}), /does not support reprojection/);
  viewport.crs = 'EPSG:4326';
  await t.rejects(
    source.getRaster({viewport, selection: {time: 0}}),
    /Unknown GeoZarr selection dimension time/
  );
  await t.rejects(
    source.getRaster({viewport, selection: {c: 3}}),
    /c index 3 is out of bounds/
  );
  t.end();
});

/** Creates an in-memory HTTP view of a small xarray-style Zarr v3 climate store. */
function createCFZarrFetcher(baseUrl: string): typeof fetch {
  const responses = new Map<string, BodyInit>([
    [`${baseUrl}/zarr.json`, encodeJson(createGroupMetadata())],
    [
      `${baseUrl}/temperature/zarr.json`,
      encodeJson(
        createArrayMetadata([2, 2, 3], [1, 2, 3], 'uint8', ['time', 'latitude', 'longitude'], {
          long_name: 'Air temperature',
          _FillValue: 255
        })
      )
    ],
    [`${baseUrl}/temperature/c/0/0/0`, new Uint8Array([1, 2, 3, 4, 5, 6])],
    [`${baseUrl}/temperature/c/1/0/0`, new Uint8Array([11, 12, 13, 14, 15, 16])],
    [
      `${baseUrl}/latitude/zarr.json`,
      encodeJson(
        createArrayMetadata([2], [2], 'float64', ['latitude'], {
          standard_name: 'latitude',
          units: 'degrees_north'
        })
      )
    ],
    [`${baseUrl}/latitude/c/0`, encodeFloat64([10, 9])],
    [
      `${baseUrl}/longitude/zarr.json`,
      encodeJson(
        createArrayMetadata([3], [3], 'float64', ['longitude'], {
          standard_name: 'longitude',
          units: 'degrees_east'
        })
      )
    ],
    [`${baseUrl}/longitude/c/0`, encodeFloat64([100, 101, 102])]
  ]);

  return (async input => {
    const url = input instanceof Request ? input.url : String(input);
    const body = responses.get(url);
    return body ? new Response(body) : new Response(null, {status: 404});
  }) as typeof fetch;
}

/** Creates minimal Zarr v3 group metadata. */
function createGroupMetadata(): Record<string, unknown> {
  return {zarr_format: 3, node_type: 'group', attributes: {}};
}

/** Creates minimal uncompressed Zarr v3 array metadata. */
function createArrayMetadata(
  shape: number[],
  chunks: number[],
  dataType: 'uint8' | 'float64',
  dimensionNames: string[],
  attributes: Record<string, unknown>
): Record<string, unknown> {
  return {
    zarr_format: 3,
    node_type: 'array',
    shape,
    data_type: dataType,
    chunk_grid: {name: 'regular', configuration: {chunk_shape: chunks}},
    chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
    codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
    fill_value: 0,
    dimension_names: dimensionNames,
    attributes
  };
}

/** Encodes JSON metadata as UTF-8 bytes. */
function encodeJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

/** Encodes float64 coordinate values using the explicit Zarr little-endian byte order. */
function encodeFloat64(values: number[]): Uint8Array {
  const buffer = new ArrayBuffer(values.length * Float64Array.BYTES_PER_ELEMENT);
  const dataView = new DataView(buffer);
  values.forEach((value, index) =>
    dataView.setFloat64(index * Float64Array.BYTES_PER_ELEMENT, value, true)
  );
  return new Uint8Array(buffer);
}
