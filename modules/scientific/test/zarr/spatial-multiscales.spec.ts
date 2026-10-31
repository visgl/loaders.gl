// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoZarrRasterSource} from '@loaders.gl/scientific/zarr';
import {getSpatialMultiscaleLevels} from '../../src/zarr/lib/spatial-multiscales';

const BASE_URL = 'https://example.com/spatial.zarr';

/** Builds tiny in-memory array metadata; no sample chunks are supplied. */
function createSource(
  overrides: Record<string, unknown> = {},
  grouped = false,
  groupOverrides: Record<string, unknown> = {},
  consolidated = false,
  extraDocuments: Record<string, unknown> = {}
): {source: GeoZarrRasterSource; requests: string[]} {
  const assets = ['fine', 'overview'];
  const rootAttributes = {
    'proj:code': 'EPSG:32610',
    multiscales: {layout: assets.map(asset => ({asset}))},
    ...groupOverrides
  };
  const documents: Record<string, unknown> = {
    '/zarr.json': {
      zarr_format: 3,
      node_type: 'group',
      attributes: rootAttributes,
      ...(consolidated ? {consolidated_metadata: {kind: 'inline', metadata: {}}} : {})
    }
  };
  for (const [index, asset] of assets.entries()) {
    const attributes = {
      'spatial:dimensions': ['y', 'x'],
      'spatial:transform': index === 0 ? [2, 0, 100, 0, -3, 200] : [5, 0, 100, 0, -7, 200],
      ...(index === 1 ? overrides : {})
    };
    if (grouped) {
      documents[`/${asset}/zarr.json`] = {zarr_format: 3, node_type: 'group', attributes};
    }
    documents[`/${asset}${grouped ? '/values' : ''}/zarr.json`] = {
      zarr_format: 3,
      node_type: 'array',
      shape: [2, index ? 3 : 5, index ? 2 : 4],
      dimension_names: ['time', 'x', 'y'],
      data_type: 'uint8',
      chunk_grid: {name: 'regular', configuration: {chunk_shape: [1, 2, 3]}},
      chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
      codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
      fill_value: 0,
      attributes: grouped ? {} : attributes
    };
  }
  Object.assign(documents, extraDocuments);
  const requests: string[] = [];
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    requests.push(url);
    const document = documents[url.slice(BASE_URL.length)];
    return document ? Response.json(document) : new Response(null, {status: 404});
  }) as typeof fetch;
  return {
    source: new GeoZarrRasterSource(BASE_URL, {
      zarr: {
        requireConsolidatedMetadata: consolidated,
        metadataPath: consolidated ? 'zarr.json' : 'auto'
      },
      geozarr: {array: `fine${grouped ? '/values' : ''}`, defaultSelection: {time: 1}},
      core: {fetch: fetcher}
    }),
    requests
  };
}

test.each([
  false,
  true
])('GeoZarr describes native chunk geometry across multiscales (groups=%s)', async grouped => {
  const {source, requests} = createSource({}, grouped);
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid?.matrixIds).toEqual(['fine', 'overview']);
  expect(metadata.tileGrid?.tileMatrixSet?.matrices).toEqual([
    {
      id: 'fine',
      resolution: 2,
      resolutionY: 3,
      origin: [100, 200],
      cornerOfOrigin: 'topLeft',
      tileSize: [2, 3],
      matrixSize: [3, 2]
    },
    {
      id: 'overview',
      resolution: 5,
      resolutionY: 7,
      origin: [100, 200],
      cornerOfOrigin: 'topLeft',
      tileSize: [2, 3],
      matrixSize: [2, 1]
    }
  ]);
  expect(metadata.levels?.[1].metadata?.dimensions).toEqual(['time', 'x', 'y']);
  expect(metadata.levels?.[1].metadata?.selectionDimensions).toEqual([
    {name: 'time', size: 2, defaultIndex: 1}
  ]);
  expect(metadata.array).toBe(`fine${grouped ? '/values' : ''}`);
  expect(
    requests.every(url => /\/(?:zarr\.json|\.z(?:array|group|attrs|metadata))$/.test(url))
  ).toBe(true);
  const previousCount = requests.length;
  expect(await source.getMetadata()).toBe(metadata);
  expect(requests).toHaveLength(previousCount);
});

test.each([
  {'spatial:transform': [2, 1, 0, 0, -2, 0]},
  {'spatial:transform': [-2, 0, 0, 0, -2, 0]},
  {'spatial:transform': null},
  {'proj:code': 'EPSG:4326'},
  {'proj:code': null}
])('GeoZarr retains advertised levels without inventing complete geometry: %j', async overrides => {
  const {source, requests} = createSource(overrides);
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid?.tileMatrixSet).toBeUndefined();
  expect(metadata.levels?.map(level => level.id)).toEqual(['fine', 'overview']);
  expect(
    requests.every(url => /\/(?:zarr\.json|\.z(?:array|group|attrs|metadata))$/.test(url))
  ).toBe(true);
});

test('GeoZarr normalizes node and south-up level origins', async () => {
  const {source} = createSource({
    'spatial:registration': 'node',
    'spatial:transform': [5, 0, 100, 0, 7, 200]
  });
  const matrix = (await source.getMetadata()).tileGrid?.tileMatrixSet?.matrices[1];
  expect(matrix?.origin).toEqual([97.5, 196.5]);
  expect(matrix?.cornerOfOrigin).toBe('bottomLeft');
});

test.each([
  '../escape',
  '/absolute',
  'https://other/store',
  'a\\b',
  'a/%2e%2e',
  'a?query',
  ''
])('Reject unsafe multiscale asset %s', asset => {
  expect(() => getSpatialMultiscaleLevels({multiscales: {layout: [{asset}]}}, 'fine')).toThrow(
    /relative child/
  );
});

test('Native OME metadata and unrelated or ambiguous layouts are not recast as spatial multiscales', () => {
  expect(getSpatialMultiscaleLevels({multiscales: [{datasets: [{path: '0'}]}]}, '0')).toEqual([]);
  expect(getSpatialMultiscaleLevels({multiscales: {layout: [{asset: 'other'}]}}, 'fine')).toEqual(
    []
  );
  expect(
    getSpatialMultiscaleLevels(
      {multiscales: {layout: [{asset: 'a'}, {asset: 'a/b'}]}},
      'a/b/values'
    )
  ).toEqual([]);
  expect(() =>
    getSpatialMultiscaleLevels({multiscales: {layout: [{asset: 'a'}, {asset: 'a'}]}}, 'a')
  ).toThrow(/Duplicate/);
});

test('Non-CRS projection attributes preserve inherited CRS and reprojection checks', async () => {
  const {source} = createSource({}, false, {
    multiscales: {
      layout: [
        {asset: 'fine', 'proj:shape': [4, 5]},
        {asset: 'overview', 'proj:bbox': [100, 180, 120, 200]}
      ]
    }
  });
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBe('EPSG:32610');
  expect(metadata.levels?.map(level => level.metadata?.crs)).toEqual(['EPSG:32610', 'EPSG:32610']);
  expect(metadata.tileGrid?.tileMatrixSet?.crs).toBe('EPSG:32610');
  await expect(
    source.getRaster({
      viewport: {
        bounds: [
          [0, 0],
          [1, 1]
        ],
        crs: 'EPSG:4326'
      }
    } as any)
  ).rejects.toThrow(/reprojection/);
});

test('Sibling discovery reuses the validated parent consolidated metadata and group', async () => {
  const {source, requests} = createSource({}, false, {}, true);
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid?.tileMatrixSet?.matrices).toHaveLength(2);
  // One consolidated preflight plus one Zarrita group open; siblings reuse the same group/store.
  expect(requests.filter(url => url === `${BASE_URL}/zarr.json`)).toHaveLength(2);
  expect((await source.getConsolidatedMetadata()).format).toBe('v3');
  expect(requests.filter(url => url === `${BASE_URL}/zarr.json`)).toHaveLength(2);
});

test('The closest CRS declaration replaces inherited alternatives across level groups and entries', async () => {
  const {source} = createSource({'proj:wkt2': 'another-crs'}, true, {
    multiscales: {
      layout: [
        {asset: 'fine', 'proj:code': 'EPSG:32610'},
        {asset: 'overview', 'proj:code': 'EPSG:32610'}
      ]
    }
  });
  const metadata = await source.getMetadata();
  expect(metadata.levels?.map(level => level.metadata?.crs)).toEqual(['EPSG:32610', 'EPSG:32610']);
  expect(metadata.tileGrid?.tileMatrixSet?.crs).toBe('EPSG:32610');
});

test('Explicit EPSG-only levels replace inherited CRS and retain complete geometry', async () => {
  const {source} = createSource({}, false, {
    'proj:code': 'EPSG:3857',
    multiscales: {
      layout: [
        {asset: 'fine', 'proj:epsg': 32610},
        {asset: 'overview', 'proj:epsg': 32610}
      ]
    }
  });
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBe('EPSG:32610');
  expect(metadata.levels?.map(level => level.metadata?.crs)).toEqual(['EPSG:32610', 'EPSG:32610']);
  expect(metadata.tileGrid?.tileMatrixSet?.crs).toBe('EPSG:32610');
});

test('PROJJSON overrides retain their full declaration instead of inheriting a different string CRS', async () => {
  const projection = {
    type: 'GeographicCRS',
    name: 'Declared geographic coordinates',
    datum: {
      type: 'GeodeticReferenceFrame',
      name: 'WGS 84',
      ellipsoid: {
        name: 'WGS 84',
        semi_major_axis: 6378137,
        inverse_flattening: 298.257223563
      }
    },
    coordinate_system: {
      subtype: 'ellipsoidal',
      axis: [
        {name: 'Longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree'},
        {name: 'Latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree'}
      ]
    }
  };
  const {source} = createSource({}, false, {
    multiscales: {
      layout: [
        {asset: 'fine', 'proj:projjson': projection},
        {asset: 'overview', 'proj:projjson': projection}
      ]
    }
  });
  const metadata = await source.getMetadata();
  expect(metadata.crs).toEqual(projection);
  expect(metadata.levels?.map(level => level.metadata?.crs)).toEqual([projection, projection]);
  // TileMatrixSet currently has a string CRS contract; do not reduce a full definition to its ID.
  expect(metadata.tileGrid?.tileMatrixSet).toBeUndefined();
});

test.each([
  0,
  -1,
  32610.5,
  '32610'
])('Invalid EPSG declarations do not reuse the inherited CRS (%s)', async epsg => {
  const {source} = createSource({'proj:epsg': epsg});
  const metadata = await source.getMetadata();
  expect(metadata.levels?.[1].metadata?.crs).toBeUndefined();
  expect(metadata.tileGrid?.tileMatrixSet).toBeUndefined();
});

test('A co-declared string CRS remains usable for native windows alongside full PROJJSON', async () => {
  const projection = {type: 'ProjectedCRS', name: 'Retained native definition'};
  const {source} = createSource({}, false, {
    'proj:code': 'EPSG:32610',
    'proj:projjson': projection
  });
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBe('EPSG:32610');
  expect(metadata.metadata?.groupAttributes).toMatchObject({'proj:projjson': projection});
  const raster = await source.getRaster({
    viewport: {
      bounds: [
        [100, 188],
        [110, 200]
      ],
      crs: 'EPSG:32610'
    }
  } as any);
  expect(raster.width).toBe(5);
  expect(raster.height).toBe(4);
  await expect(
    source.getRaster({
      viewport: {
        bounds: [
          [100, 188],
          [110, 200]
        ],
        crs: 'EPSG:4326'
      }
    } as any)
  ).rejects.toThrow(/reprojection/);
});

test('Sibling CF grid-mapping CRS discovery reads metadata without sample chunks', async () => {
  const coordinateReferenceSystem = 'PROJCRS["Native CF grid"]';
  const {source, requests} = createSource(
    {},
    false,
    {'proj:code': undefined, grid_mapping: 'crs'},
    false,
    {
      '/crs/zarr.json': {
        zarr_format: 3,
        node_type: 'array',
        shape: [],
        dimension_names: [],
        data_type: 'uint8',
        chunk_grid: {name: 'regular', configuration: {chunk_shape: []}},
        chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
        codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
        fill_value: 0,
        attributes: {crs_wkt: coordinateReferenceSystem}
      }
    }
  );
  const metadata = await source.getMetadata();
  expect(metadata.levels?.map(level => level.metadata?.crs)).toEqual([
    coordinateReferenceSystem,
    coordinateReferenceSystem
  ]);
  expect(metadata.tileGrid?.tileMatrixSet?.crs).toBe(coordinateReferenceSystem);
  expect(requests.some(url => url.endsWith('/crs/zarr.json'))).toBe(true);
  expect(
    requests.every(url => /\/(?:zarr\.json|\.z(?:array|group|attrs|metadata))$/.test(url))
  ).toBe(true);
});

const OME_AXES = [
  {name: 'y', type: 'space', unit: 'meter'},
  {name: 'x', type: 'space', unit: 'meter'}
];

/** Builds OME-NGFF v0.4 level groups georeferenced by per-level CF metadata. */
function createOMESource({
  scales = [
    [2, 2],
    [4, 4]
  ],
  geoTransform = true,
  gridMapping = 'spatial_ref'
}: {
  scales?: number[][];
  geoTransform?: boolean;
  gridMapping?: string | null;
} = {}): {source: GeoZarrRasterSource; requests: string[]} {
  const arrayDocument = (shape: number[], dimensions: string[], attributes = {}) => ({
    zarr_format: 3,
    node_type: 'array',
    shape,
    dimension_names: dimensions,
    data_type: shape.length === 1 ? 'float64' : 'float32',
    chunk_grid: {
      name: 'regular',
      configuration: {chunk_shape: shape.length ? shape : []}
    },
    chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
    codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
    fill_value: 0,
    attributes
  });
  const documents: Record<string, unknown> = {
    '/zarr.json': {
      zarr_format: 3,
      node_type: 'group',
      attributes: {
        multiscales: [
          {
            version: '0.4',
            axes: OME_AXES,
            datasets: ['0', '1'].map((path, level) => ({
              path,
              coordinateTransformations: [
                {
                  type: 'scale',
                  scale: [scales[level][0], scales[level][1] / 2]
                }
              ]
            })),
            coordinateTransformations: [{type: 'scale', scale: [1, 2]}]
          }
        ]
      }
    }
  };
  const chunks: Record<string, ArrayBuffer> = {};
  for (const level of [0, 1]) {
    const resolution = 2 * 2 ** level;
    const size = 4 / 2 ** level;
    documents[`/${level}/zarr.json`] = {
      zarr_format: 3,
      node_type: 'group',
      attributes: {}
    };
    documents[`/${level}/values/zarr.json`] = arrayDocument([size, size], ['y', 'x'], {
      ...(gridMapping ? {grid_mapping: gridMapping} : {})
    });
    documents[`/${level}/spatial_ref/zarr.json`] = arrayDocument([], [], {
      crs_wkt: 'PROJCRS["Example UTM"]',
      ...(geoTransform ? {GeoTransform: `500000 ${resolution} 0 4650000 0 ${-resolution}`} : {})
    });
    for (const [name, origin, step] of [
      ['x', 500000, resolution],
      ['y', 4650000, -resolution]
    ] as const) {
      documents[`/${level}/${name}/zarr.json`] = arrayDocument([size], [name]);
      chunks[`/${level}/${name}/c/0`] = Float64Array.from(
        {length: size},
        (_, index) => origin + (index + 0.5) * step
      ).buffer;
    }
  }
  const requests: string[] = [];
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    requests.push(url);
    const path = url.slice(BASE_URL.length);
    if (chunks[path]) return new Response(chunks[path]);
    return documents[path] ? Response.json(documents[path]) : new Response(null, {status: 404});
  }) as typeof fetch;
  return {
    source: new GeoZarrRasterSource(BASE_URL, {
      zarr: {requireConsolidatedMetadata: false},
      geozarr: {array: '0/values'},
      core: {fetch: fetcher}
    }),
    requests
  };
}

test.each([
  true,
  false
])('OME-NGFF levels use per-level CF georeferencing (GeoTransform=%s)', async geoTransform => {
  const {source, requests} = createOMESource({geoTransform});
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBe('PROJCRS["Example UTM"]');
  expect(metadata.boundingBox).toEqual([
    [500000, 4649992],
    [500008, 4650000]
  ]);
  expect(metadata.levels?.map(level => level.metadata?.boundingBox)).toEqual([
    metadata.boundingBox,
    geoTransform ? metadata.boundingBox : undefined
  ]);
  expect(requests.some(url => url.endsWith('/0/x/c/0'))).toBe(!geoTransform);
  if (geoTransform) {
    expect(metadata.tileGrid?.tileMatrixSet?.matrices.map(matrix => matrix.resolution)).toEqual([
      2, 4
    ]);
  }
});

test('OME-NGFF levels may use their own frame when level ratios agree', async () => {
  const {source} = createOMESource({
    scales: [
      [1, 1],
      [2, 2]
    ]
  });
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid?.tileMatrixSet?.matrices.map(matrix => matrix.resolution)).toEqual([
    2, 4
  ]);
});

test('OME-NGFF levels whose ratio disagrees with georeferencing are not published', async () => {
  const {source} = createOMESource({
    scales: [
      [2, 2],
      [6, 4]
    ]
  });
  const metadata = await source.getMetadata();
  expect(metadata.levels?.map(level => level.id)).toEqual(['0', '1']);
  expect(metadata.levels?.[0].metadata).toBeDefined();
  expect(metadata.levels?.[1].metadata).toBeUndefined();
  expect(metadata.tileGrid?.tileMatrixSet).toBeUndefined();
});

test('OME-NGFF metadata stays native without a declared CRS', async () => {
  const {source} = createOMESource({gridMapping: null});
  const metadata = await source.getMetadata();
  expect(metadata.crs).toBeUndefined();
  expect(metadata.levels).toBeUndefined();
  expect(metadata.boundingBox).toEqual([
    [500000, 4649992],
    [500008, 4650000]
  ]);
  expect(
    getSpatialMultiscaleLevels({multiscales: [{axes: OME_AXES, datasets: [{path: '0'}]}]}, '0')
  ).toEqual([]);
});

test('OME-NGFF identity transforms change no scale', () => {
  const multiscale = {
    axes: OME_AXES,
    datasets: [
      {path: 'a', coordinateTransformations: [{type: 'identity'}, {type: 'scale', scale: [2, 3]}]},
      {path: 'b', coordinateTransformations: [{type: 'scale', scale: [4, 6]}]}
    ],
    coordinateTransformations: [{type: 'identity'}]
  };
  expect(getSpatialMultiscaleLevels({multiscales: [multiscale]}, 'a', {spatialOME: true})).toEqual([
    {id: 'a', array: 'a', attributes: {}, scale: {y: 2, x: 3}},
    {id: 'b', array: 'b', attributes: {}, scale: {y: 4, x: 6}}
  ]);
});

test('OME-NGFF datasets resolve as levels with composed scales', () => {
  const multiscale = {
    axes: OME_AXES,
    datasets: [
      {
        path: 'a',
        coordinateTransformations: [
          {type: 'scale', scale: [2, 3]},
          {type: 'translation', translation: [10, 20]}
        ]
      },
      {
        path: 'b',
        coordinateTransformations: [{type: 'scale', scale: [4, 6]}]
      }
    ],
    coordinateTransformations: [{type: 'scale', scale: [10, 100]}]
  };
  const options = {spatialOME: true};
  expect(getSpatialMultiscaleLevels({multiscales: [multiscale]}, 'a/values', options)).toEqual([
    {
      id: 'a',
      array: 'a/values',
      group: 'a',
      attributes: {},
      scale: {y: 20, x: 300}
    },
    {
      id: 'b',
      array: 'b/values',
      group: 'b',
      attributes: {},
      scale: {y: 40, x: 600}
    }
  ]);
  expect(getSpatialMultiscaleLevels({ome: {multiscales: [multiscale]}}, 'b', options)).toEqual([
    {id: 'a', array: 'a', attributes: {}, scale: {y: 20, x: 300}},
    {id: 'b', array: 'b', attributes: {}, scale: {y: 40, x: 600}}
  ]);
  expect(getSpatialMultiscaleLevels({multiscales: [multiscale]}, 'other', options)).toEqual([]);
});

test.each([
  [{datasets: [{path: '0'}]}, /named axes/],
  [{axes: ['y', 'y'], datasets: [{path: '0'}]}, /Duplicate OME-NGFF axis/],
  [{axes: OME_AXES, datasets: [{path: '0'}, {path: '0'}]}, /Duplicate OME-NGFF dataset/],
  [{axes: OME_AXES, datasets: [{path: '0'}, {path: '../1'}]}, /relative child/],
  [
    {
      axes: OME_AXES,
      datasets: [{path: '0', coordinateTransformations: [{type: 'affine'}]}]
    },
    /Unsupported OME-NGFF coordinate transformation affine/
  ],
  [
    {
      axes: OME_AXES,
      datasets: [
        {
          path: '0',
          coordinateTransformations: [{type: 'scale', scale: [1]}]
        }
      ]
    },
    /one finite non-zero value per axis/
  ],
  [
    {
      axes: OME_AXES,
      datasets: [
        {
          path: '0',
          coordinateTransformations: [{type: 'scale', scale: [1, 0]}]
        }
      ]
    },
    /one finite non-zero value per axis/
  ]
])('Reject unsupported OME-NGFF multiscales %#', (multiscale, message) => {
  expect(() =>
    getSpatialMultiscaleLevels({multiscales: [multiscale]}, '0', {
      spatialOME: true
    })
  ).toThrow(message);
});

test('Reject an array listed by more than one OME-NGFF multiscale', () => {
  const multiscale = {axes: OME_AXES, datasets: [{path: '0'}]};
  expect(() =>
    getSpatialMultiscaleLevels({multiscales: [multiscale, multiscale]}, '0', {
      spatialOME: true
    })
  ).toThrow(/more than one OME-NGFF multiscale/);
});
