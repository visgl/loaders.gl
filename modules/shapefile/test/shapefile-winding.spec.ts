// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {load} from '@loaders.gl/core';
import {GeoArrowTableConverter} from '@loaders.gl/geoarrow';
import {convertWKBToGeometry} from '@loaders.gl/gis';
import type {ArrowTable, GeoJSONTable, Geometry} from '@loaders.gl/schema';
import {convert} from '@loaders.gl/schema-utils';
import {ShapefileLoader, SHPLoader} from '@loaders.gl/shapefile';

const SHAPEFILE_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const POLYGON_FIXTURES = ['polygons', 'multipolygon_with_holes'] as const;

test.each(
  POLYGON_FIXTURES
)('SHPLoader emits right-hand-rule WKB rings for %s', async fixtureName => {
  const result = await load(`${SHAPEFILE_DATA_FOLDER}/${fixtureName}.shp`, SHPLoader, {
    core: {worker: false},
    shp: {shape: 'wkb'}
  });

  const geometries = result.geometries
    .filter((geometry): geometry is Uint8Array => geometry !== null)
    .map(geometry => convertWKBToGeometry(toArrayBuffer(geometry)));

  expect(geometries.length).toBeGreaterThan(0);
  for (const geometry of geometries) {
    expectRightHandRule(geometry);
  }
});

test.each(
  POLYGON_FIXTURES
)('ShapefileLoader emits right-hand-rule typed GeoArrow rings for %s', async fixtureName => {
  const table = (await load(`${SHAPEFILE_DATA_FOLDER}/${fixtureName}.shp`, ShapefileLoader, {
    core: {worker: false},
    shapefile: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow'}
  })) as ArrowTable;
  const geojsonTable = convert(table.data, 'geojson-table', GeoArrowTableConverter) as GeoJSONTable;

  expect(geojsonTable.features.length).toBeGreaterThan(0);
  for (const feature of geojsonTable.features) {
    expectRightHandRule(feature.geometry);
  }
});

/** Verifies that Polygon and MultiPolygon rings follow the GeoJSON right-hand rule. */
function expectRightHandRule(geometry: Geometry | null): void {
  expect(geometry).not.toBeNull();
  if (geometry?.type === 'Polygon') {
    expectPolygonRightHandRule(geometry.coordinates);
    return;
  }
  if (geometry?.type === 'MultiPolygon') {
    for (const polygonCoordinates of geometry.coordinates) {
      expectPolygonRightHandRule(polygonCoordinates);
    }
    return;
  }
  throw new Error(`Expected Polygon or MultiPolygon, received ${geometry?.type}`);
}

/** Verifies counterclockwise exterior winding and clockwise interior winding. */
function expectPolygonRightHandRule(polygonCoordinates: number[][][]): void {
  expect(getSignedRingArea(polygonCoordinates[0])).toBeGreaterThan(0);
  for (const interiorRing of polygonCoordinates.slice(1)) {
    expect(getSignedRingArea(interiorRing)).toBeLessThan(0);
  }
}

/** Calculates the signed planar area of a closed linear ring. */
function getSignedRingArea(ring: number[][]): number {
  let doubleArea = 0;
  for (let coordinateIndex = 0; coordinateIndex < ring.length - 1; coordinateIndex++) {
    const currentCoordinate = ring[coordinateIndex];
    const nextCoordinate = ring[coordinateIndex + 1];
    doubleArea +=
      currentCoordinate[0] * nextCoordinate[1] - nextCoordinate[0] * currentCoordinate[1];
  }
  return doubleArea / 2;
}

/** Returns the exact ArrayBuffer slice occupied by a WKB byte view. */
function toArrayBuffer(wkb: Uint8Array): ArrayBuffer {
  return wkb.buffer.slice(wkb.byteOffset, wkb.byteOffset + wkb.byteLength) as ArrayBuffer;
}
