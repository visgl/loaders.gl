// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RasterBoundingBox, RasterViewport} from '@loaders.gl/core/loader-utils';
import {GeoZarrRasterSource, type GeoZarrLoaderOptions} from '@loaders.gl/scientific/zarr';
import {limitZarrStore} from '../../src/zarr/lib/limited-zarr-store';
import {expect, test} from 'vitest';

/** A projected WKT with multiple nested authorities and an outer EPSG code. */
const PROJECTED_WKT =
  'PROJCS["NAD83 / UTM zone 19N",GEOGCS["NAD83",AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","26919"]]';

/** Outer WKT without an EPSG authority. */
const CUSTOM_WKT = 'PROJCS["Custom grid",GEOGCS["NAD83",AUTHORITY["EPSG","4269"]]]';

/** Full extent with centers at half-integer coordinates on the finest grid. */
const EXTENT: RasterBoundingBox = [
  [0, 0],
  [8, 8]
];

test.each([
  'absent',
  'unnamed',
  'named'
] as const)('GeoZarr opens a CF level-group pyramid with %s scale transforms and selects an overview', async scaleTransforms => {
  const {source, chunkRequests} = createPyramid({scaleTransforms});
  const metadata = await source.getMetadata();
  expect(metadata.array).toBe('0/backscatter');
  expect(metadata.crs).toBe(PROJECTED_WKT);
  expect(metadata.noData).toBeUndefined();
  expect(metadata.bands).toEqual([{index: 0, dtype: 'uint8', noData: undefined}]);
  expect(
    metadata.levels?.map(level => ({
      id: level.id,
      array: level.array,
      width: level.metadata?.width,
      height: level.metadata?.height,
      transform: level.metadata?.transform,
      crs: level.metadata?.crs
    }))
  ).toEqual(
    [8, 4, 2].map((size, index) => ({
      id: String(index),
      array: `${index}/backscatter`,
      width: size,
      height: size,
      transform: [8 / size, 0, 0, 0, -8 / size, 8],
      crs: PROJECTED_WKT
    }))
  );
  expect(chunkRequests).toEqual([]);

  for (const [width, height, overview, size] of [
    [8, 8, 0, 8],
    [2, 4, 1, 4],
    [2, 2, 2, 2]
  ]) {
    chunkRequests.length = 0;
    const raster = await source.getRaster({
      viewport: {...createViewport(width, height), crs: PROJECTED_WKT}
    });
    expect(raster).toMatchObject({
      width: size,
      height: size,
      overview,
      crs: PROJECTED_WKT,
      boundingBox: EXTENT,
      transform: [8 / size, 0, 0, 0, -8 / size, 8],
      metadata: {array: `${overview}/backscatter`},
      noData: undefined,
      bands: [{index: 0, dtype: 'uint8', noData: undefined}]
    });
    expect(raster.data).toEqual(new Uint8Array(size * size).fill(overview + 1));
    expect(chunkRequests).toHaveLength(overview === 0 ? 4 : 1);
    expect(chunkRequests.every(path => path.startsWith(`${overview}/backscatter/`))).toBe(true);
  }
});

test('GeoZarr translates the overview affine for a viewport without a CRS', async () => {
  const {source} = createPyramid();
  const raster = await source.getRaster({
    viewport: createViewport(2, 2, [
      [2, 2],
      [6, 6]
    ])
  });
  expect(raster).toMatchObject({
    overview: 1,
    crs: PROJECTED_WKT,
    width: 2,
    height: 2,
    boundingBox: [
      [2, 2],
      [6, 6]
    ],
    transform: [2, 0, 2, 0, -2, 6]
  });
});

test('GeoZarr discovers group-per-level CF geometry without a CRS declaration', async () => {
  const {source} = createPyramid({mapping: 'none'});
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBeUndefined();
  expect(metadata.levels?.map(level => level.metadata?.width)).toEqual([8, 4, 2]);
});

test.each([
  {caseName: 'root CRS', mapping: 'none', rootCRS: PROJECTED_WKT, expected: PROJECTED_WKT},
  {caseName: 'named grid mapping', mapping: 'named', rootCRS: CUSTOM_WKT, expected: PROJECTED_WKT},
  {caseName: 'nested authority only', mapping: 'none', rootCRS: CUSTOM_WKT, expected: CUSTOM_WKT}
] as const)('GeoZarr resolves CF CRS from $caseName', async ({mapping, rootCRS, expected}) => {
  const {source} = createPyramid({mapping, rootCRS, options: {array: '0/backscatter'}});
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBe(expected);
  expect(metadata.levels?.map(level => level.metadata?.crs)).toEqual([
    expected,
    expected,
    expected
  ]);
});

test.each([
  {caseName: 'CF _FillValue', attributes: {_FillValue: 255, missing_value: 254}, expected: 255},
  {caseName: 'CF missing_value', attributes: {missing_value: 254}, expected: 254},
  {caseName: 'integer default', expected: undefined},
  {caseName: 'integer opt-in', fillValueAsNoData: true, expected: 0},
  {caseName: 'float default', float: true, expected: undefined},
  {caseName: 'float opt-in', float: true, fillValueAsNoData: true, expected: 0}
])('GeoZarr reports nodata from $caseName', async ({
  attributes,
  float,
  fillValueAsNoData,
  expected
}) => {
  const {source} = createPyramid({attributes, float, options: {fillValueAsNoData}});
  const metadata = await source.getMetadata();
  expect(metadata.noData).toBe(expected);
  expect(metadata.bands?.[0].noData).toBe(expected);
});

test('GeoZarr caps concurrent chunk fetches through response body reads', async () => {
  const {source, chunkRequests, getPeakRequests} = createPyramid({
    options: {maxConcurrentRequests: 2},
    delayChunks: true
  });
  const raster = await source.getRaster({viewport: createViewport(8, 8)});
  expect(raster.data).toEqual(new Uint8Array(64).fill(1));
  expect(chunkRequests).toHaveLength(4);
  expect(getPeakRequests()).toBe(2);
});

test('GeoZarr selects overviews whose PROJJSON CRS is equal by value', async () => {
  const projjson = {type: 'ProjectedCRS', name: 'Local grid', id: {authority: 'EPSG', code: 26919}};
  const {source, chunkRequests} = createPyramid({
    mapping: 'none',
    attributes: {'proj:projjson': projjson}
  });
  const metadata = await source.getMetadata();
  const [first, second] = metadata.levels ?? [];
  expect(first?.metadata?.crs).toEqual(projjson);
  expect(first?.metadata?.crs).not.toBe(second?.metadata?.crs);
  const raster = await source.getRaster({viewport: createViewport(2, 2)});
  expect(raster.data).toEqual(new Uint8Array(4).fill(3));
  expect(chunkRequests.every(path => path.startsWith('2/backscatter/'))).toBe(true);
});

test('limited Zarr store drops an aborted queued read without waiting for a slot', async () => {
  const releases: Array<() => void> = [];
  const started: string[] = [];
  const store = {
    get: (key: string) =>
      new Promise<Uint8Array | undefined>(resolve => {
        started.push(key);
        releases.push(() => resolve(new Uint8Array([1])));
      }),
    getRange: () => Promise.resolve(undefined)
  };
  const limited = limitZarrStore(store as any, 1);
  const first = limited.get('/a' as any);
  const controller = new AbortController();
  const aborted = limited.get('/b' as any, {signal: controller.signal});
  const live = limited.get('/c' as any);
  controller.abort(new Error('stale view'));
  await expect(aborted).rejects.toThrow('stale view');
  releases[0]();
  await first;
  await Promise.resolve();
  await Promise.resolve();
  expect(started).toEqual(['/a', '/c']);
  releases[1]();
  await expect(live).resolves.toEqual(new Uint8Array([1]));
});

/** Controls the metadata and transport of the in-memory pyramid. */
type PyramidOptions = {
  /** Scale metadata included on each dataset path. */
  scaleTransforms?: 'absent' | 'unnamed' | 'named';
  /** Shape of the CF grid-mapping declaration. */
  mapping?: 'sibling' | 'named' | 'none';
  /** CRS declaration on the root group. */
  rootCRS?: string;
  /** Additional raster variable attributes. */
  attributes?: Record<string, unknown>;
  /** Use float32 instead of uint8. */
  float?: boolean;
  /** Override GeoZarr source options. */
  options?: GeoZarrLoaderOptions['geozarr'];
  /** Return immediately from fetch while delaying the response body for raster chunks. */
  delayChunks?: boolean;
};

/** Builds a consolidated v2 pyramid with 8×8, 4×4, and 2×2 arrays using 4×4 chunks. */
function createPyramid({
  scaleTransforms = 'absent',
  mapping = 'sibling',
  rootCRS,
  attributes,
  float,
  options,
  delayChunks
}: PyramidOptions = {}) {
  const baseUrl = 'https://example.com/cf-pyramid.zarr/';
  const documents = new Map<string, unknown>();
  const chunks = new Map<string, ArrayBuffer>();
  documents.set('.zgroup', {zarr_format: 2});
  documents.set('.zattrs', {
    crs: rootCRS,
    multiscales: [
      {
        version: '0.4',
        name: 'backscatter',
        ...(scaleTransforms === 'named' ? {axes: ['band', 'y', 'x']} : {}),
        datasets: [0, 1, 2].map(level => ({
          path: String(level),
          ...(scaleTransforms === 'absent'
            ? {}
            : {coordinateTransformations: [{type: 'scale', scale: [1, 2 ** level, 2 ** level]}]})
        }))
      }
    ]
  });

  /** Adds uncompressed, little-endian Zarr v2 metadata for one variable. */
  function addArray(
    path: string,
    shape: number[],
    chunkShape: number[],
    dtype: string,
    arrayAttributes: object
  ): void {
    documents.set(`${path}/.zarray`, {
      zarr_format: 2,
      shape,
      chunks: chunkShape,
      dtype,
      fill_value: 0,
      compressor: null,
      filters: null,
      order: 'C'
    });
    documents.set(`${path}/.zattrs`, arrayAttributes);
  }

  for (const [level, size] of [8, 4, 2].entries()) {
    const resolution = 8 / size;
    documents.set(`${level}/.zgroup`, {zarr_format: 2});
    addArray(`${level}/backscatter`, [1, size, size], [1, 4, 4], float ? '<f4' : '|u1', {
      _ARRAY_DIMENSIONS: ['band', 'y', 'x'],
      ...(mapping === 'named' ? {grid_mapping: 'utm'} : {}),
      ...attributes
    });
    if (mapping !== 'none') {
      const variable = mapping === 'named' ? 'utm' : 'spatial_ref';
      addArray(`${level}/${variable}`, [], [], '<i4', {
        ...(mapping === 'named' ? {spatial_ref: PROJECTED_WKT} : {crs_wkt: PROJECTED_WKT})
      });
    }
    for (const name of ['x', 'y']) {
      addArray(`${level}/${name}`, [size], [size], '<f8', {_ARRAY_DIMENSIONS: [name]});
      chunks.set(
        `${level}/${name}/0`,
        Float64Array.from({length: size}, (_, index) =>
          name === 'x' ? (index + 0.5) * resolution : 8 - (index + 0.5) * resolution
        ).buffer
      );
    }
    const ChunkArray = float ? Float32Array : Uint8Array;
    for (const row of [0, 1].slice(0, Math.ceil(size / 4))) {
      for (const column of [0, 1].slice(0, Math.ceil(size / 4))) {
        chunks.set(
          `${level}/backscatter/0.${row}.${column}`,
          new ChunkArray(16).fill(level + 1).buffer
        );
      }
    }
  }
  documents.set('.zmetadata', {
    zarr_consolidated_format: 1,
    metadata: Object.fromEntries(documents)
  });

  const chunkRequests: string[] = [];
  let activeRequests = 0;
  let peakRequests = 0;
  /** Returns metadata and bytes from memory, with an optional delayed raster chunk body. */
  const fetcher: typeof fetch = async input => {
    const url = input instanceof Request ? input.url : String(input);
    const path = url.slice(baseUrl.length);
    const chunk = chunks.get(path);
    if (!chunk) {
      return documents.has(path)
        ? Response.json(documents.get(path))
        : new Response(null, {status: 404});
    }
    if (path.includes('/backscatter/')) {
      chunkRequests.push(path);
      if (delayChunks) {
        activeRequests++;
        peakRequests = Math.max(peakRequests, activeRequests);
        return new Response(
          new ReadableStream({
            start(controller) {
              setTimeout(() => {
                activeRequests--;
                controller.enqueue(new Uint8Array(chunk));
                controller.close();
              }, 5);
            }
          })
        );
      }
    }
    return new Response(chunk);
  };
  return {
    source: new GeoZarrRasterSource(baseUrl, {
      core: {fetch: fetcher},
      geozarr: {array: 'backscatter', ...options}
    }),
    chunkRequests,
    getPeakRequests: () => peakRequests
  };
}

/** Creates a viewport in source coordinates. */
function createViewport(width: number, height: number, bounds = EXTENT): RasterViewport {
  return {
    id: 'cf-pyramid',
    width,
    height,
    bounds,
    zoom: 0,
    center: [4, 4],
    project: coordinates => coordinates,
    unprojectPosition: position => [position[0], position[1], position[2] || 0]
  };
}
