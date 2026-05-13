// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  convertArrowBinaryFeatureCollectionToBinaryFeatureCollection,
  convertBinaryFeatureCollectionToArrowBinaryFeatureCollection,
  convertGeometryValuesToBinaryFeatureCollection
} from '@loaders.gl/gis';

test('gis#arrow-binary-feature-collection wraps renderable binary features in Arrow tables', t => {
  const binaryFeatures = convertGeometryValuesToBinaryFeatureCollection(
    ['POINT (1 2)', 'LINESTRING (0 0, 1 1, 2 2)', 'POLYGON ((0 0, 3 0, 3 3, 0 0))'],
    {geometryEncoding: 'wkt'}
  );
  const arrowBinaryFeatures =
    convertBinaryFeatureCollectionToArrowBinaryFeatureCollection(binaryFeatures);

  t.equal(
    String(arrowBinaryFeatures.points?.table.schema.fields[0].type),
    'List<FixedSizeList[2]<Float64>>',
    'wraps point geometry in a list of coordinates'
  );
  t.equal(
    String(arrowBinaryFeatures.lines?.table.schema.fields[0].type),
    'List<FixedSizeList[2]<Float64>>',
    'wraps line geometry in a list of coordinates'
  );
  t.equal(
    String(arrowBinaryFeatures.polygons?.table.schema.fields[0].type),
    'List<List<FixedSizeList[2]<Float64>>>',
    'wraps polygon geometry in nested Arrow lists'
  );
  t.equal(
    String(arrowBinaryFeatures.polygons?.table.getChild('polygonIndices')?.type),
    'List<Uint32>',
    'stores raw polygon indices as a sidecar Arrow column'
  );
  t.equal(
    arrowBinaryFeatures.lines?.table.getChild('geometry')?.data[0].valueOffsets.buffer,
    binaryFeatures.lines?.pathIndices.value.buffer,
    'reuses line path offsets without copying'
  );
  t.equal(
    arrowBinaryFeatures.lines?.table.getChild('geometry')?.data[0].children[0].children[0].values
      .buffer,
    binaryFeatures.lines?.positions.value.buffer,
    'reuses line coordinate values without copying'
  );
  t.end();
});

test('gis#arrow-binary-feature-collection round-trips binary feature collections', t => {
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

  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.points?.positions.value || []),
    Array.from(binaryFeatures.points?.positions.value || []),
    'round-trips point positions'
  );
  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.lines?.pathIndices.value || []),
    Array.from(binaryFeatures.lines?.pathIndices.value || []),
    'round-trips line path indices'
  );
  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.polygons?.polygonIndices.value || []),
    Array.from(binaryFeatures.polygons?.polygonIndices.value || []),
    'round-trips polygon indices'
  );
  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.polygons?.primitivePolygonIndices.value || []),
    Array.from(binaryFeatures.polygons?.primitivePolygonIndices.value || []),
    'round-trips primitive polygon indices'
  );
  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.polygons?.triangles?.value || []),
    Array.from(binaryFeatures.polygons?.triangles?.value || []),
    'round-trips polygon triangles'
  );
  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.points?.numericProps.weight.value || []),
    [1, 1],
    'round-trips point numeric props'
  );
  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.lines?.numericProps.weight.value || []),
    [2, 2],
    'round-trips line numeric props'
  );
  t.deepEqual(
    Array.from(roundTrippedBinaryFeatures.polygons?.numericProps.weight.value || []),
    [3, 3, 3, 3],
    'round-trips polygon numeric props'
  );
  t.equal(
    roundTrippedBinaryFeatures.lines?.positions.value.buffer,
    binaryFeatures.lines?.positions.value.buffer,
    'round-trips line positions zero-copy'
  );
  t.equal(
    roundTrippedBinaryFeatures.lines?.pathIndices.value.buffer,
    binaryFeatures.lines?.pathIndices.value.buffer,
    'round-trips line offsets zero-copy'
  );
  t.equal(
    roundTrippedBinaryFeatures.polygons?.polygonIndices.value.buffer,
    binaryFeatures.polygons?.polygonIndices.value.buffer,
    'round-trips polygon indices zero-copy'
  );
  t.end();
});
