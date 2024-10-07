// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import * as arrow from 'apache-arrow';
import type {
  MultiPolygon,
  Position,
  Polygon,
  MultiPoint,
  Point,
  MultiLineString,
  LineString,
  Geometry,
  GeoArrowEncoding
} from '@loaders.gl/schema';
import {convertWKBToGeoJSON} from './wkt/convert-wkb-to-geojson';
import {convertWKTToGeoJSON} from './wkt/convert-wkt-to-geojson';

/**
 * parse geometry from arrow data that is returned from processArrowData()
 * NOTE: this function could be deduplicated with the binaryToGeometry() in deck.gl,
 * it is currently used for deck.gl picking because currently deck.gl returns only the index of the feature
 *
 * @param data data extraced from arrow vector representing a geometry
 * @param encoding the geoarrow encoding of the geometry column
 * @returns Feature or null
 */
export function convertGeoArrowGeometryToGeoJSON(
  arrowCellValue: any,
  encoding?: GeoArrowEncoding
): Geometry | null {
  // sanity
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
    default: {
      throw Error(`GeoArrow encoding not supported ${encoding}`);
    }
  }
}

function arrowWKBToGeometry(arrowCellValue: any): Geometry | null {
  // The actual WKB array buffer starts from byteOffset and ends at byteOffset + byteLength
  const arrayBuffer: ArrayBuffer = arrowCellValue.buffer.slice(
    arrowCellValue.byteOffset,
    arrowCellValue.byteOffset + arrowCellValue.byteLength
  );
  return convertWKBToGeoJSON(arrayBuffer);
}

function arrowWKTToGeometry(arrowCellValue: any): Geometry | null {
  const string: string = arrowCellValue;
  return convertWKTToGeoJSON(string);
}

/**
 * convert Arrow MultiPolygon to geojson Feature
 */
function arrowMultiPolygonToGeometry(arrowMultiPolygon: any): MultiPolygon {
  const multiPolygon: Position[][][] = [];
  for (let m = 0; m < arrowMultiPolygon.length; m++) {
    const arrowPolygon = arrowMultiPolygon.get(m);
    const polygon: Position[][] = [];
    for (let i = 0; arrowPolygon && i < arrowPolygon?.length; i++) {
      const arrowRing = arrowPolygon?.get(i);
      const ring: Position[] = [];
      for (let j = 0; arrowRing && j < arrowRing.length; j++) {
        const arrowCoord = arrowRing.get(j);
        const coord: Position = Array.from(arrowCoord);
        ring.push(coord);
      }
      polygon.push(ring);
    }
    multiPolygon.push(polygon);
  }
  const geometry: MultiPolygon = {
    type: 'MultiPolygon',
    coordinates: multiPolygon
  };
  return geometry;
}

/**
 * convert Arrow Polygon to geojson Feature
 */
function arrowPolygonToGeometry(arrowPolygon: any): Polygon {
  const polygon: Position[][] = [];
  for (let i = 0; arrowPolygon && i < arrowPolygon.length; i++) {
    const arrowRing = arrowPolygon.get(i);
    const ring: Position[] = [];
    for (let j = 0; arrowRing && j < arrowRing.length; j++) {
      const arrowCoord = arrowRing.get(j);
      const coords: Position = Array.from(arrowCoord);
      ring.push(coords);
    }
    polygon.push(ring);
  }
  const geometry: Polygon = {
    type: 'Polygon',
    coordinates: polygon
  };
  return geometry;
}

/**
 * convert Arrow MultiPoint to geojson MultiPoint
 */
function arrowMultiPointToGeometry(arrowMultiPoint: any): MultiPoint {
  const multiPoint: Position[] = [];
  for (let i = 0; arrowMultiPoint && i < arrowMultiPoint.length; i++) {
    const arrowPoint = arrowMultiPoint.get(i);
    if (arrowPoint) {
      const coord: Position = Array.from(arrowPoint);
      multiPoint.push(coord);
    }
  }
  return {
    type: 'MultiPoint',
    coordinates: multiPoint
  };
}

/**
 * convert Arrow Point to geojson Point
 */
function arrowPointToGeometry(arrowPoint: any): Point {
  const point: Position = Array.from(arrowPoint);
  return {
    type: 'Point',
    coordinates: point
  };
}

/**
 * convert Arrow MultiLineString to geojson MultiLineString
 */
function arrowMultiLineStringToGeometry(arrowMultiLineString: any): MultiLineString {
  const multiLineString: Position[][] = [];
  for (let i = 0; arrowMultiLineString && i < arrowMultiLineString.length; i++) {
    const arrowLineString = arrowMultiLineString.get(i);
    const lineString: Position[] = [];
    for (let j = 0; arrowLineString && j < arrowLineString.length; j++) {
      const arrowCoord = arrowLineString.get(j);
      if (arrowCoord) {
        const coords: Position = Array.from(arrowCoord);
        lineString.push(coords);
      }
    }
    multiLineString.push(lineString);
  }
  return {
    type: 'MultiLineString',
    coordinates: multiLineString
  };
}

/**
 * convert Arrow LineString to geojson LineString
 */
function arrowLineStringToGeometry(arrowLineString: any): LineString {
  const lineString: Position[] = [];
  for (let i = 0; arrowLineString && i < arrowLineString.length; i++) {
    const arrowCoord = arrowLineString.get(i);
    if (arrowCoord) {
      const coords: Position = Array.from(arrowCoord);
      lineString.push(coords);
    }
  }
  return {
    type: 'LineString',
    coordinates: lineString
  };
}
