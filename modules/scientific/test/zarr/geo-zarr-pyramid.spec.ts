// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RasterBoundingBox, RasterViewport} from '@loaders.gl/core/loader-utils';
import {readRasterTile} from '@loaders.gl/core/loader-utils';
import type {GeoZarrLoaderOptions} from '@loaders.gl/scientific/zarr';
import {GeoZarrRasterSource} from '@loaders.gl/scientific/zarr/bundled';
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
  expect(metadata.tileGrid?.matrixIds).toEqual(['0', '1', '2']);
  expect(metadata.nativeTileMatrixIds).toEqual(metadata.tileGrid?.matrixIds);
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

test.each([
  {caseName: 'a network error', error: new TypeError('Overview metadata fetch failed')},
  {caseName: 'an abort', error: new DOMException('Overview metadata fetch aborted', 'AbortError')}
])('GeoZarr retries an overview metadata read after $caseName', async ({error}) => {
  let firstRead = true;
  const {source, chunkRequests} = createPyramid({
    overrideMetadataResponse: path => {
      if (path === '1/backscatter/.zarray' && firstRead) {
        firstRead = false;
        throw error;
      }
      return undefined;
    }
  });

  await expect(source.getMetadata()).rejects.toBe(error);
  const metadata = await source.getMetadata();
  expect(metadata.levels?.[1].metadata?.width).toBe(4);

  const raster = await source.getRaster({viewport: createViewport(4, 4)});
  expect(raster).toMatchObject({overview: 1, width: 4, height: 4, boundingBox: EXTENT});
  expect(chunkRequests).toEqual(['1/backscatter/0.0.0']);
});

test.each([
  {
    caseName: 'an absent sibling',
    metadataPath: '2/backscatter/.zarray',
    createResponse: () => new Response(null, {status: 404})
  },
  {
    caseName: 'a sibling with unsupported dimensions',
    metadataPath: '2/backscatter/.zattrs',
    createResponse: () => Response.json({_ARRAY_DIMENSIONS: ['y', 'x']})
  }
])('GeoZarr advertises $caseName without geometry', async ({metadataPath, createResponse}) => {
  const {source, chunkRequests} = createPyramid({
    overrideMetadataResponse: path => (path === metadataPath ? createResponse() : undefined)
  });
  const metadata = await source.getMetadata();
  expect(metadata.levels?.[2]).toEqual({id: '2', array: '2/backscatter'});

  const raster = await source.getRaster({viewport: createViewport(2, 2)});
  expect(raster).toMatchObject({overview: 1, width: 4, height: 4, boundingBox: EXTENT});
  expect(chunkRequests).toEqual(['1/backscatter/0.0.0']);
});

test('GeoZarr reads the finest level when an overview covers only half the request', async () => {
  const {source, chunkRequests} = createPyramid({
    levelXBounds: [
      [0, 8],
      [4, 8]
    ]
  });
  const raster = await source.getRaster({
    viewport: {...createViewport(2, 2), crs: PROJECTED_WKT}
  });
  expect(raster).toMatchObject({overview: 0, width: 8, height: 8, boundingBox: EXTENT});
  expect(raster.data).toEqual(new Uint8Array(64).fill(1));
  expect(chunkRequests).toHaveLength(4);
  expect(chunkRequests.every(path => path.startsWith('0/backscatter/'))).toBe(true);
});

test('GeoZarr selects a partial overview when it covers the request', async () => {
  const {source, chunkRequests} = createPyramid({
    levelXBounds: [
      [0, 8],
      [4, 8]
    ]
  });
  const bounds: RasterBoundingBox = [
    [4, 0],
    [8, 8]
  ];
  const raster = await source.getRaster({
    viewport: {...createViewport(2, 2, bounds), crs: PROJECTED_WKT}
  });
  expect(raster).toMatchObject({overview: 1, width: 2, height: 4, boundingBox: bounds});
  expect(raster.data).toEqual(new Uint8Array(8).fill(2));
  expect(chunkRequests).toEqual(['1/backscatter/0.0.0']);
});

test('GeoZarr selects an overview shortened by floor rounding', async () => {
  const {source, chunkRequests} = createPyramid({
    levelXBounds: [
      [0, 9],
      [0, 8]
    ]
  });
  const raster = await source.getRaster({
    viewport: {
      ...createViewport(2, 2, [
        [0, 0],
        [9, 8]
      ]),
      crs: PROJECTED_WKT
    }
  });
  expect(raster).toMatchObject({overview: 1, width: 4, height: 4, boundingBox: EXTENT});
  expect(raster.data).toEqual(new Uint8Array(16).fill(2));
  expect(chunkRequests).toEqual(['1/backscatter/0.0.0']);
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
  {
    overview: 0,
    x: 1,
    y: 1,
    resolution: 1,
    origin: [4, 4],
    bounds: [
      [4, 0],
      [8, 4]
    ]
  },
  {
    overview: 1,
    x: 0,
    y: 0,
    resolution: 2,
    origin: [0, 8],
    bounds: [
      [0, 0],
      [8, 8]
    ]
  }
])('GeoZarr reads the exact full chunk in overview $overview', async ({
  overview,
  x,
  y,
  resolution,
  origin,
  bounds
}) => {
  const chunkValues = Array.from({length: 16}, (_, index) => 20 * overview + index);
  const {source, chunkRequests} = createPyramid({chunkValues});
  const {tileGrid} = await source.getMetadata();
  const matrix = tileGrid!.tileMatrixSet!.matrices[overview];
  const parameters = {tileMatrix: matrix.id, x, y};
  const tile = await readRasterTile(source, parameters);

  expect(chunkRequests).toEqual([`${overview}/backscatter/0.${y}.${x}`]);
  expect(tile).toMatchObject({
    data: Uint8Array.from(chunkValues),
    width: 4,
    height: 4,
    bandCount: 1,
    dtype: 'uint8',
    interleaved: false,
    bands: [{index: 0, dtype: 'uint8'}],
    overview,
    boundingBox: bounds,
    transform: [resolution, 0, origin[0], 0, -resolution, origin[1]],
    crs: PROJECTED_WKT,
    pixelRegistration: 'area',
    resolution: [resolution, resolution],
    nativeResolution: [resolution, resolution],
    overzoom: false,
    provenance: {sourceType: 'geozarr'},
    ownership: 'owned',
    metadata: {array: `${overview}/backscatter`}
  });
  expect(tile?.validityMasks).toBeUndefined();

  (tile!.data as Uint8Array)[0] = 255;
  await expect(source.getRasterTile(parameters)).resolves.toMatchObject({
    data: Uint8Array.from(chunkValues)
  });
  expect(chunkRequests).toHaveLength(1);
});

test('GeoZarr pads a short edge chunk and masks padding and nodata', async () => {
  const chunkValues = [1, 255, 201, 202, 2, 3, 203, 204, ...new Array<number>(8).fill(205)];
  const {source, chunkRequests} = createPyramid({attributes: {_FillValue: 255}, chunkValues});
  const tile = await source.getRasterTile({tileMatrix: '2', x: 0, y: 0});

  expect(chunkRequests).toEqual(['2/backscatter/0.0.0']);
  expect(tile).toMatchObject({
    data: new Uint8Array([
      1, 255, 255, 255, 2, 3, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255
    ]),
    noData: 255,
    bands: [{index: 0, noData: 255}],
    width: 4,
    height: 4,
    overview: 2,
    boundingBox: [
      [0, -8],
      [16, 8]
    ],
    transform: [4, 0, 0, 0, -4, 8],
    validityMasks: [
      {data: new Uint8Array([1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), width: 4, height: 4}
    ]
  });
});

test('GeoZarr selects a named slice for its single raster band', async () => {
  const {source, chunkRequests} = createPyramid({sampleCount: 2});
  const parameters = {tileMatrix: '0', x: 1, y: 0};
  const tile = await readRasterTile(source, {
    ...parameters,
    selection: {band: 1},
    bands: [0],
    interleaved: true
  });

  expect(tile).toMatchObject({
    data: new Uint8Array(16).fill(2),
    bandCount: 1,
    interleaved: true,
    metadata: {selection: {band: 1}}
  });
  await expect(source.getRasterTile({...parameters, bands: [1]})).rejects.toThrow(
    /one raster band/
  );
  expect(chunkRequests).toEqual(['0/backscatter/1.0.1']);
});

test('GeoZarr validates matrix IDs and returns null outside tile coverage', async () => {
  const {source, chunkRequests} = createPyramid();
  const {tileGrid} = await source.getMetadata();
  const [matrix] = tileGrid!.tileMatrixSet!.matrices;
  const outside = {tileMatrix: matrix.id, x: matrix.matrixSize[0], y: 0};
  const unknown = {tileMatrix: 'unknown', x: 0, y: 0};

  await expect(readRasterTile(source, outside)).resolves.toBeNull();
  await expect(source.getRasterTile(outside)).resolves.toBeNull();
  await expect(readRasterTile(source, unknown)).rejects.toThrow(/Unknown tile matrix "unknown"/);
  await expect(source.getRasterTile(unknown)).rejects.toThrow(/Unknown tile matrix "unknown"/);
  expect(chunkRequests).toEqual([]);
});

test('GeoZarr honors pre-aborted and in-flight signals for native tiles', async () => {
  const controller = new AbortController();
  const {source, chunkRequests} = createPyramid({
    delayChunks: true,
    onChunkRequest: () => controller.abort()
  });
  const parameters = {tileMatrix: '0', x: 0, y: 0};
  await expect(
    source.getRasterTile({...parameters, signal: AbortSignal.abort()})
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(chunkRequests).toEqual([]);

  await expect(
    source.getRasterTile({...parameters, signal: controller.signal})
  ).rejects.toMatchObject({name: 'AbortError'});
  await expect(readRasterTile(source, parameters)).resolves.toMatchObject({
    data: new Uint8Array(16).fill(1)
  });
  expect(chunkRequests).toEqual(['0/backscatter/0.0.0']);
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
  {
    caseName: 'CF _FillValue',
    attributes: {_FillValue: 255, missing_value: 254},
    expected: 255,
    maskedIndex: 2
  },
  {caseName: 'CF missing_value', attributes: {missing_value: 254}, expected: 254, maskedIndex: 1},
  {caseName: 'integer default', expected: undefined},
  {caseName: 'integer opt-in', fillValueAsNoData: true, expected: 0, maskedIndex: 0},
  {caseName: 'float default', float: true, expected: undefined},
  {caseName: 'float opt-in', float: true, fillValueAsNoData: true, expected: 0, maskedIndex: 0},
  {
    caseName: 'float CF _FillValue',
    float: true,
    attributes: {_FillValue: 0.1},
    expected: 0.1,
    maskedIndex: 3
  }
])('GeoZarr reports and masks nodata from $caseName', async ({
  attributes,
  float,
  fillValueAsNoData,
  expected,
  maskedIndex
}) => {
  const chunkValues = [0, 254, 255, 0.1, ...new Array<number>(12).fill(1)];
  if (!float) chunkValues[3] = 1;
  const {source} = createPyramid({attributes, float, chunkValues, options: {fillValueAsNoData}});
  const metadata = await source.getMetadata();
  expect(metadata.noData).toBe(expected);
  expect(metadata.bands?.[0].noData).toBe(expected);
  const tile = await source.getRasterTile({tileMatrix: '0', x: 0, y: 0});
  expect(tile?.noData).toBe(expected);
  if (maskedIndex !== undefined || float) {
    const expectedMask = new Uint8Array(16).fill(1);
    if (maskedIndex !== undefined) expectedMask[maskedIndex] = 0;
    expect(tile?.validityMasks).toEqual([{data: expectedMask, width: 4, height: 4}]);
  } else {
    expect(tile?.validityMasks).toBeUndefined();
  }
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
  /** X bounds for each advertised level, whose resolution doubles from one unit per pixel. */
  levelXBounds?: ReadonlyArray<readonly [minimum: number, maximum: number]>;
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
  /** Number of selectable samples on the non-spatial band dimension. */
  sampleCount?: number;
  /** Raw values for each raster chunk, overriding the uniform per-sample defaults. */
  chunkValues?: number[];
  /** Override GeoZarr source options. */
  options?: GeoZarrLoaderOptions['geozarr'];
  /** Return immediately from fetch while delaying the response body for raster chunks. */
  delayChunks?: boolean;
  /** Callback when the fixture receives a raster chunk request. */
  onChunkRequest?: () => void;
  /** Override or fail a metadata fetch. Returning undefined uses the fixture response. */
  overrideMetadataResponse?: (path: string) => Response | undefined;
};

/** Builds a consolidated v2 pyramid using 4×4 chunks. Defaults to 8×8, 4×4, and 2×2 arrays. */
function createPyramid({
  levelXBounds = [
    [0, 8],
    [0, 8],
    [0, 8]
  ],
  scaleTransforms = 'absent',
  mapping = 'sibling',
  rootCRS,
  attributes,
  float,
  sampleCount = 1,
  chunkValues,
  options,
  delayChunks,
  onChunkRequest,
  overrideMetadataResponse
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
        datasets: levelXBounds.map((_, level) => ({
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

  for (const [level, [minimumX, maximumX]] of levelXBounds.entries()) {
    const resolution = 2 ** level;
    const width = (maximumX - minimumX) / resolution;
    const height = 8 / resolution;
    documents.set(`${level}/.zgroup`, {zarr_format: 2});
    addArray(
      `${level}/backscatter`,
      [sampleCount, height, width],
      [1, 4, 4],
      float ? '<f4' : '|u1',
      {
        _ARRAY_DIMENSIONS: ['band', 'y', 'x'],
        ...(mapping === 'named' ? {grid_mapping: 'utm'} : {}),
        ...attributes
      }
    );
    if (mapping !== 'none') {
      const variable = mapping === 'named' ? 'utm' : 'spatial_ref';
      addArray(`${level}/${variable}`, [], [], '<i4', {
        ...(mapping === 'named' ? {spatial_ref: PROJECTED_WKT} : {crs_wkt: PROJECTED_WKT})
      });
    }
    for (const name of ['x', 'y']) {
      const size = name === 'x' ? width : height;
      addArray(`${level}/${name}`, [size], [size], '<f8', {_ARRAY_DIMENSIONS: [name]});
      chunks.set(
        `${level}/${name}/0`,
        Float64Array.from({length: size}, (_, index) =>
          name === 'x' ? minimumX + (index + 0.5) * resolution : 8 - (index + 0.5) * resolution
        ).buffer
      );
    }
    const ChunkArray = float ? Float32Array : Uint8Array;
    for (let sample = 0; sample < sampleCount; sample++) {
      const chunk = chunkValues
        ? ChunkArray.from(chunkValues)
        : new ChunkArray(16).fill(level + sample + 1);
      for (let row = 0; row < Math.ceil(height / 4); row++) {
        for (let column = 0; column < Math.ceil(width / 4); column++) {
          chunks.set(`${level}/backscatter/${sample}.${row}.${column}`, chunk.buffer);
        }
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
      const response = overrideMetadataResponse?.(path);
      if (response) return response;
      return documents.has(path)
        ? Response.json(documents.get(path))
        : new Response(null, {status: 404});
    }
    if (path.includes('/backscatter/')) {
      chunkRequests.push(path);
      onChunkRequest?.();
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
