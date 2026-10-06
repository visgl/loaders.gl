// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {Geometry, GeoArrowEncoding} from '@loaders.gl/schema';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {
  convertGeoArrowVector,
  convertGeoArrowVectorCellToGeoJSON
} from '../src/geoarrow-converter/convert-geoarrow-geometry';
import {inspectGeoArrowVector} from '../src/geoarrow-inspection';
import {inspectGeoArrowLayout} from '../src/geoarrow-layout';
import {rewindGeoArrow} from '../src/rewind-geoarrow';
import {
  getGeoArrowUnionCoordinateLayout,
  getGeoArrowUnionDimension,
  getGeoArrowUnionGeometryKind
} from '../src/lib/kernels/geoarrow-union';

/** Encodes tiny independent geometries with real Arrow Binary storage. */
function makeWKBVector(
  geometries: (Geometry | null)[],
  dimension: 'xy' | 'xyzm' = 'xy'
): arrow.Vector {
  return arrow.vectorFromArray(
    geometries.map(geometry =>
      geometry
        ? new Uint8Array(
            convertGeometryToWKB(geometry, {hasZ: dimension === 'xyzm', hasM: dimension === 'xyzm'})
          )
        : null
    ),
    new arrow.Binary()
  );
}

/** Reads visible geometry rows, including union type IDs and collection members. */
function readGeometries(vector: arrow.Vector, encoding: GeoArrowEncoding): (Geometry | null)[] {
  return Array.from({length: vector.length}, (_, index) =>
    convertGeoArrowVectorCellToGeoJSON(vector, index, encoding)
  );
}

test.each([
  'geoarrow.geometry',
  'geoarrow.geometrycollection'
] as const)('%s preserves nested collection grouping, member order, empty and null rows across chunks and slices', encoding => {
  const nested: Geometry = {
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [1, 2]},
      {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'LineString',
            coordinates: [
              [3, 4],
              [5, 6]
            ]
          },
          {type: 'GeometryCollection', geometries: []}
        ]
      },
      {type: 'MultiPoint', coordinates: []}
    ]
  };
  const empty: Geometry = {type: 'GeometryCollection', geometries: []};
  const first = convertGeoArrowVector(
    makeWKBVector([empty, nested, null]),
    'geoarrow.wkb',
    encoding,
    {coordinates: 'separated', offsetType: 'int64', fallback: 'error'}
  );
  const second = convertGeoArrowVector(makeWKBVector([nested, empty]), 'geoarrow.wkb', encoding, {
    coordinates: 'separated',
    offsetType: 'int64',
    fallback: 'error'
  });
  const chunked = new arrow.Vector([...first.data, ...second.data]);
  expect(readGeometries(chunked, encoding)).toEqual([empty, nested, null, nested, empty]);
  const sliced = chunked.slice(1, 4);
  expect(readGeometries(sliced, encoding)).toEqual([nested, null, nested]);
  const wkb = convertGeoArrowVector(sliced, encoding, 'geoarrow.wkb', {fallback: 'error'});
  expect(readGeometries(wkb, 'geoarrow.wkb')).toEqual([nested, null, nested]);
  expect(inspectGeoArrowVector(sliced, encoding)).toMatchObject({
    rowCount: 3,
    nullCount: 1,
    dimensions: ['xy'],
    malformedRowCount: 0
  });
  expect(convertGeoArrowVector(sliced, encoding, 'native')).toBe(sliced);
});

test('dense union cell decoding uses field names for noncanonical IDs and chunk-local sliced offsets', () => {
  const pointType = new arrow.FixedSizeList(3, new arrow.Field('xym', new arrow.Float64(), true));
  const lineType = new arrow.List(new arrow.Field('vertices', pointType, true));
  const type = new arrow.DenseUnion(
    [41, 42],
    [new arrow.Field('Point M', pointType, true), new arrow.Field('LineString M', lineType, true)]
  );
  const points = arrow.vectorFromArray([[9, 8, 7], null, [1, 2, 3]], pointType);
  const lines = arrow.vectorFromArray(
    [
      [
        [4, 5, 6],
        [7, 8, 9]
      ]
    ],
    lineType
  );
  const full = arrow.makeVector(
    arrow.makeData({
      type,
      length: 4,
      typeIds: Int8Array.of(41, 42, 41, 41),
      valueOffsets: Int32Array.of(0, 0, 1, 2),
      children: [points.data[0], lines.data[0]]
    })
  );
  const sliced = full.slice(1, 4);
  const chunked = new arrow.Vector([...sliced.data, ...full.slice(0, 1).data]);
  expect(readGeometries(chunked, 'geoarrow.geometry')).toEqual([
    {
      type: 'LineString',
      coordinates: [
        [4, 5, 6],
        [7, 8, 9]
      ]
    },
    null,
    {type: 'Point', coordinates: [1, 2, 3]},
    {type: 'Point', coordinates: [9, 8, 7]}
  ]);
  expect(inspectGeoArrowVector(chunked, 'geoarrow.geometry')).toEqual({
    rowCount: 4,
    nullCount: 1,
    geometryTypes: ['LineString M', 'Point M'],
    dimensions: ['xym'],
    malformedRowCount: 0
  });
  expect(() => convertGeoArrowVectorCellToGeoJSON(chunked, 4, 'geoarrow.geometry')).toThrow(
    'out of bounds'
  );
});

test('a real sparse union is rejected as unsupported GeoArrow geometry storage', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('xy', new arrow.Float64(), true)
  );
  const type = new arrow.SparseUnion([1], [new arrow.Field('Point', coordinateType, true)]);
  const points = arrow.vectorFromArray([[1, 2], null], coordinateType);
  const vector = arrow.makeVector(
    arrow.makeData({type, length: 2, typeIds: Int8Array.of(1, 1), children: [points.data[0]]})
  );
  expect(vector.get(0).toArray()).toEqual(Float64Array.of(1, 2));
  expect(vector.get(1)).toBeNull();
  expect(
    inspectGeoArrowLayout(
      new arrow.Field(
        'geometry',
        vector.type,
        true,
        new Map([['ARROW:extension:name', 'geoarrow.geometry']])
      )
    ).issues.length
  ).toBeGreaterThan(0);
  expect(() => convertGeoArrowVectorCellToGeoJSON(vector, 0, 'geoarrow.geometry')).toThrow(
    'requires a DenseUnion vector'
  );
});

test.each([
  'interleaved',
  'separated'
] as const)('rewinding %s multipolygons preserves holes, complete XYZM tuples, empty rows and invisible slices', coordinates => {
  const exterior = [
    [0, 0, 1, 11],
    [4, 0, 2, 12],
    [0, 4, 3, 13],
    [0, 0, 1, 11]
  ];
  const interior = [
    [1, 1, 4, 14],
    [1, 2, 5, 15],
    [2, 1, 6, 16],
    [1, 1, 4, 14]
  ];
  const polygon: Geometry = {type: 'MultiPolygon', coordinates: [[exterior, interior]]};
  const empty: Geometry = {type: 'MultiPolygon', coordinates: []};
  const vector = convertGeoArrowVector(
    makeWKBVector([polygon, null, empty, polygon], 'xyzm'),
    'geoarrow.wkb',
    'geoarrow.multipolygon',
    {coordinates, dimension: 'xyzm', offsetType: 'int64'}
  );
  const sliced = vector.slice(1, 4);
  const offsets = sliced.data[0].valueOffsets;
  expect(rewindGeoArrow(sliced, 'geoarrow.multipolygon', {exterior: 'clockwise'})).toBe(sliced);
  expect(sliced.data[0].valueOffsets).toBe(offsets);
  expect(readGeometries(vector, 'geoarrow.multipolygon')).toEqual([
    polygon,
    null,
    empty,
    {type: 'MultiPolygon', coordinates: [[[...exterior].reverse(), [...interior].reverse()]]}
  ]);
  const afterFirstRewind = readGeometries(vector, 'geoarrow.multipolygon');
  rewindGeoArrow(sliced, 'geoarrow.multipolygon', {exterior: 'clockwise'});
  expect(readGeometries(vector, 'geoarrow.multipolygon')).toEqual(afterFirstRewind);
});

test('rewinding nested union collections reaches multipolygons while retaining nulls and zero-area rings', () => {
  const ring = [
    [0, 0],
    [2, 0],
    [0, 2],
    [0, 0]
  ];
  const degenerate = [
    [0, 0],
    [1, 1],
    [0, 0]
  ];
  const collection: Geometry = {
    type: 'GeometryCollection',
    geometries: [
      {
        type: 'GeometryCollection',
        geometries: [
          {type: 'MultiPolygon', coordinates: [[ring], [degenerate]]},
          {type: 'Point', coordinates: [8, 9]}
        ]
      }
    ]
  };
  const vector = convertGeoArrowVector(
    makeWKBVector([null, collection]),
    'geoarrow.wkb',
    'geoarrow.geometry'
  );
  rewindGeoArrow(vector, 'geoarrow.geometry', {exterior: 'clockwise'});
  expect(readGeometries(vector, 'geoarrow.geometry')).toEqual([
    null,
    {
      type: 'GeometryCollection',
      geometries: [
        {
          type: 'GeometryCollection',
          geometries: [
            {type: 'MultiPolygon', coordinates: [[[...ring].reverse()], [degenerate]]},
            {type: 'Point', coordinates: [8, 9]}
          ]
        }
      ]
    }
  ]);
  expect(() => rewindGeoArrow(vector, 'geoarrow.point')).toThrow('requires polygon');
});

test.each([
  ['xy', ['xmin', 'ymin', 'xmax', 'ymax']],
  ['xyz', ['xmin', 'ymin', 'zmin', 'xmax', 'ymax', 'zmax']],
  ['xym', ['xmin', 'ymin', 'mmin', 'xmax', 'ymax', 'mmax']],
  ['xyzm', ['xmin', 'ymin', 'zmin', 'mmin', 'xmax', 'ymax', 'zmax', 'mmax']]
] as const)('inspection identifies %s box dimensions without inventing geometry types', (dimension, names) => {
  const type = new arrow.Struct(
    names.map(name => new arrow.Field(name, new arrow.Float32(), true))
  );
  const vector = arrow.vectorFromArray(
    [Object.fromEntries(names.map((name, index) => [name, index])), null],
    type
  );
  expect(inspectGeoArrowVector(vector, 'geoarrow.box')).toEqual({
    rowCount: 2,
    nullCount: 1,
    geometryTypes: [],
    dimensions: [dimension],
    malformedRowCount: 0
  });
});

test('union schema helpers distinguish uniform and mixed physical layouts and semantic dimension bands', () => {
  const interleaved = new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64(), true));
  const separated = new arrow.Struct(
    ['x', 'y', 'm'].map(name => new arrow.Field(name, new arrow.Float64(), true))
  );
  const largeList = new arrow.LargeList(new arrow.Field('vertices', separated, true));
  const mixed = new arrow.DenseUnion(
    [1, 22],
    [new arrow.Field('Point', interleaved, true), new arrow.Field('LineString M', largeList, true)]
  );
  const uniform = new arrow.DenseUnion(
    [21, 22],
    [new arrow.Field('Point M', separated, true), new arrow.Field('LineString M', largeList, true)]
  );
  expect(getGeoArrowUnionCoordinateLayout(mixed)).toBeNull();
  expect(getGeoArrowUnionCoordinateLayout(uniform)).toBe('separated');
  expect(getGeoArrowUnionCoordinateLayout(new arrow.DenseUnion([], []))).toBeNull();
  expect(getGeoArrowUnionCoordinateLayout(undefined)).toBeNull();
  expect(getGeoArrowUnionCoordinateLayout(new arrow.Binary())).toBeNull();
  expect(getGeoArrowUnionDimension(undefined, largeList, 22)).toBe('xym');
  const kinds = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
  ];
  const dimensions = ['xy', 'xyz', 'xym', 'xyzm'];
  for (let band = 0; band < dimensions.length; band++) {
    for (let index = 0; index < kinds.length; index++) {
      const typeId = band * 10 + index + 1;
      expect(getGeoArrowUnionGeometryKind(undefined, typeId)).toBe(kinds[index]);
      expect(getGeoArrowUnionDimension(undefined, undefined, typeId)).toBe(dimensions[band]);
    }
  }
  expect(getGeoArrowUnionDimension(undefined, undefined, 41)).toBeNull();
  expect(getGeoArrowUnionGeometryKind(undefined, 0)).toBeNull();
  expect(getGeoArrowUnionGeometryKind('Point M', 42)).toBe('Point');
  expect(getGeoArrowUnionDimension('Point M', interleaved, 1)).toBe('xym');
});

test.each([
  ['Point', ['x', 'y'], 'xy'],
  ['Point Z', ['x', 'y', 'z'], 'xyz'],
  ['Point M', ['x', 'y', 'm'], 'xym'],
  ['Point ZM', ['x', 'y', 'z', 'm'], 'xyzm']
] as const)('collection dimension inspection follows %s children rather than a noncanonical ID band', (fieldName, coordinateNames, dimension) => {
  const coordinateType = new arrow.Struct(
    coordinateNames.map(name => new arrow.Field(name, new arrow.Float64(), true))
  );
  const members = new arrow.DenseUnion([1], [new arrow.Field(fieldName, coordinateType, true)]);
  const collection = new arrow.LargeList(new arrow.Field('members', members, true));
  expect(getGeoArrowUnionDimension('GeometryCollection', collection, 25)).toBe(dimension);
  const nested = new arrow.List(
    new arrow.Field(
      'members',
      new arrow.DenseUnion([25], [new arrow.Field('GeometryCollection', collection, true)]),
      true
    )
  );
  expect(getGeoArrowUnionDimension('GeometryCollection', nested, 25)).toBe(dimension);
});

test('collection dimension inspection handles empty schemas and combines explicit Z and M children', () => {
  const empty = new arrow.List(new arrow.Field('members', new arrow.DenseUnion([], []), true));
  expect(getGeoArrowUnionDimension('GeometryCollection', empty, 25)).toBe('xy');
  const coordinate = new arrow.FixedSizeList(
    3,
    new arrow.Field('value', new arrow.Float64(), true)
  );
  const members = new arrow.DenseUnion(
    [2, 3],
    [new arrow.Field('Point Z', coordinate, true), new arrow.Field('Point M', coordinate, true)]
  );
  const collection = new arrow.List(new arrow.Field('members', members, true));
  expect(getGeoArrowUnionDimension('GeometryCollection', collection, 25)).toBe('xyzm');
});
