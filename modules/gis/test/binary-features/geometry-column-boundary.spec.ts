// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {describe, expect, test} from 'vitest';
import {
  convertGeometryColumnToBinaryFeatureCollection,
  convertGeometryToWKB,
  convertGeometryValuesToBinaryFeatureCollection
} from '@loaders.gl/gis';

describe('geometry-column binary boundary coverage', () => {
  test('infers text, binary views, ArrayBuffers, null-only columns, and getter-backed values', () => {
    const text = convertGeometryValuesToBinaryFeatureCollection([null, 'POINT (1 2)']);
    expect(Array.from(text.points!.positions.value)).toEqual([1, 2]);
    expect(text.points!.properties).toEqual([{index: 1}]);

    const pointBuffer = convertGeometryToWKB({type: 'Point', coordinates: [3, 4]});
    const padded = new Uint8Array(pointBuffer.byteLength + 4);
    padded.set(new Uint8Array(pointBuffer), 2);
    const view = padded.subarray(2, padded.length - 2);
    const getterValues = {
      length: 2,
      get: (index: number) => (index === 0 ? undefined : view)
    };
    const binary = convertGeometryValuesToBinaryFeatureCollection(getterValues);
    expect(Array.from(binary.points!.positions.value)).toEqual([3, 4]);

    expect(convertGeometryValuesToBinaryFeatureCollection([])).toEqual({
      shape: 'binary-feature-collection'
    });
    expect(convertGeometryValuesToBinaryFeatureCollection([null, undefined])).toEqual({
      shape: 'binary-feature-collection'
    });
  });

  test('preserves four coordinates, property fallbacks, offsets, and failed triangulation', () => {
    const point = convertGeometryToWKB(
      {type: 'Point', coordinates: [1, 2, 3, 4]},
      {hasZ: true, hasM: true}
    );
    const fourDimensional = convertGeometryValuesToBinaryFeatureCollection([point], {
      globalFeatureIdOffset: 9,
      properties: []
    });
    expect(fourDimensional.points!.positions.size).toBe(4);
    expect(Array.from(fourDimensional.points!.positions.value)).toEqual([1, 2, 3, 4]);
    expect(fourDimensional.points!.properties).toEqual([{}]);
    expect(Array.from(fourDimensional.points!.globalFeatureIds.value)).toEqual([9]);

    const invalidPolygon = convertGeometryValuesToBinaryFeatureCollection([
      'POLYGON ((0 0, 1 1, 0 0))'
    ]);
    expect(invalidPolygon.polygons!.triangles).toBeUndefined();
    expect(Array.from(invalidPolygon.polygons!.polygonIndices.value)).toEqual([0, 3]);
  });

  test('grows and then reuses every line and polygon scratch buffer', () => {
    const scratch = {
      lines: {
        positions: new Float64Array(1),
        featureIds: new Uint32Array(0),
        globalFeatureIds: new Uint32Array(0),
        pathIndices: new Uint32Array(1)
      },
      polygons: {
        positions: new Float64Array(1),
        featureIds: new Uint32Array(0),
        globalFeatureIds: new Uint32Array(0),
        polygonIndices: new Uint32Array(1),
        primitivePolygonIndices: new Uint32Array(1)
      }
    };
    const first = convertGeometryValuesToBinaryFeatureCollection(
      [
        'GEOMETRYCOLLECTION (LINESTRING (0 0, 1 1), POLYGON ((0 0, 2 0, 0 2, 0 0), (0.2 0.2, 0.4 0.2, 0.2 0.4, 0.2 0.2)))'
      ],
      {scratch}
    );
    const linePositions = scratch.lines.positions;
    const polygonPositions = scratch.polygons.positions;
    expect(first.lines!.pathIndices.value).toEqual(new Uint32Array([0, 2]));
    expect(first.polygons!.primitivePolygonIndices.value).toEqual(new Uint32Array([0, 4, 8]));

    convertGeometryValuesToBinaryFeatureCollection(
      ['GEOMETRYCOLLECTION (LINESTRING (0 0, 1 1), POLYGON ((0 0, 1 0, 0 1, 0 0)))'],
      {scratch, triangulate: false}
    );
    expect(scratch.lines.positions).toBe(linePositions);
    expect(scratch.polygons.positions).toBe(polygonPositions);
  });

  test('reports mismatched encodings and missing Arrow columns', () => {
    expect(() =>
      convertGeometryValuesToBinaryFeatureCollection(['POINT (1 2)'], {geometryEncoding: 'wkb'})
    ).toThrow('WKB geometry columns must contain ArrayBuffer or typed array values');
    expect(() =>
      convertGeometryValuesToBinaryFeatureCollection(
        [convertGeometryToWKB({type: 'Point', coordinates: [1, 2]})],
        {geometryEncoding: 'wkt'}
      )
    ).toThrow('WKT geometry columns must contain string values');
    expect(() =>
      convertGeometryValuesToBinaryFeatureCollection(['POINT (1 2)'], {
        geometryEncoding: 'geoarrow.point'
      })
    ).toThrow('Unsupported geometry encoding');

    const table = arrow.tableFromArrays({id: [1]});
    expect(() =>
      convertGeometryColumnToBinaryFeatureCollection(table, {
        geometryColumn: 'missing',
        geometryEncoding: 'wkt'
      })
    ).toThrow('Could not find geometry column');
  });
});
