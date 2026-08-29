// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  MultiPolygon,
  Position,
  Polygon,
  MultiPoint,
  Point,
  MultiLineString,
  LineString,
  Geometry
} from '@loaders.gl/schema';
import {convertWKBToGeometry, convertWKTToGeometry} from '@loaders.gl/gis';
import type {GeoArrowEncoding} from '../../metadata/geoarrow-metadata';

/**
 * Parses a single GeoArrow cell value into a GeoJSON geometry.
 */
export function convertGeoArrowGeometryToGeoJSON(
  arrowCellValue: any,
  encoding?: GeoArrowEncoding
): Geometry | null {
  encoding = encoding?.toLowerCase() as GeoArrowEncoding;
  if (!encoding || !arrowCellValue) {
    return null;
  }

  switch (encoding) {
    case 'geoarrow.multipolygon':
      return arrowMultiPolygonToGeometry(arrowCellValue);
    case 'geoarrow.polygon':
      return arrowPolygonToGeometry(arrowCellValue);
    case 'geoarrow.multipoint':
      return arrowMultiPointToGeometry(arrowCellValue);
    case 'geoarrow.point':
      return arrowPointToGeometry(arrowCellValue);
    case 'geoarrow.multilinestring':
      return arrowMultiLineStringToGeometry(arrowCellValue);
    case 'geoarrow.linestring':
      return arrowLineStringToGeometry(arrowCellValue);
    case 'geoarrow.wkb':
      return arrowWKBToGeometry(arrowCellValue);
    case 'geoarrow.wkt':
      return arrowWKTToGeometry(arrowCellValue);
    default:
      throw Error(`GeoArrow encoding not supported ${encoding}`);
  }
}

function arrowWKBToGeometry(arrowCellValue: any): Geometry | null {
  const arrayBuffer: ArrayBuffer = arrowCellValue.buffer.slice(
    arrowCellValue.byteOffset,
    arrowCellValue.byteOffset + arrowCellValue.byteLength
  );
  return convertWKBToGeometry(arrayBuffer);
}

function arrowWKTToGeometry(arrowCellValue: any): Geometry | null {
  return convertWKTToGeometry(arrowCellValue as string);
}

function arrowMultiPolygonToGeometry(arrowMultiPolygon: any): MultiPolygon {
  const multiPolygon: Position[][][] = [];
  for (let polygonIndex = 0; polygonIndex < arrowMultiPolygon.length; polygonIndex++) {
    const arrowPolygon = arrowMultiPolygon.get(polygonIndex);
    const polygon: Position[][] = [];
    for (let ringIndex = 0; arrowPolygon && ringIndex < arrowPolygon.length; ringIndex++) {
      const arrowRing = arrowPolygon.get(ringIndex);
      const ring: Position[] = [];
      for (
        let coordinateIndex = 0;
        arrowRing && coordinateIndex < arrowRing.length;
        coordinateIndex++
      ) {
        ring.push(convertArrowCoordinate(arrowRing.get(coordinateIndex)));
      }
      polygon.push(ring);
    }
    multiPolygon.push(polygon);
  }

  return {type: 'MultiPolygon', coordinates: multiPolygon};
}

function arrowPolygonToGeometry(arrowPolygon: any): Polygon {
  const polygon: Position[][] = [];
  for (let ringIndex = 0; arrowPolygon && ringIndex < arrowPolygon.length; ringIndex++) {
    const arrowRing = arrowPolygon.get(ringIndex);
    const ring: Position[] = [];
    for (
      let coordinateIndex = 0;
      arrowRing && coordinateIndex < arrowRing.length;
      coordinateIndex++
    ) {
      ring.push(convertArrowCoordinate(arrowRing.get(coordinateIndex)));
    }
    polygon.push(ring);
  }

  return {type: 'Polygon', coordinates: polygon};
}

function arrowMultiPointToGeometry(arrowMultiPoint: any): MultiPoint {
  const multiPoint: Position[] = [];
  for (let pointIndex = 0; arrowMultiPoint && pointIndex < arrowMultiPoint.length; pointIndex++) {
    const arrowPoint = arrowMultiPoint.get(pointIndex);
    if (arrowPoint) {
      multiPoint.push(convertArrowCoordinate(arrowPoint));
    }
  }

  return {type: 'MultiPoint', coordinates: multiPoint};
}

function arrowPointToGeometry(arrowPoint: any): Point {
  if (isEmptyArrowCoordinate(arrowPoint)) {
    return {type: 'Point', coordinates: []};
  }
  return {type: 'Point', coordinates: convertArrowCoordinate(arrowPoint)};
}

function arrowMultiLineStringToGeometry(arrowMultiLineString: any): MultiLineString {
  const multiLineString: Position[][] = [];
  for (
    let lineIndex = 0;
    arrowMultiLineString && lineIndex < arrowMultiLineString.length;
    lineIndex++
  ) {
    const arrowLineString = arrowMultiLineString.get(lineIndex);
    const lineString: Position[] = [];
    for (
      let coordinateIndex = 0;
      arrowLineString && coordinateIndex < arrowLineString.length;
      coordinateIndex++
    ) {
      const arrowCoordinate = arrowLineString.get(coordinateIndex);
      if (arrowCoordinate) {
        lineString.push(convertArrowCoordinate(arrowCoordinate));
      }
    }
    multiLineString.push(lineString);
  }

  return {type: 'MultiLineString', coordinates: multiLineString};
}

function arrowLineStringToGeometry(arrowLineString: any): LineString {
  const lineString: Position[] = [];
  for (
    let coordinateIndex = 0;
    arrowLineString && coordinateIndex < arrowLineString.length;
    coordinateIndex++
  ) {
    const arrowCoordinate = arrowLineString.get(coordinateIndex);
    if (arrowCoordinate) {
      lineString.push(convertArrowCoordinate(arrowCoordinate));
    }
  }

  return {type: 'LineString', coordinates: lineString};
}

/** Reads an interleaved or separated GeoArrow coordinate value. */
function convertArrowCoordinate(arrowCoordinate: any): Position {
  if (arrowCoordinate && typeof arrowCoordinate.toArray === 'function') {
    return Array.from(arrowCoordinate.toArray()) as Position;
  }
  if (arrowCoordinate && typeof arrowCoordinate === 'object' && 'x' in arrowCoordinate) {
    return ['x', 'y', 'z', 'm']
      .filter(name => name in arrowCoordinate)
      .map(name => arrowCoordinate[name]) as Position;
  }
  return Array.from(arrowCoordinate) as Position;
}

/** Returns true when a native point's coordinate children are all null. */
function isEmptyArrowCoordinate(arrowCoordinate: any): boolean {
  if (arrowCoordinate && typeof arrowCoordinate.isValid === 'function') {
    for (let index = 0; index < arrowCoordinate.length; index++) {
      if (arrowCoordinate.isValid(index)) return false;
    }
    return arrowCoordinate.length > 0;
  }
  if (arrowCoordinate && typeof arrowCoordinate === 'object' && 'x' in arrowCoordinate) {
    return ['x', 'y', 'z', 'm']
      .filter(name => name in arrowCoordinate)
      .every(name => arrowCoordinate[name] == null);
  }
  return false;
}
