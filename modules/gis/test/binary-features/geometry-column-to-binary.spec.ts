// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
import {
  convertGeometryColumnToBinaryFeatureCollection,
  convertGeometryToWKB,
  convertGeometryValuesToBinaryFeatureCollection,
  type GeometryColumnBinaryFeatureCollectionScratch
} from '@loaders.gl/gis';

test('gis#geometry-column-to-binary converts WKB geometry columns', t => {
  const table = {
    shape: 'object-row-table' as const,
    data: [
      {
        id: 1,
        geometry: new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}))
      },
      {
        id: 2,
        geometry: new Uint8Array(
          convertGeometryToWKB({
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1]
            ]
          })
        )
      },
      {
        id: 3,
        geometry: new Uint8Array(
          convertGeometryToWKB({
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0]
              ]
            ]
          })
        )
      }
    ]
  };
  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry',
    geometryEncoding: 'wkb'
  });

  t.equal(binaryFeatures.points?.properties[0]?.id, 1, 'preserves point row properties');
  t.equal(binaryFeatures.lines?.properties[0]?.id, 2, 'preserves line row properties');
  t.equal(binaryFeatures.polygons?.properties[0]?.id, 3, 'preserves polygon row properties');
  t.deepEqual(
    Array.from(binaryFeatures.lines?.pathIndices.value || []),
    [0, 2],
    'builds line path indices'
  );
  t.ok((binaryFeatures.polygons?.triangles?.value.length || 0) > 0, 'triangulates polygon output');
  t.end();
});

test('gis#geometry-column-to-binary converts WKT geometry collections into multiple bins', t => {
  const binaryFeatures = convertGeometryValuesToBinaryFeatureCollection(
    ['GEOMETRYCOLLECTION (POINT (1 2), LINESTRING (0 0, 1 1), POLYGON ((0 0, 1 0, 1 1, 0 0)))'],
    {geometryEncoding: 'wkt'}
  );

  t.equal(binaryFeatures.points?.properties.length, 1, 'creates one point feature');
  t.equal(binaryFeatures.lines?.properties.length, 1, 'creates one line feature');
  t.equal(binaryFeatures.polygons?.properties.length, 1, 'creates one polygon feature');
  t.equal(binaryFeatures.points?.globalFeatureIds.value[0], 0, 'shares point global feature id');
  t.equal(binaryFeatures.lines?.globalFeatureIds.value[0], 0, 'shares line global feature id');
  t.equal(
    binaryFeatures.polygons?.globalFeatureIds.value[0],
    0,
    'shares polygon global feature id'
  );
  t.end();
});

test('gis#geometry-column-to-binary reuses scratch arrays when capacity is sufficient', t => {
  const scratch: GeometryColumnBinaryFeatureCollectionScratch = {};
  const first = convertGeometryValuesToBinaryFeatureCollection(
    [
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]})),
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [3, 4]}))
    ],
    {geometryEncoding: 'wkb', scratch}
  );
  const originalPositions = scratch.points?.positions;
  const originalFeatureIds = scratch.points?.featureIds;

  const second = convertGeometryValuesToBinaryFeatureCollection(
    [new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [5, 6]}))],
    {geometryEncoding: 'wkb', scratch}
  );

  t.equal(scratch.points?.positions, originalPositions, 'reuses point positions scratch');
  t.equal(scratch.points?.featureIds, originalFeatureIds, 'reuses point feature id scratch');
  t.equal(
    first.points?.positions.value.buffer,
    originalPositions?.buffer,
    'first output is backed by scratch'
  );
  t.equal(
    second.points?.positions.value.buffer,
    originalPositions?.buffer,
    'second output is backed by reused scratch'
  );
  t.end();
});

test('gis#geometry-column-to-binary grows scratch arrays when capacity is insufficient', t => {
  const scratch: GeometryColumnBinaryFeatureCollectionScratch = {
    points: {
      positions: new Float64Array(2),
      featureIds: new Uint32Array(1),
      globalFeatureIds: new Uint32Array(1)
    }
  };

  convertGeometryValuesToBinaryFeatureCollection(
    [
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]})),
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [3, 4]}))
    ],
    {geometryEncoding: 'wkb', scratch}
  );

  t.ok((scratch.points?.positions?.length || 0) >= 4, 'grows point positions scratch');
  t.ok((scratch.points?.featureIds?.length || 0) >= 2, 'grows point feature ids scratch');
  t.ok(
    (scratch.points?.globalFeatureIds?.length || 0) >= 2,
    'grows point global feature ids scratch'
  );
  t.end();
});

test('gis#geometry-column-to-binary reads Arrow string columns', t => {
  const arrowTable = arrow.tableFromArrays({
    id: [1],
    geometry: ['LINESTRING (0 0, 1 1)']
  });
  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(arrowTable, {
    geometryColumn: 'geometry',
    geometryEncoding: 'wkt'
  });

  t.equal(
    binaryFeatures.lines?.properties[0]?.id,
    1,
    'reads non-geometry Arrow columns as properties'
  );
  t.deepEqual(
    Array.from(binaryFeatures.lines?.positions.value || []),
    [0, 0, 1, 1],
    'converts Arrow WKT values to binary line positions'
  );
  t.end();
});
