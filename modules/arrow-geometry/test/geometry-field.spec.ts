// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getGeoMetadata,
  type Field,
  type Geometry,
  type Metadata,
  type Schema
} from '@loaders.gl/schema';
import type {GeoArrowBuilderEncoding} from '../src/geoarrow-builder';
import {
  encodeWKBGeometryValue,
  getCoordinateDimensions,
  getGeometrySampleCoordinates,
  getGeometryWKBOptions,
  inferGeoParquetGeometryTypes,
  makeGeoArrowGeometryField,
  makeWKBGeometryField,
  setGeoArrowGeometryColumnMetadata,
  setWKBGeometryColumnMetadata,
  setWKBGeometrySchemaMetadata
} from '../src/geometry-field';
import {convertWKTToGeometry} from '../src/geometry-codecs';

test.each([
  ['geoarrow.point', 0],
  ['geoarrow.multipoint', 1],
  ['geoarrow.linestring', 1],
  ['geoarrow.multilinestring', 2],
  ['geoarrow.polygon', 2],
  ['geoarrow.multipolygon', 3]
] as const)('constructs the native offset hierarchy for %s', (encoding, depth) => {
  const field = makeGeoArrowGeometryField({
    encoding,
    coordinateSize: 3,
    geometryColumnName: 'shape',
    nullable: false
  });
  expect(field).toMatchObject({
    name: 'shape',
    nullable: false,
    metadata: {'ARROW:extension:name': encoding}
  });
  let fieldType = field.type;
  for (let level = 0; level < depth; level++) {
    expect(fieldType).toMatchObject({type: 'list'});
    fieldType = (fieldType as {children: Field[]}).children[0].type;
  }
  expect(fieldType).toEqual({
    type: 'fixed-size-list',
    listSize: 3,
    children: [{name: 'value', type: 'float64', nullable: false}]
  });
});

test('field defaults preserve nullable XY and reject unsupported encodings', () => {
  expect(makeWKBGeometryField()).toMatchObject({name: 'geometry', nullable: true});
  expect(makeWKBGeometryField('shape', false)).toMatchObject({name: 'shape', nullable: false});
  expect(makeGeoArrowGeometryField({encoding: 'geoarrow.point'})).toMatchObject({
    name: 'geometry',
    nullable: true,
    type: {listSize: 2}
  });
  expect(() =>
    makeGeoArrowGeometryField({encoding: 'geoarrow.wkb' as GeoArrowBuilderEncoding})
  ).toThrow('Unsupported GeoArrow encoding');
});

test.each([
  {},
  new Map<string, string>()
])('metadata updates preserve other columns and explicit column semantics', metadata => {
  setWKBGeometryColumnMetadata(metadata);
  setGeoArrowGeometryColumnMetadata(metadata, {
    encoding: 'geoarrow.polygon',
    geometryColumnName: 'shape',
    primaryColumnName: 'geometry',
    version: '1.2.0',
    geometryTypes: ['Polygon'],
    columnMetadata: {crs: null, edges: 'spherical'}
  });
  setGeoArrowGeometryColumnMetadata(metadata, {
    encoding: 'geoarrow.multipolygon',
    geometryColumnName: 'shape'
  });
  expect(getGeoMetadata(metadata)).toMatchObject({
    version: '1.2.0',
    primary_column: 'shape',
    columns: {
      geometry: {encoding: 'wkb', geometry_types: []},
      shape: {encoding: 'multipolygon', geometry_types: [], crs: null, edges: 'spherical'}
    }
  });
  setWKBGeometryColumnMetadata(metadata, {
    geometryColumnName: 'shape',
    primaryColumnName: 'geometry',
    version: '1.1.0',
    geometryTypes: ['Point']
  });
  expect(getGeoMetadata(metadata)).toMatchObject({
    version: '1.1.0',
    primary_column: 'geometry',
    columns: {shape: {encoding: 'wkb', geometry_types: ['Point'], crs: null}}
  });
});

test('schema metadata can be initialized and native columns use default names', () => {
  const schema: Schema = {fields: []};
  expect(setWKBGeometrySchemaMetadata(schema)).toBe(schema);
  setWKBGeometrySchemaMetadata(schema);
  const metadata: Metadata = {};
  setGeoArrowGeometryColumnMetadata(metadata, {encoding: 'geoarrow.point'});
  expect(getGeoMetadata(metadata)).toEqual({
    version: '1.1.0',
    primary_column: 'geometry',
    columns: {geometry: {encoding: 'point', geometry_types: []}}
  });
});

test('WKB byte values own exactly their input range and preserve null geometry', () => {
  const bytes = new Uint8Array([9, 1, 2, 8]);
  const copy = encodeWKBGeometryValue(new DataView(bytes.buffer, 1, 2))!;
  expect(copy).toEqual(new Uint8Array([1, 2]));
  expect(copy.buffer).not.toBe(bytes.buffer);
  expect(encodeWKBGeometryValue(bytes.buffer)).toEqual(bytes);
  expect(encodeWKBGeometryValue(bytes.buffer)!.buffer).not.toBe(bytes.buffer);
  expect(encodeWKBGeometryValue(null)).toBeNull();
  expect(encodeWKBGeometryValue(undefined)).toBeNull();
  expect(() => encodeWKBGeometryValue({} as Geometry)).toThrow('Expected a Geometry');
});

test.each([
  ['GEOMETRYCOLLECTION EMPTY', false, false, 'GeometryCollection'],
  ['GEOMETRYCOLLECTION (POINT Z (1 2 3))', true, false, 'GeometryCollection Z'],
  ['GEOMETRYCOLLECTION (POINT M (1 2 3))', false, true, 'GeometryCollection M'],
  ['GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))', true, true, 'GeometryCollection ZM'],
  ['POINT ZM (1 2 3 4)', true, true, 'Point ZM']
] as const)('infers dimensional metadata without losing M in %s', (text, hasZ, hasM, label) => {
  const geometry = convertWKTToGeometry(text)!;
  expect(getGeometryWKBOptions(geometry)).toEqual({hasZ, hasM});
  expect(inferGeoParquetGeometryTypes([null, geometry, undefined, geometry])).toEqual([label]);
});

test('coordinate sampling handles empty and nested payloads without materializing geometry', () => {
  const point: Geometry = {type: 'Point', coordinates: [1, 2, 3, 4]};
  const collection: Geometry = {type: 'GeometryCollection', geometries: [point]};
  expect(getGeometrySampleCoordinates(collection)).toBe(point.coordinates);
  expect(
    getGeometrySampleCoordinates({type: 'GeometryCollection', geometries: []})
  ).toBeUndefined();
  expect(getCoordinateDimensions(undefined)).toBe(2);
  expect(getCoordinateDimensions([])).toBe(2);
  expect(getCoordinateDimensions([[[1, 2, 3, 4]]])).toBe(4);
  expect(getGeometryWKBOptions(point)).toEqual({hasZ: true, hasM: true});
});
