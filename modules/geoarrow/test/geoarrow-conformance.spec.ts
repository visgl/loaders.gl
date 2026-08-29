// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry,
  inspectGeoArrowVector,
  isGeoArrowLineString,
  validateGeoArrowField,
  validateGeoArrowVector
} from '@loaders.gl/geoarrow';
import {
  GEOARROW_ENCODINGS,
  GEOARROW_CHILD_NAME_VARIANTS,
  GEOARROW_GEOMETRY_TYPES,
  GEOARROW_ROW_STATES,
  getGeoArrowConformanceMatrix
} from '@loaders.gl/geoarrow/geoarrow-conformance';

test('GeoArrow conformance ledger identifiers are deterministic', () => {
  const matrix = getGeoArrowConformanceMatrix();
  const ids = matrix.map(testCase => testCase.id);

  expect(new Set(ids).size).toBe(ids.length);
  expect(matrix.filter(testCase => testCase.encoding === 'geoarrow.geometry')).toHaveLength(
    GEOARROW_GEOMETRY_TYPES.length *
      4 *
      2 *
      2 *
      GEOARROW_ROW_STATES.length *
      GEOARROW_CHILD_NAME_VARIANTS.length
  );
  expect(new Set(matrix.map(testCase => testCase.encoding))).toEqual(new Set(GEOARROW_ENCODINGS));
  expect(new Set(matrix.map(testCase => testCase.rowState))).toEqual(new Set(GEOARROW_ROW_STATES));
  expect(new Set(matrix.map(testCase => testCase.childNameVariant))).toEqual(
    new Set(GEOARROW_CHILD_NAME_VARIANTS)
  );
  expect(matrix.every(testCase => testCase.id.includes(testCase.rowState))).toBe(true);
  expect(getGeoArrowConformanceMatrix()).toEqual(matrix);
});

test('GeoArrow field validation rejects non-canonical separated coordinate names', () => {
  const field = new arrow.Field(
    'geometry',
    new arrow.Struct([
      new arrow.Field('longitude', new arrow.Float64(), true),
      new arrow.Field('latitude', new arrow.Float64(), true)
    ]),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.point']])
  );

  const result = validateGeoArrowField(field);
  expect(result.valid).toBe(false);
  expect(result.issues.some(issue => issue.message.includes('physical Arrow layout'))).toBe(true);
});

test('GeoArrow vector validation rejects malformed serialized values', () => {
  const wkbField = new arrow.Field(
    'geometry',
    new arrow.Binary(),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.wkb']])
  );
  const wkbVector = arrow.vectorFromArray([new Uint8Array([1, 1, 0, 0, 0])], new arrow.Binary());
  const wkbResult = validateGeoArrowVector(wkbVector, 'geoarrow.wkb');
  expect(wkbResult.valid).toBe(false);
  expect(wkbResult.issues[0]?.path).toBe('row[0]');

  const wktVector = arrow.vectorFromArray(['POINT (1)'], new arrow.Utf8());
  const wktResult = validateGeoArrowVector(wktVector, 'geoarrow.wkt');
  expect(wktResult.valid).toBe(false);
  expect(wktResult.issues[0]?.path).toBe('row[0]');
  expect(validateGeoArrowField(wkbField).valid).toBe(true);
});

test('GeoArrow vector validation checks native list offsets', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  const lineType = new arrow.List(new arrow.Field('value', coordinateType, true));
  const lineVector = arrow.vectorFromArray(
    [
      [
        [1, 2],
        [3, 4]
      ]
    ],
    lineType
  );

  expect(validateGeoArrowVector(lineVector, 'geoarrow.linestring').valid).toBe(true);
  const offsets = lineVector.data[0].valueOffsets as Int32Array;
  offsets[1] = 3;
  const result = validateGeoArrowVector(lineVector, 'geoarrow.linestring');
  expect(result.valid).toBe(false);
  expect(result.issues.some(issue => issue.message.includes('exceeds child length'))).toBe(true);
});

test('GeoArrow field validation rejects recursive collection union children', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  const pointUnion = new arrow.DenseUnion([1], [new arrow.Field('Point', coordinateType, true)]);
  const nestedCollection = new arrow.List(new arrow.Field('geometries', pointUnion, true));
  const collectionUnion = new arrow.DenseUnion(
    [7],
    [new arrow.Field('GeometryCollection', nestedCollection, true)]
  );
  const field = new arrow.Field(
    'geometry',
    new arrow.List(new arrow.Field('geometries', collectionUnion, true)),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.geometrycollection']])
  );

  const result = validateGeoArrowField(field);
  expect(result.valid).toBe(false);
  expect(result.issues.some(issue => issue.message.includes('cannot recursively contain'))).toBe(
    true
  );
});

test('GeoArrow vector validation accepts sliced native list offsets', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  const lineType = new arrow.List(new arrow.Field('value', coordinateType, true));
  const lineVector = arrow.vectorFromArray(
    [
      [
        [1, 2],
        [3, 4]
      ],
      [
        [5, 6],
        [7, 8]
      ]
    ],
    lineType
  );

  expect(validateGeoArrowVector(lineVector.slice(1, 2), 'geoarrow.linestring').valid).toBe(true);
});

test('GeoArrow vector validation reads shortened sliced list offsets', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  const lineType = new arrow.List(new arrow.Field('value', coordinateType, true));
  const lineVector = arrow.vectorFromArray(
    [
      [
        [1, 2],
        [3, 4]
      ],
      [
        [5, 6],
        [7, 8]
      ]
    ],
    lineType
  );
  const slicedVector = lineVector.slice(1, 2);
  const slicedData = slicedVector.data[0];
  (slicedData.valueOffsets as Int32Array)[1] = 99;

  const result = validateGeoArrowVector(slicedVector, 'geoarrow.linestring');
  expect(result.valid).toBe(false);
  expect(result.issues.some(issue => issue.message.includes('exceeds child length'))).toBe(true);
});

test('GeoArrow type guards recognize 64-bit native list layouts', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  const lineType = new arrow.LargeList(new arrow.Field('value', coordinateType, true));

  expect(isGeoArrowLineString(lineType)).toBe(true);
});

test('GeoArrow conversion preserves GeoParquet column semantics', () => {
  const source = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}}
  ]).data;
  const geoMetadata = {
    version: '1.1.0',
    primary_column: 'geometry',
    columns: {
      geometry: {
        encoding: 'WKB',
        geometry_types: ['Point'],
        crs: {id: 'EPSG:4326'},
        epoch: 2020,
        custom_extension_value: 'retained'
      }
    },
    custom_file_value: {source: 'fixture'}
  };
  const schema = new arrow.Schema(
    source.schema.fields,
    new Map([['geo', JSON.stringify(geoMetadata)]])
  );
  const table = new arrow.Table(
    schema,
    source.batches.map(batch => new arrow.RecordBatch(schema, batch.data))
  );

  const converted = convertGeoArrowGeometry(table, 'geoarrow.point');
  const convertedGeoMetadata = JSON.parse(converted.schema.metadata?.get('geo') || '{}');
  const convertedField = converted.schema.fields.find(field => field.name === 'geometry')!;
  const convertedFieldMetadata = JSON.parse(
    convertedField.metadata?.get('ARROW:extension:metadata') || '{}'
  );

  expect(convertedGeoMetadata.custom_file_value).toEqual({source: 'fixture'});
  expect(convertedGeoMetadata.columns.geometry.crs).toEqual({id: 'EPSG:4326'});
  expect(convertedGeoMetadata.columns.geometry.encoding).toBe('point');
  expect(convertedFieldMetadata.crs).toEqual({id: 'EPSG:4326'});
  expect(convertedFieldMetadata.custom_extension_value).toBe('retained');
});

test('GeoArrow inspection preserves separated XYM semantics', () => {
  const coordinateType = new arrow.Struct([
    new arrow.Field('x', new arrow.Float64(), true),
    new arrow.Field('y', new arrow.Float64(), true),
    new arrow.Field('m', new arrow.Float64(), true)
  ]);
  const vector = arrow.vectorFromArray([{x: 1, y: 2, m: 7}], coordinateType);

  expect(inspectGeoArrowVector(vector, 'geoarrow.point')).toMatchObject({
    geometryTypes: ['Point'],
    dimensions: ['xym']
  });
});

test('GeoArrow Box validation rejects inverted extents', () => {
  const source = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}}
  ]).data;
  const boxes = convertGeoArrowGeometry(source, 'geoarrow.box');
  const geometry = boxes.getChild('geometry')!;
  const xmax = geometry.data[0].children[2].values as Float64Array;
  xmax[0] = 0;

  const result = validateGeoArrowVector(geometry, 'geoarrow.box');
  expect(result.valid).toBe(false);
  expect(result.issues.some(issue => issue.message.includes('must not exceed'))).toBe(true);
});
