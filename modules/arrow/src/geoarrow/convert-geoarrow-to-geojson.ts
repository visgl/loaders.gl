// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  Feature,
  MultiPolygon,
  Position,
  Polygon,
  MultiPoint,
  Point,
  MultiLineString,
  LineString,
  Geometry
} from '@loaders.gl/schema';
import type {GeoArrowEncoding} from '@loaders.gl/gis';
import {WKBLoader, WKTLoader} from '@loaders.gl/wkt';

/**
 * parse geometry from arrow data that is returned from processArrowData()
 * NOTE: this function could be deduplicated with the binaryToFeature() in deck.gl,
 * it is currently used for deck.gl picking because currently deck.gl returns only the index of the feature
 *
 * @param data an arrow vector representing a geometry column
 * @param encoding the geoarrow encoding of the geometry column
 * @returns Feature or null
 */
export function parseGeometryFromArrow(arrowVector: arrow.Vector, encoding?: GeoArrowEncoding): Feature | null {
  // sanity
  encoding = encoding?.toLowerCase() as GeoArrowEncoding;
  if (!encoding || !arrowVector) {
    return null;
  }

  let geometry: Geometry;

  switch (encoding) {
    case 'geoarrow.multipolygon':
      geometry = arrowMultiPolygonToFeature(arrowVector);
      break;
    case 'geoarrow.polygon':
      geometry = arrowPolygonToFeature(arrowVector);
      break;
    case 'geoarrow.multipoint':
      geometry = arrowMultiPointToFeature(arrowVector);
      break;
    case 'geoarrow.point':
      geometry = arrowPointToFeature(arrowVector);
      break;
    case 'geoarrow.multilinestring':
      geometry = arrowMultiLineStringToFeature(arrowVector);
      break;
    case 'geoarrow.linestring':
      geometry = arrowLineStringToFeature(arrowVector);
      break;
    case 'geoarrow.wkb':
      geometry = WKBLoader.parseSync?.(arrowVector)! as Geometry;
      break;
    case 'geoarrow.wkt':
      geometry = WKTLoader.parseSync?.(arrowVector)!;
      break;
    default: {
      throw Error(`GeoArrow encoding not supported ${encoding}`);
    }
  }

  return {
    type: 'Feature',
    geometry,
    properties: {}
  };
}

/**
 * convert Arrow MultiPolygon to geojson Feature
 */
function arrowMultiPolygonToFeature(arrowMultiPolygon: arrow.Vector): MultiPolygon {
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
function arrowPolygonToFeature(arrowPolygon: arrow.Vector): Polygon {
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
function arrowMultiPointToFeature(arrowMultiPoint: arrow.Vector): MultiPoint {
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
function arrowPointToFeature(arrowPoint: arrow.Vector): Point {
  const point: Position = Array.from(arrowPoint);
  return {
    type: 'Point',
    coordinates: point
  };
}

/**
 * convert Arrow MultiLineString to geojson MultiLineString
 */
function arrowMultiLineStringToFeature(arrowMultiLineString: arrow.Vector): MultiLineString {
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
function arrowLineStringToFeature(arrowLineString: arrow.Vector): LineString {
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
