// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RasterBoundingBox, RasterViewport} from '@loaders.gl/loader-utils';
import {GeoZarrRasterSource} from '@loaders.gl/zarr';
import {expect, test} from 'vitest';

const DATA_TYPES = [
  'uint8',
  'uint16',
  'uint32',
  'int8',
  'int16',
  'int32',
  'float32',
  'float64'
] as const;

test('GeoZarrRasterSource returns typed empty rasters outside each supported dtype extent', async () => {
  const expectedConstructors = [
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array
  ];

  for (let dataTypeIndex = 0; dataTypeIndex < DATA_TYPES.length; dataTypeIndex++) {
    const baseUrl = `https://example.com/${DATA_TYPES[dataTypeIndex]}.zarr`;
    const fetcher = createDirectGeoZarrFetcher(baseUrl, DATA_TYPES[dataTypeIndex], ['y', 'x'], [2, 2]);
    const source = new GeoZarrRasterSource(baseUrl, {
      core: {loadOptions: {core: {fetch: fetcher}}},
      zarr: {requireConsolidatedMetadata: false},
      geozarr: {array: 'values'}
    });
    const raster = await source.getRaster({
      viewport: createViewport(
        [
          [10, 10],
          [11, 11]
        ],
        'EPSG:4326'
      )
    });

    expect(raster.data).toBeInstanceOf(expectedConstructors[dataTypeIndex]);
    expect(raster.data).toHaveLength(0);
    expect(raster.width).toBe(0);
    expect(raster.height).toBe(0);
  }
});

test('GeoZarrRasterSource transposes physical x/y arrays into row-major raster order', async () => {
  const baseUrl = 'https://example.com/transposed.zarr';
  const fetcher = createDirectGeoZarrFetcher(
    baseUrl,
    'uint8',
    ['x', 'y'],
    [2, 3],
    new Uint8Array([1, 2, 3, 4, 5, 6])
  );
  const source = new GeoZarrRasterSource(baseUrl, {
    core: {loadOptions: {core: {fetch: fetcher}}},
    zarr: {requireConsolidatedMetadata: false},
    geozarr: {array: 'values'}
  });
  const raster = await source.getRaster({
    viewport: createViewport(
      [
        [0, 0],
        [2, 3]
      ],
      'EPSG:4326'
    )
  });

  expect(raster.width).toBe(2);
  expect(raster.height).toBe(3);
  expect(Array.from(raster.data as Uint8Array)).toEqual([1, 4, 2, 5, 3, 6]);
});

test('GeoZarrRasterSource validates structural metadata and retries failed initialization', async () => {
  const cases: Array<{name: string; overrides: Record<string, unknown>; message: RegExp}> = [
    {name: 'duplicate dimensions', overrides: {dimension_names: ['x', 'x']}, message: /unique Zarr dimension_names/},
    {
      name: 'missing spatial dimensions',
      overrides: {dimension_names: ['row', 'column'], attributes: {'spatial:dimensions': null}},
      message: /could not resolve two spatial dimensions/
    },
    {
      name: 'missing affine transform',
      overrides: {attributes: {'spatial:transform': null}},
      message: /requires spatial:transform metadata/
    },
    {name: 'unsupported dtype', overrides: {data_type: 'bool'}, message: /dtype bool is not currently supported/}
  ];

  for (const testCase of cases) {
    const baseUrl = `https://example.com/${testCase.name.replaceAll(' ', '-')}.zarr`;
    const source = new GeoZarrRasterSource(baseUrl, {
      core: {
        loadOptions: {
          core: {fetch: createDirectGeoZarrFetcher(baseUrl, 'uint8', ['y', 'x'], [2, 2], undefined, testCase.overrides)}
        }
      },
      zarr: {requireConsolidatedMetadata: false},
      geozarr: {array: 'values'}
    });
    await expect(source.getMetadata(), testCase.name).rejects.toThrow(testCase.message);
    await expect(source.getMetadata(), `${testCase.name} retries`).rejects.toThrow(testCase.message);
  }
});

test('GeoZarrRasterSource applies node registration and rejects rotated reads', async () => {
  const baseUrl = 'https://example.com/rotated-node.zarr';
  const fetcher = createDirectGeoZarrFetcher(
    baseUrl,
    'uint8',
    ['y', 'x'],
    [2, 2],
    new Uint8Array([1, 2, 3, 4]),
    {attributes: {'spatial:registration': 'node', 'spatial:transform': [1, 0.25, 0, 0.5, -1, 2]}}
  );
  const source = new GeoZarrRasterSource(baseUrl, {
    core: {loadOptions: {core: {fetch: fetcher}}},
    zarr: {requireConsolidatedMetadata: false},
    geozarr: {array: 'values'}
  });
  const metadata = await source.getMetadata();
  expect(metadata.registration).toBe('node');
  expect(metadata.transform).toEqual([1, 0.25, -0.625, 0.5, -1, 2.25]);
  await expect(
    source.getRaster({viewport: createViewport(metadata.boundingBox!, 'EPSG:4326')})
  ).rejects.toThrow(/rotated affine window reads/);
});

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

/** Creates an in-memory GeoZarr v3 array with direct affine metadata. */
function createDirectGeoZarrFetcher(
  baseUrl: string,
  dataType: (typeof DATA_TYPES)[number],
  dimensionNames: [string, string],
  shape: [number, number],
  data?: Uint8Array,
  arrayMetadataOverrides: Record<string, any> = {}
): typeof fetch {
  const baseArrayMetadata = {
    zarr_format: 3,
    node_type: 'array',
    shape,
    data_type: dataType,
    chunk_grid: {name: 'regular', configuration: {chunk_shape: shape}},
    chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
    codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
    fill_value: 0,
    dimension_names: dimensionNames,
    attributes: {
      'spatial:dimensions': ['y', 'x'],
      'spatial:transform': [1, 0, 0, 0, 1, 0],
      'spatial:bbox': [0, 0, 2, 3],
      'proj:code': 'EPSG:4326'
    }
  };
  const arrayMetadata = {
    ...baseArrayMetadata,
    ...arrayMetadataOverrides,
    attributes: {
      ...baseArrayMetadata.attributes,
      ...arrayMetadataOverrides.attributes
    }
  };
  const responses = new Map<string, BodyInit>([
    [
      `${baseUrl}/zarr.json`,
      new TextEncoder().encode(
        JSON.stringify({zarr_format: 3, node_type: 'group', attributes: {}})
      )
    ],
    [`${baseUrl}/values/zarr.json`, new TextEncoder().encode(JSON.stringify(arrayMetadata))],
    [`${baseUrl}/values/c/0/0`, data || new Uint8Array(0)]
  ]);

  return (async input => {
    const url = input instanceof Request ? input.url : String(input);
    const body = responses.get(url);
    return body === undefined ? new Response(null, {status: 404}) : new Response(body);
  }) as typeof fetch;
}
