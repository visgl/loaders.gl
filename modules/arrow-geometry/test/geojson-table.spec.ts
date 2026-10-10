// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {convertGeoArrowTableToGeoJSON} from '../src/geojson-table';
import {convertGeometryToWKB} from '../src/geometry-codecs';

/** Creates a tiny table with explicit extension and optional GeoParquet metadata. */
function makeTable(
  columns: Record<string, arrow.Vector>,
  encodings: Record<string, string>,
  primaryColumn?: string
): arrow.Table {
  const fields = Object.entries(columns).map(
    ([name, vector]) =>
      new arrow.Field(
        name,
        vector.type,
        true,
        new Map(encodings[name] ? [['ARROW:extension:name', encodings[name]]] : [])
      )
  );
  const metadata = primaryColumn
    ? new Map([
        [
          'geo',
          JSON.stringify({
            version: '1.1.0',
            primary_column: primaryColumn,
            columns: Object.fromEntries(
              Object.entries(encodings).map(([name, encoding]) => [name, {encoding}])
            )
          })
        ]
      ])
    : new Map<string, string>();
  return new arrow.Table(new arrow.Schema(fields, metadata), columns);
}

/** Converts a table with its associated loaders.gl schema. */
function convertTable(table: arrow.Table) {
  return convertGeoArrowTableToGeoJSON(table, convertArrowToSchema(table.schema));
}

test.each([
  'geoarrow.point',
  'point',
  'POINT'
])('native encoding %s preserves empty points and null rows', encoding => {
  const coordinateType = new arrow.Struct([
    new arrow.Field('x', new arrow.Float64(), true),
    new arrow.Field('y', new arrow.Float64(), true),
    new arrow.Field('m', new arrow.Float64(), true)
  ]);
  const geometry = arrow.vectorFromArray(
    [{x: 1, y: 2, m: 3}, {x: NaN, y: NaN, m: NaN}, {x: null, y: null, m: null}, null],
    coordinateType
  );
  const table = makeTable({geometry}, {geometry: encoding}, 'geometry');
  expect(convertTable(table).features.map(feature => feature.geometry)).toEqual([
    {type: 'Point', coordinates: [1, 2, 3]},
    {type: 'Point', coordinates: []},
    {type: 'Point', coordinates: []},
    null
  ]);
});

test.each([
  'WKB',
  'geoarrow.WKB'
])('serialized encoding %s preserves sliced bytes and nulls', encoding => {
  const bytes = new Uint8Array(
    convertGeometryToWKB({type: 'Point', coordinates: [1, 2, 3, 4]}, {hasZ: true, hasM: true})
  );
  const paddedBytes = new Uint8Array(bytes.length + 4);
  paddedBytes.set(bytes, 2);
  const geometry = arrow.vectorFromArray(
    [paddedBytes.subarray(2, bytes.length + 2), null],
    new arrow.Binary()
  );
  const table = makeTable({geometry}, {geometry: encoding});
  expect(convertTable(table).features.map(feature => feature.geometry)).toEqual([
    {type: 'Point', coordinates: [1, 2, 3, 4]},
    null
  ]);
});

test.each([
  'WKT',
  'geoarrow.WKT'
])('serialized encoding %s preserves dimensions and empty geometries', encoding => {
  const geometry = arrow.vectorFromArray(
    ['POINT ZM (1 2 3 4)', 'POINT EMPTY', null],
    new arrow.Utf8()
  );
  const table = makeTable({geometry}, {geometry: encoding});
  expect(convertTable(table).features.map(feature => feature.geometry)).toEqual([
    {type: 'Point', coordinates: [1, 2, 3, 4]},
    {type: 'Point', coordinates: []},
    null
  ]);
});

test('properties are JSON-safe, preserve integer precision, and omit secondary geometry columns', () => {
  const geometry = arrow.vectorFromArray(['POINT (1 2)', null], new arrow.Utf8());
  const details = arrow.vectorFromArray(
    [
      {name: 'first', values: [1, 2]},
      {name: 'second', values: []}
    ],
    new arrow.Struct([
      new arrow.Field('name', new arrow.Utf8(), true),
      new arrow.Field(
        'values',
        new arrow.List(new arrow.Field('item', new arrow.Int32(), true)),
        true
      )
    ])
  );
  const table = makeTable(
    {
      secondary: geometry,
      geometry,
      details,
      identifier: arrow.vectorFromArray([9007199254740993n, null], new arrow.Int64()),
      bytes: arrow.vectorFromArray([new Uint8Array([3, 4]), null], new arrow.Binary())
    },
    {secondary: 'WKT', geometry: 'geoarrow.wkt'},
    'geometry'
  );
  const result = convertTable(table);
  expect(result.features[0].properties).toEqual({
    details: {name: 'first', values: [1, 2]},
    identifier: '9007199254740993',
    bytes: [3, 4]
  });
  expect(result.features[1].properties).toEqual({
    details: {name: 'second', values: []},
    identifier: null,
    bytes: null
  });
  expect(JSON.parse(JSON.stringify(result.features))).toEqual(result.features);
});

test('invalid primary metadata falls back to a recognized extension', () => {
  const table = makeTable(
    {
      label: arrow.vectorFromArray(['value']),
      geometry: arrow.vectorFromArray(['POINT (1 2)'])
    },
    {geometry: 'geoarrow.wkt'},
    'label'
  );
  expect(convertTable(table).features[0]).toMatchObject({
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: {label: 'value'}
  });
});

test('tables without geometry metadata fail clearly', () => {
  expect(() => convertTable(makeTable({value: arrow.vectorFromArray([1])}, {}))).toThrow(
    'No GeoArrow geometry column found in schema'
  );
});

test('chunked and sliced native MultiPoints retain empty members', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('xy', new arrow.Float64(), true)
  );
  const geometryType = new arrow.List(new arrow.Field('vertices', coordinateType, true));
  const firstChunk = arrow
    .vectorFromArray(
      [
        [[9, 9]],
        [
          [1, 2],
          [NaN, NaN]
        ]
      ],
      geometryType
    )
    .slice(1);
  const secondChunk = arrow.vectorFromArray([[], null], geometryType);
  const geometry = new arrow.Vector([...firstChunk.data, ...secondChunk.data]);
  expect(
    convertTable(makeTable({geometry}, {geometry: 'multipoint'})).features.map(
      feature => feature.geometry
    )
  ).toEqual([
    {type: 'MultiPoint', coordinates: [[1, 2], []]},
    {type: 'MultiPoint', coordinates: []},
    null
  ]);
});

test.each([
  'interleaved',
  'separated'
])('sliced %s Point tables preserve physical views and validity offsets', layout => {
  const coordinateType =
    layout === 'interleaved'
      ? new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64(), true))
      : new arrow.Struct([
          new arrow.Field('x', new arrow.Float64(), true),
          new arrow.Field('y', new arrow.Float64(), true)
        ]);
  const coordinates = [[9, 9], [1, 2], null, [3, 4], [NaN, NaN]];
  const values =
    layout === 'interleaved'
      ? coordinates
      : coordinates.map(coordinate => (coordinate ? {x: coordinate[0], y: coordinate[1]} : null));
  const geometry = arrow.vectorFromArray(values, coordinateType);
  const table = makeTable({geometry}, {geometry: 'geoarrow.point'}).slice(1, 5);
  expect(table.getChild('geometry')?.data[0].offset).toBeGreaterThan(0);
  expect(convertTable(table).features.map(feature => feature.geometry)).toEqual([
    {type: 'Point', coordinates: [1, 2]},
    null,
    {type: 'Point', coordinates: [3, 4]},
    {type: 'Point', coordinates: []}
  ]);
});
