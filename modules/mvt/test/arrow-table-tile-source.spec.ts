// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {createDataSource, load} from '@loaders.gl/core';
import type {CoreAPI} from '@loaders.gl/loader-utils';
import {GeoJSONLoader} from '@loaders.gl/json';
import {ArrowTableTileSourceLoader as ArrowTableTileSourceLoaderMetadata} from '@loaders.gl/mvt';
import {
  ArrowTableTileSourceLoaderWithParser as ArrowTableTileSourceLoader,
  ArrowTableVectorTileSource
} from '@loaders.gl/mvt/arrow-table-tile-source-loader';
import {convertFeaturesToGeoArrowTable, GeometryConverter, getGeoMetadata} from '@loaders.gl/gis';
import type {ArrowTable, Geometry, GeoArrowEncodingPreference} from '@loaders.gl/schema';

const ROOT_TILE = {x: 0, y: 0, z: 0};
const POINT: Geometry = {type: 'Point', coordinates: [-90, 40]};

test('Arrow tile source metadata preloads the runtime through async load', async () => {
  expect(ArrowTableTileSourceLoaderMetadata.testURL()).toBe(false);
  expect(() => ArrowTableTileSourceLoaderMetadata.createDataSource(makeTable([POINT]))).toThrow(
    'requires async load()'
  );
  expect(await ArrowTableTileSourceLoaderMetadata.preload()).toBe(ArrowTableTileSourceLoader);
  expect(ArrowTableTileSourceLoader).not.toHaveProperty('preload');
  const source = await load(
    new Blob([
      JSON.stringify({
        type: 'FeatureCollection',
        features: [{type: 'Feature', geometry: POINT, properties: {identifier: 0}}]
      })
    ]),
    ArrowTableTileSourceLoaderMetadata,
    {core: {worker: false, loaders: [GeoJSONLoader]}}
  );
  expect(source).toBeInstanceOf(ArrowTableVectorTileSource);
  expect((await source.getTile(ROOT_TILE))?.data.numRows).toBe(1);
});

test('Arrow tile source rejects indexing beyond maxZoom', () => {
  expect(
    () =>
      new ArrowTableVectorTileSource(makeTable([POINT]), {
        table: {maxZoom: 1, indexMaxZoom: 2, maxPointsPerTile: 0}
      })
  ).toThrow('indexMaxZoom must be less than or equal to maxZoom');
});

test.each([0, 1])('Arrow tile source enforces maxZoom with indexMaxZoom=%s', async indexMaxZoom => {
  const source = new ArrowTableVectorTileSource(makeTable([POINT]), {
    table: {maxZoom: 1, indexMaxZoom, maxPointsPerTile: 0}
  });
  expect(await source.getMetadata()).toMatchObject({maxZoom: 1});
  expect((await source.getTile({x: 0, y: 0, z: 1}))?.data.numRows).toBe(1);
  expect(source.getTileSync({x: 1, y: 1, z: 2})).toBeNull();
  expect(await source.getTile({x: 1, y: 1, z: 2})).toBeNull();
});

/** Creates a small deterministic geometry table with source row identifiers. */
function makeTable(
  geometries: (Geometry | null)[],
  encodingPreference: GeoArrowEncodingPreference = 'geoarrow.wkb'
): ArrowTable {
  return convertFeaturesToGeoArrowTable(
    geometries.map((geometry, rowIndex) => ({
      type: 'Feature',
      properties: {identifier: rowIndex},
      geometry
    })),
    {encodingPreference}
  );
}

/** Decodes output geometries for behavior assertions only. */
function readGeometries(table: ArrowTable | null): Geometry[] {
  const column = table!.data.getChild('geometry')!;
  return Array.from(
    {length: column.length},
    (_, rowIndex) => GeometryConverter.convert(column.get(rowIndex), 'geojson-geometry') as Geometry
  );
}

test.each([
  'geoarrow.wkb',
  'optimized',
  'geoarrow.geometry'
] as const)('Arrow tile source accepts %s and returns Arrow through every accessor', async encoding => {
  const source = ArrowTableTileSourceLoader.createDataSource(
    Promise.resolve(makeTable([POINT, null], encoding))
  );
  expect(() => source.getTileSync(ROOT_TILE)).toThrow('Await');
  await source.ready;
  for (const tile of [
    source.getTileSync(ROOT_TILE),
    await source.getTile(ROOT_TILE),
    await source.getVectorTile(ROOT_TILE),
    await source.getTileData({index: ROOT_TILE})
  ]) {
    expect(tile?.shape).toBe('arrow-table');
    expect(tile?.data.numRows).toBe(1);
    expect(
      tile?.data.schema.fields
        .find(field => field.name === 'geometry')
        ?.metadata.get('ARROW:extension:name')
    ).toBe('geoarrow.wkb');
    expect(readGeometries(tile)[0]).toMatchObject({
      type: 'Point',
      coordinates: [0.25, expect.any(Number)]
    });
  }
  expect(source.localCoordinates).toBe(true);
  const geometryField = (await source.getSchema()).fields.find(field => field.name === 'geometry');
  expect(geometryField?.metadata?.['ARROW:extension:metadata']).toBe('{}');
  expect(await source.getMetadata()).toMatchObject({
    minZoom: 0,
    maxZoom: 14,
    schema: await source.getSchema()
  });
});

test('Arrow tile source preserves typed, nullable attributes and metadata across batches and slices', async () => {
  const geometry = makeTable([POINT, POINT, POINT]).data.getChild('geometry')!;
  const columns = {
    geometry,
    identifier: arrow.vectorFromArray(
      [9007199254740993n, null, 9007199254740995n],
      new arrow.Int64()
    ),
    category: arrow.vectorFromArray(
      ['alpha', 'beta', 'alpha'],
      new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32())
    ),
    nested: arrow.vectorFromArray(
      [{value: 1}, {value: 2}, {value: 3}],
      new arrow.Struct([new arrow.Field('value', new arrow.Int32())])
    ),
    values: arrow.vectorFromArray(
      [[1, 2], null, [3]],
      new arrow.List(new arrow.Field('item', new arrow.Int32()))
    )
  };
  const fields = Object.entries(columns).map(
    ([name, vector]) =>
      new arrow.Field(
        name,
        vector.type,
        true,
        name === 'geometry'
          ? new Map([['ARROW:extension:name', 'geoarrow.wkb']])
          : new Map([['label', name]])
      )
  );
  const table = new arrow.Table(new arrow.Schema(fields, new Map([['owner', 'test']])), columns);
  const input = table.slice(0, 1).concat(table.slice(1)).slice(1);
  const source = new ArrowTableVectorTileSource(input);
  const tile = (await source.getTile(ROOT_TILE))!;
  expect(tile.data.getChild('identifier')?.toArray()).toEqual(
    input.getChild('identifier')?.toArray()
  );
  expect(tile.data.getChild('identifier')?.get(0)).toBeNull();
  expect(tile.data.getChild('identifier')?.get(1)).toBe(9007199254740995n);
  expect([...tile.data.getChild('category')!]).toEqual(['beta', 'alpha']);
  expect(tile.data.getChild('nested')?.get(1).toJSON()).toEqual({value: 3});
  expect(tile.data.getChild('values')?.get(0)).toBeNull();
  expect([...tile.data.getChild('values')?.get(1)]).toEqual([3]);
  expect(tile.data.schema.metadata.get('owner')).toBe('test');
  expect(tile.data.schema.fields[1].metadata.get('label')).toBe('identifier');
  expect(tile.data.schema.fields[2].type).toEqual(input.schema.fields[2].type);
});

test('Arrow tile source preserves polygon holes and separate polygons without mutating cached tiles', async () => {
  const ring = [
    [-80, 10],
    [-20, 10],
    [-20, 50],
    [-80, 50],
    [-80, 10]
  ];
  const hole = [
    [-70, 20],
    [-70, 30],
    [-50, 30],
    [-50, 20],
    [-70, 20]
  ];
  const otherRing = [
    [20, 10],
    [40, 10],
    [40, 30],
    [20, 30],
    [20, 10]
  ];
  const input = makeTable([{type: 'MultiPolygon', coordinates: [[ring, hole], [otherRing]]}]);
  const before = input.data.getChild('geometry')!.get(0).slice();
  const source = new ArrowTableVectorTileSource(input, {
    table: {coordinates: 'wgs84', tolerance: 0}
  });
  const first = readGeometries(await source.getTile(ROOT_TILE));
  expect(first[0].type).toBe('MultiPolygon');
  expect(
    (first[0] as {coordinates: number[][][][]}).coordinates.map(polygon => polygon.length)
  ).toEqual([2, 1]);
  await source.getTile({x: 0, y: 0, z: 1});
  expect(readGeometries(await source.getTile(ROOT_TILE))).toEqual(first);
  expect(readGeometries(await source.getTile({x: 1, y: 0, z: 0}))).toEqual(first);
  expect(input.data.getChild('geometry')!.get(0)).toEqual(before);
  expect(
    getGeoMetadata((await source.getTile(ROOT_TILE))!.data.schema.metadata)?.columns.geometry.crs
  ).toBeUndefined();
});

test.each([
  'geoarrow.wkb',
  'optimized',
  'geoarrow.geometry'
] as const)('Arrow tile source clips mixed %s geometries and duplicates attributes for collections', async encoding => {
  const input = makeTable(
    [
      {
        type: 'MultiPoint',
        coordinates: [
          [-90, 40],
          [90, 40]
        ]
      },
      {
        type: 'MultiLineString',
        coordinates: [
          [
            [-100, 20],
            [100, 20]
          ],
          [
            [-100, 30],
            [100, 30]
          ]
        ]
      },
      {
        type: 'Polygon',
        coordinates: [
          [
            [-90, 10],
            [90, 10],
            [90, 50],
            [-90, 50],
            [-90, 10]
          ]
        ]
      },
      {
        type: 'GeometryCollection',
        geometries: [
          POINT,
          {
            type: 'LineString',
            coordinates: [
              [-80, 30],
              [-40, 30]
            ]
          }
        ]
      }
    ],
    encoding
  );
  const source = new ArrowTableVectorTileSource(input, {
    table: {buffer: 0, tolerance: 0, indexMaxZoom: 0}
  });
  const tile = (await source.getTile({x: 0, y: 0, z: 1}))!;
  expect([...tile.data.getChild('identifier')!]).toEqual([0, 1, 2, 3, 3]);
  expect(readGeometries(tile).map(geometry => geometry.type)).toEqual([
    'Point',
    'MultiLineString',
    'Polygon',
    'Point',
    'LineString'
  ]);
  const coordinates = readGeometries(tile)[2] as {coordinates: number[][][]};
  expect(Math.max(...coordinates.coordinates[0].map(point => point[0]))).toBe(1);
});

test('Arrow tile source supports WKT and GeoParquet-only geometry metadata', async () => {
  for (const useExtension of [true, false]) {
    const field = new arrow.Field(
      'geometry',
      new arrow.Utf8(),
      true,
      new Map(useExtension ? [['ARROW:extension:name', 'geoarrow.wkt']] : [])
    );
    const metadata = new Map([
      [
        'geo',
        JSON.stringify({
          primary_column: 'geometry',
          columns: {geometry: {encoding: 'WKT', geometry_types: ['Point'], bbox: [0, 0, 1, 1]}}
        })
      ]
    ]);
    const input = new arrow.Table(new arrow.Schema([field], metadata), {
      geometry: arrow.vectorFromArray(['POINT (0 0)'], new arrow.Utf8())
    });
    const tile = (await new ArrowTableVectorTileSource(input).getTile(ROOT_TILE))!;
    expect(readGeometries(tile)).toEqual([{type: 'Point', coordinates: [0.5, 0.5]}]);
    expect(getGeoMetadata(tile.data.schema.metadata)?.columns.geometry).toEqual({
      encoding: 'wkb',
      geometry_types: [],
      crs: null
    });
  }
});

test('Arrow tile source loads URLs and blobs through injected core and works through createDataSource', async () => {
  const table = makeTable([POINT]);
  const load = vi.fn().mockResolvedValue(table);
  const coreApi = {load} as unknown as CoreAPI;
  for (const input of ['memory.geojson', new Blob(['{}'])]) {
    const source = ArrowTableTileSourceLoader.createDataSource(
      input,
      {core: {worker: false, loaders: [GeoJSONLoader]}},
      coreApi
    );
    expect((await source.getTile(ROOT_TILE))?.data.numRows).toBe(1);
    expect(load).toHaveBeenLastCalledWith(input, GeoJSONLoader, {
      core: {worker: false},
      table: {coordinates: 'local'}
    });
  }
  const source = createDataSource(table, [ArrowTableTileSourceLoader], {});
  expect((await source.getVectorTile(ROOT_TILE))?.shape).toBe('arrow-table');
  const blobSource = createDataSource(
    new Blob(
      [
        JSON.stringify({
          type: 'FeatureCollection',
          features: [{type: 'Feature', geometry: POINT, properties: {}}]
        })
      ],
      {type: 'application/geo+json'}
    ),
    [ArrowTableTileSourceLoader],
    {core: {worker: false, loaders: [GeoJSONLoader]}}
  );
  expect((await blobSource.getTile(ROOT_TILE))?.data.numRows).toBe(1);
});

test('Arrow tile source selects a named geometry column and retains other geometries unchanged', async () => {
  const geometry = makeTable([POINT]).data.getChild('geometry')!;
  const fields = ['original', 'selected'].map(
    name =>
      new arrow.Field(
        name,
        geometry.type,
        true,
        new Map([
          ['ARROW:extension:name', 'geoarrow.wkb'],
          ['ARROW:extension:metadata', JSON.stringify({crs: {id: {authority: 'EPSG', code: 4326}}})]
        ])
      )
  );
  const input = new arrow.Table(new arrow.Schema(fields), {original: geometry, selected: geometry});
  await expect(new ArrowTableVectorTileSource(input).ready).rejects.toThrow('geometryColumn');
  const source = new ArrowTableVectorTileSource(input, {table: {geometryColumn: 'selected'}});
  const tile = (await source.getTile(ROOT_TILE))!;
  expect(tile.data.getChild('original')!.get(0)).toEqual(geometry.get(0));
  expect(tile.data.getChild('selected')!.get(0)).not.toEqual(geometry.get(0));
  expect(getGeoMetadata(tile.data.schema.metadata)?.primary_column).toBe('selected');
});

test('Arrow tile source writes a geometry-only multipoint table', async () => {
  const table = makeTable([
    {
      type: 'MultiPoint',
      coordinates: [
        [-90, 0],
        [90, 0]
      ]
    }
  ]).data.select(['geometry']);
  const source = new ArrowTableVectorTileSource(table, {table: {coordinates: 'EPSG:4326'}});
  const tile = await source.getTile(ROOT_TILE);
  expect(readGeometries(tile)).toEqual([
    {
      type: 'MultiPoint',
      coordinates: [
        [-90, 0],
        [90, 0]
      ]
    }
  ]);
  expect(source.localCoordinates).toBe(false);
});

test('Arrow tile source returns null for empty and invalid tiles', async () => {
  const empty = new ArrowTableVectorTileSource(makeTable([null]));
  expect(await empty.getTile(ROOT_TILE)).toBeNull();
  const source = new ArrowTableVectorTileSource(makeTable([POINT]));
  for (const index of [
    {x: 0, y: 0, z: -1},
    {x: 0, y: 0, z: 25},
    {x: 0.5, y: 0, z: 1},
    {x: 0, y: -1, z: 1},
    {x: 0, y: 2, z: 1},
    {x: 1, y: 1, z: 1}
  ]) {
    expect(await source.getTile(index)).toBeNull();
  }
});

test('Arrow tile source rejects invalid inputs and geometry declarations', async () => {
  await expect(new ArrowTableVectorTileSource('missing.arrow').ready).rejects.toThrow(
    'core.loaders'
  );
  await expect(new ArrowTableVectorTileSource({} as ArrowTable).ready).rejects.toThrow(
    'requires an Arrow table'
  );
  await expect(
    new ArrowTableVectorTileSource(new arrow.Table({value: arrow.vectorFromArray([1])})).ready
  ).rejects.toThrow('geometryColumn');
  const table = makeTable([POINT]).data;
  for (const [extension, metadata, message] of [
    ['geoarrow.box', '{}', 'Unsupported geometry encoding'],
    ['geoarrow.wkb', '{"crs":"EPSG:3857"}', 'reproject before tiling']
  ]) {
    const fields = table.schema.fields.map(field =>
      field.name === 'geometry'
        ? new arrow.Field(
            field.name,
            field.type,
            true,
            new Map([
              ['ARROW:extension:name', extension],
              ['ARROW:extension:metadata', metadata]
            ])
          )
        : field
    );
    const input = new arrow.Table(new arrow.Schema(fields), {
      geometry: table.getChild('geometry')!,
      identifier: table.getChild('identifier')!
    });
    await expect(new ArrowTableVectorTileSource(input).ready).rejects.toThrow(message);
  }
  for (const options of [{maxZoom: 25}, {indexMaxZoom: -1}, {extent: 0}, {tolerance: -1}]) {
    expect(() => new ArrowTableVectorTileSource(table, {table: options})).toThrow();
  }
});
