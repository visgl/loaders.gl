// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  convertArrowBinaryFeatureCollectionToBinaryFeatureCollection,
  convertBinaryFeatureCollectionToArrowBinaryFeatureCollection,
  convertGeometryValuesToBinaryFeatureCollection
} from '@loaders.gl/gis';
test('gis#arrow-binary-feature-collection wraps renderable binary features in Arrow tables', () => {
  const binaryFeatures = convertGeometryValuesToBinaryFeatureCollection(
    ['POINT (1 2)', 'LINESTRING (0 0, 1 1, 2 2)', 'POLYGON ((0 0, 3 0, 3 3, 0 0))'],
    {geometryEncoding: 'wkt'}
  );
  const arrowBinaryFeatures =
    convertBinaryFeatureCollectionToArrowBinaryFeatureCollection(binaryFeatures);
  expect(
    String(arrowBinaryFeatures.points?.table.schema.fields[0].type),
    'wraps point geometry in a list of coordinates'
  ).toBe('List<FixedSizeList[2]<Float64>>');
  expect(
    String(arrowBinaryFeatures.lines?.table.schema.fields[0].type),
    'wraps line geometry in a list of coordinates'
  ).toBe('List<FixedSizeList[2]<Float64>>');
  expect(
    String(arrowBinaryFeatures.polygons?.table.schema.fields[0].type),
    'wraps polygon geometry in nested Arrow lists'
  ).toBe('List<List<FixedSizeList[2]<Float64>>>');
  expect(
    String(arrowBinaryFeatures.polygons?.table.getChild('polygonIndices')?.type),
    'stores raw polygon indices as a sidecar Arrow column'
  ).toBe('List<Uint32>');
  expect(
    arrowBinaryFeatures.lines?.table.getChild('geometry')?.data[0].valueOffsets.buffer,
    'reuses line path offsets without copying'
  ).toBe(binaryFeatures.lines?.pathIndices.value.buffer);
  expect(
    arrowBinaryFeatures.lines?.table.getChild('geometry')?.data[0].children[0].children[0].values
      .buffer,
    'reuses line coordinate values without copying'
  ).toBe(binaryFeatures.lines?.positions.value.buffer);
});
test('gis#arrow-binary-feature-collection round-trips binary feature collections', () => {
  const binaryFeatures = convertGeometryValuesToBinaryFeatureCollection(
    ['MULTIPOINT ((1 2), (3 4))', 'LINESTRING (0 0, 1 1)', 'POLYGON ((0 0, 2 0, 2 2, 0 0))'],
    {geometryEncoding: 'wkt'}
  );
  binaryFeatures.points!.numericProps.weight = {
    value: new Float32Array([1, 1]),
    size: 1
  };
  binaryFeatures.lines!.numericProps.weight = {
    value: new Float32Array([2, 2]),
    size: 1
  };
  binaryFeatures.polygons!.numericProps.weight = {
    value: new Float32Array([3, 3, 3, 3]),
    size: 1
  };
  const arrowBinaryFeatures =
    convertBinaryFeatureCollectionToArrowBinaryFeatureCollection(binaryFeatures);
  const roundTrippedBinaryFeatures =
    convertArrowBinaryFeatureCollectionToBinaryFeatureCollection(arrowBinaryFeatures);
  expect(
    Array.from(roundTrippedBinaryFeatures.points?.positions.value || []),
    'round-trips point positions'
  ).toEqual(Array.from(binaryFeatures.points?.positions.value || []));
  expect(
    Array.from(roundTrippedBinaryFeatures.lines?.pathIndices.value || []),
    'round-trips line path indices'
  ).toEqual(Array.from(binaryFeatures.lines?.pathIndices.value || []));
  expect(
    Array.from(roundTrippedBinaryFeatures.polygons?.polygonIndices.value || []),
    'round-trips polygon indices'
  ).toEqual(Array.from(binaryFeatures.polygons?.polygonIndices.value || []));
  expect(
    Array.from(roundTrippedBinaryFeatures.polygons?.primitivePolygonIndices.value || []),
    'round-trips primitive polygon indices'
  ).toEqual(Array.from(binaryFeatures.polygons?.primitivePolygonIndices.value || []));
  expect(
    Array.from(roundTrippedBinaryFeatures.polygons?.triangles?.value || []),
    'round-trips polygon triangles'
  ).toEqual(Array.from(binaryFeatures.polygons?.triangles?.value || []));
  expect(
    Array.from(roundTrippedBinaryFeatures.points?.numericProps.weight.value || []),
    'round-trips point numeric props'
  ).toEqual([1, 1]);
  expect(
    Array.from(roundTrippedBinaryFeatures.lines?.numericProps.weight.value || []),
    'round-trips line numeric props'
  ).toEqual([2, 2]);
  expect(
    Array.from(roundTrippedBinaryFeatures.polygons?.numericProps.weight.value || []),
    'round-trips polygon numeric props'
  ).toEqual([3, 3, 3, 3]);
  expect(
    roundTrippedBinaryFeatures.lines?.positions.value.buffer,
    'round-trips line positions zero-copy'
  ).toBe(binaryFeatures.lines?.positions.value.buffer);
  expect(
    roundTrippedBinaryFeatures.lines?.pathIndices.value.buffer,
    'round-trips line offsets zero-copy'
  ).toBe(binaryFeatures.lines?.pathIndices.value.buffer);
  expect(
    roundTrippedBinaryFeatures.polygons?.polygonIndices.value.buffer,
    'round-trips polygon indices zero-copy'
  ).toBe(binaryFeatures.polygons?.polygonIndices.value.buffer);
});
