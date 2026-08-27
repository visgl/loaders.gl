// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test} from 'vitest';

import {fetchFile} from '@loaders.gl/core';
import {convertWKBToGeometry} from '@loaders.gl/gis';
import {makeSHPWKBGeometryData} from '../src/lib/parsers/build-wkb-geometry-arrow';

const FIXTURE_ROOT = '@loaders.gl/shapefile/test/data/shapefile-js';
const fixtures: Record<string, ArrayBuffer> = {};

beforeAll(async () => {
  for (const fixtureName of ['points', 'polylines', 'multipoints', 'null', 'point-z']) {
    fixtures[fixtureName] = await (
      await fetchFile(`${FIXTURE_ROOT}/${fixtureName}.shp`)
    ).arrayBuffer();
  }
});

describe('makeSHPWKBGeometryData', () => {
  test('writes point, line, multipoint, and null records into contiguous Arrow buffers', () => {
    const pointData = makeSHPWKBGeometryData(fixtures.points);
    const lineData = makeSHPWKBGeometryData(fixtures.polylines);
    const multiPointData = makeSHPWKBGeometryData(fixtures.multipoints);
    const nullData = makeSHPWKBGeometryData(fixtures.null);

    expect(readGeometry(pointData, 0).type).toBe('Point');
    expect(readGeometry(lineData, 0).type).toMatch(/LineString/);
    expect(readGeometry(multiPointData, 0).type).toMatch(/Point/);
    expect(pointData.valueOffsets[pointData.length]).toBe(pointData.values.byteLength);
    expect(lineData.valueOffsets[lineData.length]).toBe(lineData.values.byteLength);
    expect(multiPointData.valueOffsets[multiPointData.length]).toBe(
      multiPointData.values.byteLength
    );
    expect(nullData.nullCount).toBe(4);
    expect(nullData.nullBitmap).toBeDefined();
  });

  test('uses the generic builder for dimensions and coordinate transforms', () => {
    const pointZData = makeSHPWKBGeometryData(fixtures['point-z']);
    const pointZ = readGeometry(pointZData, 0);
    expect(pointZ.coordinates.length).toBeGreaterThan(2);

    const originalPoint = readGeometry(makeSHPWKBGeometryData(fixtures.points), 0);
    const transformedPoint = readGeometry(
      makeSHPWKBGeometryData(fixtures.points, undefined, coordinate => [
        coordinate[0] + 10,
        coordinate[1] - 5
      ]),
      0
    );
    expect(transformedPoint.coordinates[0]).toBeCloseTo(originalPoint.coordinates[0] + 10);
    expect(transformedPoint.coordinates[1]).toBeCloseTo(originalPoint.coordinates[1] - 5);
  });

  test('stops safely at malformed records and rejects unsupported shape types', () => {
    const zeroLengthRecord = createSingleRecord(0, 0);
    expect(makeSHPWKBGeometryData(zeroLengthRecord).length).toBe(0);

    const truncatedRecord = createSingleRecord(1, 20).slice(0, 110);
    expect(makeSHPWKBGeometryData(truncatedRecord).length).toBe(0);

    expect(() => makeSHPWKBGeometryData(createSingleRecord(99, 4))).toThrow(
      'unsupported shape type: 99'
    );
  });
});

/** Reads one Arrow Binary value as a loaders.gl binary geometry. */
function readGeometry(data: any, index: number): any {
  const start = data.valueOffsets[index];
  const end = data.valueOffsets[index + 1];
  const bytes = data.values.slice(start, end);
  return convertWKBToGeometry(bytes.buffer);
}

/** Creates a minimal SHP buffer containing one record header and body. */
function createSingleRecord(recordType: number, recordByteLength: number): ArrayBuffer {
  const bytes = new Uint8Array(108 + recordByteLength);
  const dataView = new DataView(bytes.buffer);
  dataView.setInt32(104, recordByteLength / 2, false);
  if (recordByteLength >= 4) {
    dataView.setInt32(108, recordType, true);
  }
  return bytes.buffer;
}
