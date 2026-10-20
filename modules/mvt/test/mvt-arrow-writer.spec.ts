// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import Protobuf from 'pbf';
import {encode, parse} from '@loaders.gl/core';
import {MVTLoader, MVTWriter} from '@loaders.gl/mvt';
import {convertFeaturesToGeoArrowTable} from '@loaders.gl/arrow-geometry/feature-table';
import type {Geometry} from '@loaders.gl/core/schema';
import {VectorTile} from '../src/lib/vector-tile/vector-tile';

/** Small WKB geometry tables; properties may span dictionary, sliced and nullable vectors. */
function makeTable(
  geometries: (Geometry | null)[],
  columns: Record<string, arrow.Vector> = {}
): arrow.Table {
  const table = convertFeaturesToGeoArrowTable(
    geometries.map(geometry => ({type: 'Feature', geometry, properties: {}})),
    {encodingPreference: 'geoarrow.wkb'}
  ).data;
  return new arrow.Table(
    new arrow.Schema(
      table.schema.fields.concat(
        Object.entries(columns).map(([name, vector]) => new arrow.Field(name, vector.type, true))
      )
    ),
    {geometry: table.getChild('geometry')!, ...columns}
  );
}

/** Uses the production parser only for integration; raw MVT inspection also checks version and IDs. */
async function readFeatures(data: ArrayBuffer) {
  return (
    await parse(data, MVTLoader, {
      core: {worker: false},
      mvt: {shape: 'geojson-table', coordinates: 'local', layerProperty: 'layer'}
    })
  ).features;
}

test('Arrow MVT reads dictionaries, nullable columns and multiple sliced batches directly', async () => {
  const points: Geometry[] = Array.from({length: 3}, () => ({
    type: 'Point',
    coordinates: [0.25, 0.5]
  }));
  const input = makeTable(points, {
    name: arrow.vectorFromArray(
      ['a', 'b', 'c'],
      new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32())
    ),
    value: arrow.vectorFromArray([12, null, 1.5], new arrow.Float64()),
    id: arrow.vectorFromArray([1n, 2n, 3n], new arrow.Int64()),
    enabled: arrow.vectorFromArray([true, null, false], new arrow.Bool()),
    empty: arrow.vectorFromArray([null, null, null], new arrow.Null())
  });
  const table = input.slice(1, 2).concat(input.slice(2));
  const bytes = await encode(table, MVTWriter, {mvt: {layerName: 'points', idColumn: 'id'}});
  const features = await readFeatures(bytes);
  expect(features.map(feature => feature.id)).toEqual([2, 3]);
  expect(features[0].geometry).toEqual({type: 'Point', coordinates: [0.25, 0.5]});
  expect(features[0].properties).toEqual({name: 'b', id: 2, layer: 'points'});
  expect(features[1].properties).toEqual({
    name: 'c',
    value: 1.5,
    id: 3,
    enabled: false,
    layer: 'points'
  });
  const raw = new VectorTile(new Protobuf(new Uint8Array(bytes)));
  expect(raw.layers.points.version).toBe(2);
  expect(input.getChild('name')!.get(0)).toBe('a');
});

test.each([
  {type: 'Point', coordinates: [0.25, 0.5]},
  {
    type: 'MultiPoint',
    coordinates: [
      [0.25, 0.5],
      [0.5, 0.75]
    ]
  },
  {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [0.5, 0.5],
      [1, 1]
    ]
  },
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [0.5, 0.5]
      ],
      [
        [0.5, 0],
        [1, 0.5]
      ]
    ]
  },
  {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ],
      [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.75, 0.75],
        [0.25, 0.75],
        [0.25, 0.25]
      ]
    ]
  },
  {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [0, 0.25],
          [0.25, 0.25],
          [0.25, 0],
          [0, 0]
        ]
      ],
      [
        [
          [0.5, 0.5],
          [0.5, 0.75],
          [0.75, 0.75],
          [0.75, 0.5],
          [0.5, 0.5]
        ]
      ]
    ]
  }
] as Geometry[])('Arrow MVT encodes $type and keeps polygon holes', async geometry => {
  const bytes = MVTWriter.encodeSync(makeTable([geometry]));
  const features = await readFeatures(bytes);
  expect(features).toHaveLength(1);
  expect(features[0].geometry.type).toBe(geometry.type);
  if (geometry.type === 'Polygon') expect(features[0].geometry.coordinates).toHaveLength(2);
});

test('Arrow MVT local coordinates preserve clipping buffer and explicit tile coordinates', async () => {
  const table = makeTable([{type: 'Point', coordinates: [-0.25, 1.25]}]);
  const raw = new VectorTile(
    new Protobuf(new Uint8Array(MVTWriter.encodeSync(table, {mvt: {extent: 256}})))
  );
  expect(raw.layers.geojsonLayer.getGeoJSONFeature(0).loadGeometry()[0][0]).toEqual([-64, 320]);
  const tileUnits = makeTable([{type: 'Point', coordinates: [64, 128]}]);
  expect(
    (
      await readFeatures(MVTWriter.encodeSync(tileUnits, {mvt: {extent: 256, coordinates: 'tile'}}))
    )[0].geometry.coordinates
  ).toEqual([0.25, 0.5]);
});

test('Arrow MVT explicitly projects degree values near zero and clamps Mercator poles', async () => {
  const table = makeTable([
    {type: 'Point', coordinates: [0, 0]},
    {type: 'Point', coordinates: [0, 90]}
  ]);
  const features = await readFeatures(
    MVTWriter.encodeSync(table, {mvt: {coordinates: 'wgs84', tileIndex: {z: 0, x: 0, y: 0}}})
  );
  expect(features[0].geometry.coordinates).toEqual([0.5, 0.5]);
  expect(features[1].geometry.coordinates).toEqual([0.5, 0]);
});

test('Arrow MVT scalar selection avoids implicit stringification and handles prototype-like keys', async () => {
  const table = makeTable([{type: 'Point', coordinates: [0, 0]}], {
    constructor: arrow.vectorFromArray(['reserved'], new arrow.Utf8()),
    ['__proto__']: arrow.vectorFromArray(['prototype key'], new arrow.Utf8()),
    nested: arrow.vectorFromArray(
      [{value: 1}],
      new arrow.Struct([new arrow.Field('value', new arrow.Int32())])
    )
  });
  expect(() => MVTWriter.encodeSync(table)).toThrow('Unsupported MVT property');
  const bytes = MVTWriter.encodeSync(table, {
    mvt: {layerName: '__proto__', propertyColumns: ['constructor', '__proto__']}
  });
  const raw = new VectorTile(new Protobuf(new Uint8Array(bytes)));
  expect(raw.layers.__proto__.getGeoJSONFeature(0).properties.constructor).toBe('reserved');
  expect(raw.layers.__proto__.getGeoJSONFeature(0).properties.__proto__).toBe('prototype key');
});

test('Arrow MVT safe integer extrema round trip without signed zigzag loss', async () => {
  const table = makeTable([{type: 'Point', coordinates: [0, 0]}], {
    minimum: arrow.vectorFromArray([BigInt(Number.MIN_SAFE_INTEGER)], new arrow.Int64()),
    maximum: arrow.vectorFromArray([BigInt(Number.MAX_SAFE_INTEGER)], new arrow.Int64())
  });
  expect((await readFeatures(MVTWriter.encodeSync(table)))[0].properties).toMatchObject({
    minimum: Number.MIN_SAFE_INTEGER,
    maximum: Number.MAX_SAFE_INTEGER
  });
});

test.each([
  9007199254740993n,
  -9007199254740993n
])('Arrow MVT rejects precision loss for %s', value => {
  const table = makeTable([{type: 'Point', coordinates: [0, 0]}], {
    value: arrow.vectorFromArray([value], new arrow.Int64())
  });
  expect(() => MVTWriter.encodeSync(table)).toThrow('safe integer');
});

test.each([
  {extent: 0},
  {extent: 65537},
  {version: 3},
  {maxFeatures: 0},
  {coordinates: 'unknown'},
  {coordinates: 'wgs84'},
  {coordinates: 'wgs84', tileIndex: {z: 1, x: 2, y: 0}},
  {propertyColumns: ['missing']},
  {propertyColumns: ['geometry']},
  {propertyColumns: ['id', 'id']},
  {geometryColumn: 'missing'},
  {idColumn: 'missing'},
  {layerName: ''}
])('Arrow MVT rejects invalid configuration %j', configuration => {
  const table = makeTable([{type: 'Point', coordinates: [0, 0]}], {id: arrow.vectorFromArray([1])});
  expect(() => MVTWriter.encodeSync(table, {mvt: configuration as any})).toThrow();
});

test.each([
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1
])('Arrow MVT rejects invalid scalar %s', value => {
  const table = makeTable([{type: 'Point', coordinates: [0, 0]}], {
    value: arrow.vectorFromArray([value], new arrow.Float64())
  });
  expect(() => MVTWriter.encodeSync(table)).toThrow('number');
});

test.each([-1, 'text', 1.5])('Arrow MVT rejects invalid feature ID %s', id => {
  const table = makeTable([{type: 'Point', coordinates: [0, 0]}], {
    id: arrow.vectorFromArray([id])
  });
  expect(() => MVTWriter.encodeSync(table, {mvt: {idColumn: 'id', propertyColumns: []}})).toThrow(
    'IDs'
  );
});

test('Arrow MVT drops collapsed paths and empty or null geometry', () => {
  const table = makeTable([
    null,
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [0.00001, 0.00001]
      ]
    },
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 0.00001],
          [0.00001, 0.00001],
          [0, 0]
        ]
      ]
    }
  ]);
  expect(MVTWriter.encodeSync(table).byteLength).toBe(0);
});

test('Arrow MVT honors geographic CRS metadata and GeoParquet-only WKB declarations', async () => {
  const base = makeTable([{type: 'Point', coordinates: [0, 0]}]);
  const field = new arrow.Field('geometry', new arrow.Binary(), true);
  const schema = new arrow.Schema(
    [field],
    new Map([
      [
        'geo',
        JSON.stringify({
          version: '1.1.0',
          primary_column: 'geometry',
          columns: {geometry: {encoding: 'WKB', geometry_types: ['Point']}}
        })
      ]
    ])
  );
  const table = new arrow.Table(schema, {geometry: base.getChild('geometry')!});
  expect(() => MVTWriter.encodeSync(table)).toThrow('geographic CRS');
  expect(
    (
      await readFeatures(
        MVTWriter.encodeSync(table, {mvt: {coordinates: 'wgs84', tileIndex: {z: 0, x: 0, y: 0}}})
      )
    )[0].geometry.coordinates
  ).toEqual([0.5, 0.5]);
  const projectedField = new arrow.Field(
    'geometry',
    new arrow.Binary(),
    true,
    new Map([
      ['ARROW:extension:name', 'geoarrow.wkb'],
      ['ARROW:extension:metadata', JSON.stringify({crs: 'EPSG:3857'})]
    ])
  );
  const projected = new arrow.Table(new arrow.Schema([projectedField]), {
    geometry: base.getChild('geometry')!
  });
  expect(() => MVTWriter.encodeSync(projected)).toThrow('Reproject');
});

test('Arrow MVT detects row limits, nullable IDs and collapsed holes', async () => {
  const points = makeTable(
    [
      {type: 'Point', coordinates: [0, 0]},
      {type: 'Point', coordinates: [1, 1]}
    ],
    {id: arrow.vectorFromArray([null, 5], new arrow.Int32())}
  );
  expect(() => MVTWriter.encodeSync(points, {mvt: {maxFeatures: 1}})).toThrow('feature limit');
  const features = await readFeatures(MVTWriter.encodeSync(points, {mvt: {idColumn: 'id'}}));
  expect(features[0].id).toBeUndefined();
  expect(features[1].id).toBe(5);
  const polygon = makeTable([
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1]
        ],
        [
          [0.5, 0.5],
          [0.500001, 0.5],
          [0.500001, 0.500001],
          [0.5, 0.5]
        ]
      ]
    }
  ]);
  expect((await readFeatures(MVTWriter.encodeSync(polygon)))[0].geometry.coordinates).toHaveLength(
    1
  );
});

test.each([
  {type: 'Point', coordinates: [NaN, 0]},
  {type: 'Point', coordinates: [0, 0, 1]},
  {type: 'Point', coordinates: [1073741824, 0]},
  {type: 'GeometryCollection', geometries: [{type: 'Point', coordinates: [0, 0]}]}
] as Geometry[])('Arrow MVT rejects unsupported dimensionality or coordinate ranges %j', geometry => {
  expect(() => MVTWriter.encodeSync(makeTable([geometry]), {mvt: {coordinates: 'tile'}})).toThrow();
});

test('Arrow MVT requires WKB input and explicitly selects among geometry columns', () => {
  const table = makeTable([{type: 'Point', coordinates: [0, 0]}]);
  const nativeField = new arrow.Field(
    'geometry',
    new arrow.Binary(),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.point']])
  );
  const native = new arrow.Table(new arrow.Schema([nativeField]), {
    geometry: table.getChild('geometry')!
  });
  expect(() => MVTWriter.encodeSync(native, {mvt: {geometryColumn: 'geometry'}})).toThrow(
    'requires GeoArrow WKB'
  );
  const second = new arrow.Field(
    'other',
    new arrow.Binary(),
    true,
    table.schema.fields[0].metadata
  );
  const ambiguous = new arrow.Table(new arrow.Schema([...table.schema.fields, second]), {
    geometry: table.getChild('geometry')!,
    other: table.getChild('geometry')!
  });
  expect(() => MVTWriter.encodeSync(ambiguous)).toThrow('Select one');
  expect(
    MVTWriter.encodeSync(ambiguous, {mvt: {geometryColumn: 'geometry'}}).byteLength
  ).toBeGreaterThan(0);
});

test('Arrow MVT keeps a small valid polygon at large quantized offsets', async () => {
  const table = makeTable([
    {
      type: 'Polygon',
      coordinates: [
        [
          [1000000000, 1000000000],
          [1000000002, 1000000000],
          [1000000002, 1000000002],
          [1000000000, 1000000002],
          [1000000000, 1000000000]
        ]
      ]
    }
  ]);
  const features = await readFeatures(MVTWriter.encodeSync(table, {mvt: {coordinates: 'tile'}}));
  expect(features).toHaveLength(1);
  expect(features[0].geometry.type).toBe('Polygon');
});
