// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {Feature, Geometry, Schema} from '@loaders.gl/schema';
import {
  applyLegacyGeoJSONCRSToSchema,
  convertFeaturesToGeoArrowTable,
  isGeoJSONFeatureArray,
  isGeoJSONFeatureCollection,
  makeGeoArrowFeatureRows,
  makeGeoArrowFeatureSchema,
  resolveGeoArrowEncodingPreference
} from '../../src/lib/table-converters/convert-geojson-to-geoarrow';

/** Wraps tiny geometry values in GeoJSON features. */
function makeFeatures(geometries: (Geometry | null)[]): Feature[] {
  return geometries.map(geometry => ({type: 'Feature', properties: {}, geometry}));
}

/** Converts nested Arrow scalars to ordinary values without hiding nulls. */
function readArrowValue(value: unknown): unknown {
  if (value instanceof arrow.Vector) {
    return Array.from({length: value.length}, (_, index) => readArrowValue(value.get(index)));
  }
  if (ArrayBuffer.isView(value)) return Array.from(value as unknown as ArrayLike<number>);
  return value;
}

test('GeoJSON guards distinguish feature arrays, empty collections, and incomplete objects', () => {
  const features = makeFeatures([null]);
  expect(isGeoJSONFeatureArray(features)).toBe(true);
  for (const value of [null, {}, [], [null], [{type: 'Feature', geometry: null}]]) {
    expect(isGeoJSONFeatureArray(value)).toBe(false);
  }
  expect(isGeoJSONFeatureCollection({type: 'FeatureCollection', features: []})).toBe(true);
  for (const value of [
    null,
    0,
    'FeatureCollection',
    {},
    {type: 'FeatureCollection', features: {}}
  ]) {
    expect(isGeoJSONFeatureCollection(value)).toBe(false);
  }
  expect(resolveGeoArrowEncodingPreference()).toBeUndefined();
  expect(resolveGeoArrowEncodingPreference({encodingPreference: 'optimized'})).toBe('optimized');
  expect(
    resolveGeoArrowEncodingPreference({
      encodingPreference: 'optimized',
      geoarrow: {encodingPreference: 'geoarrow.geometry'}
    })
  ).toBe('geoarrow.geometry');
});

test('GeoJSON rows preserve primitive values, normalize complex properties, and encode null WKT', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [-1.25, 0]},
      properties: {
        number: 0,
        flag: false,
        text: '',
        missing: undefined,
        nil: null,
        date: new Date('2020-01-02T03:04:05Z'),
        array: [1, null],
        object: {name: 'a'}
      }
    },
    {type: 'Feature', geometry: null, properties: null}
  ];
  expect(
    makeGeoArrowFeatureRows(features, {encoding: 'wkt', geometryColumnName: 'location'})
  ).toEqual([
    {
      number: 0,
      flag: false,
      text: '',
      missing: null,
      nil: null,
      date: '2020-01-02T03:04:05.000Z',
      array: '[1,null]',
      object: '{"name":"a"}',
      location: 'POINT (-1.25 0)'
    },
    {location: null}
  ]);
  const schema = makeGeoArrowFeatureSchema(features, {
    encoding: 'wkt',
    geometryColumnName: 'location'
  });
  expect(schema.fields.map(field => [field.name, field.type, field.nullable])).toEqual([
    ['number', 'float64', true],
    ['flag', 'bool', true],
    ['text', 'utf8', true],
    ['missing', 'null', true],
    ['nil', 'null', true],
    ['date', 'utf8', true],
    ['array', 'utf8', true],
    ['object', 'utf8', true],
    ['location', 'utf8', true]
  ]);
  expect(JSON.parse(schema.metadata!.geo).columns.location).toEqual({
    encoding: 'wkt',
    geometry_types: ['Point']
  });
  expect(makeGeoArrowFeatureSchema([], {encoding: 'wkt'}).fields).toHaveLength(1);
});

test('GeoJSON conversion rejects property type conflicts and custom geometry collisions', () => {
  expect(() =>
    makeGeoArrowFeatureSchema([
      {...makeFeatures([null])[0], properties: {value: 1}},
      {...makeFeatures([null])[0], properties: {value: '1'}}
    ])
  ).toThrow('incompatible property types float64 and utf8');
  const features = [{...makeFeatures([null])[0], properties: {location: null}}];
  expect(() => makeGeoArrowFeatureRows(features, {geometryColumnName: 'location'})).toThrow(
    'conflicts with the geometry column name'
  );
  expect(() => makeGeoArrowFeatureSchema(features, {geometryColumnName: 'location'})).toThrow(
    'conflicts with the geometry column name'
  );
  expect(() =>
    convertFeaturesToGeoArrowTable(features, {
      geometryColumnName: 'location',
      encodingPreference: 'optimized'
    })
  ).toThrow('conflicts with the geometry column name');
});

test.each([
  [
    'LineString',
    'MultiLineString',
    'geoarrow.multilinestring',
    [
      [0, 1],
      [2, 3]
    ],
    [
      [
        [4, 5],
        [6, 7]
      ]
    ]
  ],
  [
    'Polygon',
    'MultiPolygon',
    'geoarrow.multipolygon',
    [
      [
        [0, 0],
        [2, 0],
        [0, 2],
        [0, 0]
      ]
    ],
    [
      [
        [
          [3, 3],
          [5, 3],
          [3, 5],
          [3, 3]
        ]
      ]
    ]
  ]
] as const)('optimized GeoJSON promotes %s alongside %s without changing coordinates', (singleKind, multiKind, encoding, singleCoordinates, multiCoordinates) => {
  const single = {type: singleKind, coordinates: singleCoordinates} as unknown as Geometry;
  const multi = {type: multiKind, coordinates: multiCoordinates} as unknown as Geometry;
  const table = convertFeaturesToGeoArrowTable(makeFeatures([single, null, multi]), {
    encodingPreference: 'optimized'
  }).data;
  expect(table.schema.fields.at(-1)?.metadata.get('ARROW:extension:name')).toBe(encoding);
  const vector = table.getChild('geometry')!;
  expect(
    Array.from({length: vector.length}, (_, index) => readArrowValue(vector.get(index)))
  ).toEqual([[singleCoordinates], null, multiCoordinates]);
});

test('native GeoJSON output preserves nullable properties, 4D tuples, and explicit metadata', () => {
  const propertySchema: Schema = {
    fields: [{name: 'name', type: 'utf8', nullable: true}],
    metadata: {
      custom: 'kept',
      geo: JSON.stringify({
        version: '1.1.0',
        primary_column: 'location',
        columns: {location: {encoding: 'point', geometry_types: ['Point ZM'], epoch: 2020}}
      })
    }
  };
  const features = makeFeatures([{type: 'Point', coordinates: [1, 2, 3, 4]}, null]);
  features[0].properties = {name: 'first'};
  features[1].properties = {name: null};
  const table = convertFeaturesToGeoArrowTable(features, {
    propertySchema,
    geometryColumnName: 'location',
    encodingPreference: 'optimized',
    crs: {name: 'CRS84'}
  }).data;
  expect(table.getChild('name')?.get(0)).toBe('first');
  expect(table.getChild('name')?.get(1)).toBeNull();
  expect(readArrowValue(table.getChild('location')?.get(0))).toEqual([1, 2, 3, 4]);
  expect(table.getChild('location')?.get(1)).toBeNull();
  expect(table.schema.metadata.get('custom')).toBe('kept');
  expect(
    JSON.parse(table.schema.fields.at(-1)!.metadata.get('ARROW:extension:metadata')!)
  ).toMatchObject({
    encoding: 'point',
    epoch: 2020,
    geometry_types: ['Point ZM'],
    crs_type: 'projjson',
    crs: {id: {code: 'CRS84'}}
  });
});

test.each([
  {geometries: [] as (Geometry | null)[]},
  {geometries: [null, null] as (Geometry | null)[]}
])('empty and null-only optimized GeoJSON tables retain a stable union schema', ({geometries}) => {
  const table = convertFeaturesToGeoArrowTable(makeFeatures(geometries), {
    encodingPreference: 'optimized'
  }).data;
  const vector = table.getChild('geometry')!;
  expect(vector.type).toBeInstanceOf(arrow.DenseUnion);
  expect(Array.from((vector.type as arrow.DenseUnion).typeIds)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(vector.length).toBe(geometries.length);
  expect(Array.from({length: vector.length}, (_, index) => vector.get(index))).toEqual(geometries);
});

test.each([
  'CRS84',
  'OGC:CRS84',
  'urn:ogc:def:crs:ogc::crs84',
  'http://www.opengis.net/def/crs/ogc/1.3/crs84',
  'urn:ogc:def:crs:epsg::4326',
  'urn:ogc:def:crs:epsg:6.6:4326',
  'http://www.opengis.net/def/crs/epsg/0/4326'
])('legacy CRS alias %s updates both metadata locations without sharing constants', name => {
  const schema: Schema = {fields: [{name: 'location', type: 'utf8'}]};
  const crs = {name};
  expect(applyLegacyGeoJSONCRSToSchema(schema, 'location', crs)).toBe(schema);
  const column = JSON.parse(schema.metadata!.geo).columns.location;
  const extension = JSON.parse(schema.fields[0].metadata!['ARROW:extension:metadata']);
  expect(column.encoding).toBe('wkt');
  expect(column.geojson_crs).toEqual(crs);
  expect(extension.crs).toEqual(column.crs);
  expect(extension.crs.id.code).toBe(name.toLowerCase().includes('4326') ? 4326 : 'CRS84');
  extension.crs.id.code = 'mutated';
  const next: Schema = {fields: [{name: 'location', type: 'binary'}]};
  applyLegacyGeoJSONCRSToSchema(next, 'location', crs);
  expect(JSON.parse(next.fields[0].metadata!['ARROW:extension:metadata']).crs.id.code).not.toBe(
    'mutated'
  );
});

test.each([
  undefined,
  '',
  '{',
  'null',
  '[]',
  '42',
  '{"custom":"kept"}'
])('legacy CRS tolerates extension metadata %s and preserves unrelated fields', metadata => {
  const schema: Schema = {
    fields: [
      {
        name: 'geometry',
        type: 'binary',
        metadata: metadata === undefined ? {} : {'ARROW:extension:metadata': metadata}
      }
    ]
  };
  const crs = {type: 'link', properties: {href: 'local-crs'}};
  applyLegacyGeoJSONCRSToSchema(schema, 'geometry', crs);
  const extension = JSON.parse(schema.fields[0].metadata!['ARROW:extension:metadata']);
  expect(extension).toEqual({
    ...(metadata === '{"custom":"kept"}' ? {custom: 'kept'} : {}),
    geojson_crs: crs
  });
  expect(JSON.parse(schema.metadata!.geo).columns.geometry).toEqual({
    encoding: 'wkb',
    geometry_types: [],
    geojson_crs: crs
  });
});

test('legacy CRS no-ops for absent fields and non-object descriptors', () => {
  const schema: Schema = {fields: []};
  for (const crs of [undefined, null, []]) {
    expect(applyLegacyGeoJSONCRSToSchema(schema, 'missing', crs as null)).toBe(schema);
  }
  expect(applyLegacyGeoJSONCRSToSchema(schema, 'missing', {name: 'CRS84'})).toBe(schema);
  expect(schema).toEqual({fields: []});
});
