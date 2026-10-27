// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {convert, convertTable, convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {Feature, GeoJSONTable} from '@loaders.gl/core/schema';
import {
  GEOARROW_CONVERTERS,
  GeometryColumnConverter,
  GeoArrowGeometryConverter,
  convertFeaturesToGeoArrowTable,
  convertGeoArrowVector,
  getGeoArrowRowBounds
} from '../../src/geoarrow';

test('the public converter bundle includes single geometry and rendering collection conversions', () => {
  expect(convert('POINT (1 2)', 'geojson-geometry', GEOARROW_CONVERTERS)).toEqual({
    type: 'Point',
    coordinates: [1, 2]
  });
  const features: Feature[] = [
    {type: 'Feature', geometry: {type: 'Point', coordinates: [1, 2]}, properties: {name: 'point'}}
  ];
  const binary = convert(features, 'binary-feature-collection', GEOARROW_CONVERTERS);
  expect(convert(binary, 'geojson', GEOARROW_CONVERTERS)).toEqual(features);
  expect(GeometryColumnConverter).toBe(GeoArrowGeometryConverter);
  const table = convertFeaturesToGeoArrowTable(features).data;
  expect(convert(table, 'geoarrow.point', GEOARROW_CONVERTERS)).toBeInstanceOf(arrow.Table);
});

test.each([
  'object-row-table',
  'array-row-table',
  'columnar-table',
  'geojson-table',
  'arrow-table'
] as const)('the combined bundle distinguishes a %s wrapper from binary features', shape => {
  const features: Feature[] = [
    {type: 'Feature', geometry: {type: 'Point', coordinates: [1, 2]}, properties: {name: 'point'}}
  ];
  const arrowTable = convertFeaturesToGeoArrowTable(features);
  const sourceTable = {...arrowTable, schema: convertArrowToSchema(arrowTable.data.schema)};
  const table =
    shape === 'geojson-table'
      ? {shape, type: 'FeatureCollection' as const, features, schema: {fields: [], metadata: {}}}
      : convertTable(sourceTable, shape);
  const converted = convert(table, 'geoarrow', GEOARROW_CONVERTERS) as arrow.Table;
  expect(converted).toBeInstanceOf(arrow.Table);
  expect(converted.numRows).toBe(1);
  const restored = convert(converted, 'geojson-table', GEOARROW_CONVERTERS) as GeoJSONTable;
  expect(restored.features).toEqual(features);
});

test.each([
  'interleaved',
  'separated'
] as const)('native %s bounds retain chunk/slice identity, nulls, empty rows and finite XY conventions', coordinates => {
  const source = arrow.vectorFromArray(
    ['POINT (99 99)', 'MULTIPOINT ((1 2), (3 4))', null, 'MULTIPOINT EMPTY', 'POINT M (5 6 100)'],
    new arrow.Utf8()
  );
  const native = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.geometry', {coordinates});
  const chunked = new arrow.Vector([...native.slice(1, 4).data, ...native.slice(4, 5).data]);
  const originalChunks = [...chunked.data];
  const originalBuffers = chunked.data.map(chunk => chunk.buffers);
  expect(getGeoArrowRowBounds(chunked, 'geoarrow.geometry')).toEqual([
    [1, 2, 3, 4],
    null,
    null,
    [5, 6, 5, 6]
  ]);
  originalChunks.forEach((chunk, index) => {
    expect(chunked.data[index]).toBe(chunk);
    expect(chunked.data[index].buffers).toEqual(originalBuffers[index]);
  });
});
