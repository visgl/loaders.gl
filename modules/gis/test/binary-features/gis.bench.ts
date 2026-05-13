import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';
import {earcut} from '@math.gl/polygon';
import {getGeoarrowVertexCount} from '@loaders.gl/geoarrow';

import {
  convertGeometryToWKB,
  convertWKBToGeometry,
  geojsonToBinary,
  makeWKBGeometryData,
  triangulateWKB
} from '@loaders.gl/gis';
import type {Geometry, MultiPolygon, Polygon, Position} from '@loaders.gl/schema';

// const GEOJSON_URL = '@loaders.gl/json/test/data/geojson-big.json';
const GEOJSON_POLYGONS_URL = '@loaders.gl/mvt/test/data/geojson-vt/us-states.json';

export default async function gisBench(suite) {
  // @ts-expect-error
  const {features} = await load(GEOJSON_POLYGONS_URL, JSONLoader);

  const polygonWKB = getGeometryWKB(features, 'Polygon');
  const multiPolygonWKB = getGeometryWKB(features, 'MultiPolygon');
  const polygonVertexCount = getGeoarrowVertexCount(makeWKBGeometryData([polygonWKB]));
  const multiPolygonVertexCount = getGeoarrowVertexCount(makeWKBGeometryData([multiPolygonWKB]));

  suite.groupSorted('wkb-triangulation - Polygon');
  addWKBPolygonTriangulationBenchmarks(suite, 'Polygon', polygonWKB, polygonVertexCount);

  suite.groupSorted('wkb-triangulation - MultiPolygon');
  addWKBPolygonTriangulationBenchmarks(
    suite,
    'MultiPolygon',
    multiPolygonWKB,
    multiPolygonVertexCount
  );

  suite.group('geojson-to-binary');

  const options = {multiplier: features.length, unit: 'features'};
  suite.addAsync('geojsonToBinary(triangulate=true)', options, async () => {
    geojsonToBinary(features);
  });
  suite.addAsync('geojsonToBinary(triangulate=false)', options, async () => {
    geojsonToBinary(features, {fixRingWinding: true, triangulate: false});
  });
}

/**
 * Adds WKB triangulation benchmarks for one polygonal geometry value.
 * @param suite Benchmark suite.
 * @param geometryType Geometry type label.
 * @param wkb WKB input.
 * @param vertexCount Number of source WKB vertices represented by the input.
 */
function addWKBPolygonTriangulationBenchmarks(
  suite,
  geometryType: 'Polygon' | 'MultiPolygon',
  wkb: ArrayBuffer,
  vertexCount: number
): void {
  const options = {multiplier: vertexCount, unit: 'vertices'};

  suite.add(`${geometryType} convertWKBToGeometry + earcut inputs`, options, () => {
    triangulateWKBViaGeometry(wkb);
  });
  suite.add(`${geometryType} triangulateWKB`, options, () => {
    triangulateWKB(wkb);
  });
}

/**
 * Finds a source geometry of the requested type and serializes it as WKB.
 * @param features GeoJSON features loaded for the benchmark.
 * @param geometryType Requested polygon geometry type.
 * @returns WKB-encoded geometry.
 */
function getGeometryWKB(
  features: {geometry: Geometry}[],
  geometryType: 'Polygon' | 'MultiPolygon'
): ArrayBuffer {
  const feature = features.find(candidate => candidate.geometry?.type === geometryType);
  if (!feature) {
    throw new Error(`Expected ${geometryType} fixture geometry for WKB benchmark.`);
  }
  return convertGeometryToWKB(feature.geometry);
}

/**
 * Triangulates WKB by first converting to GeoJSON geometry and then building earcut inputs.
 * @param wkb WKB input.
 * @returns Number of triangle indices generated.
 */
function triangulateWKBViaGeometry(wkb: ArrayBuffer): number {
  const geometry = convertWKBToGeometry(wkb);
  const inputs = getGeometryEarcutInputs(geometry);
  let triangleIndexCount = 0;

  for (const input of inputs) {
    triangleIndexCount += earcut(input.positions, input.holeIndices, input.dimensions).length;
  }

  return triangleIndexCount;
}

/**
 * Converts GeoJSON Polygon or MultiPolygon geometry to standard earcut inputs.
 * @param geometry GeoJSON polygon geometry.
 * @returns One earcut input per polygon.
 */
function getGeometryEarcutInputs(geometry: Geometry): {
  positions: number[];
  holeIndices?: number[];
  dimensions: number;
}[] {
  switch (geometry.type) {
    case 'Polygon':
      return [getPolygonEarcutInput(geometry.coordinates)];
    case 'MultiPolygon':
      return geometry.coordinates.map(polygon => getPolygonEarcutInput(polygon));
    default:
      throw new Error(`Expected Polygon or MultiPolygon geometry, found ${geometry.type}.`);
  }
}

/**
 * Converts one GeoJSON polygon coordinate array to a standard earcut input.
 * @param polygonCoordinates GeoJSON polygon coordinates.
 * @returns Earcut input for one polygon.
 */
function getPolygonEarcutInput(
  polygonCoordinates: Polygon['coordinates'] | MultiPolygon['coordinates'][number]
): {positions: number[]; holeIndices?: number[]; dimensions: number} {
  const positions: number[] = [];
  const holeIndices: number[] = [];
  const dimensions = getPositionDimensions(polygonCoordinates);
  let vertexCount = 0;

  for (let ringIndex = 0; ringIndex < polygonCoordinates.length; ringIndex++) {
    if (ringIndex > 0) {
      holeIndices.push(vertexCount);
    }

    for (const position of polygonCoordinates[ringIndex]) {
      for (let coordinateIndex = 0; coordinateIndex < dimensions; coordinateIndex++) {
        positions.push(position[coordinateIndex]);
      }
      vertexCount++;
    }
  }

  return {
    positions,
    holeIndices: holeIndices.length > 0 ? holeIndices : undefined,
    dimensions
  };
}

/**
 * Returns the coordinate dimension used by one polygon.
 * @param polygonCoordinates GeoJSON polygon coordinates.
 * @returns Coordinate value count per position.
 */
function getPositionDimensions(
  polygonCoordinates: Polygon['coordinates'] | MultiPolygon['coordinates'][number]
): number {
  for (const ring of polygonCoordinates) {
    const firstPosition = ring[0] as Position | undefined;
    if (firstPosition) {
      return firstPosition.length;
    }
  }
  return 2;
}
