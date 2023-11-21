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
  LineString
} from '@loaders.gl/schema';
import type {GeoArrowEncoding} from '@loaders.gl/gis';

type RawArrowFeature = {
  data: arrow.Vector;
  encoding?: GeoArrowEncoding;
};

/**
 * parse geometry from arrow data that is returned from processArrowData()
 * NOTE: this function could be duplicated with the binaryToFeature() in deck.gl,
 * it is currently only used for picking because currently deck.gl returns only the index of the feature
 * So the following functions could be deprecated once deck.gl returns the feature directly for binary geojson layer
 *
 * @param rawData the raw geometry data returned from processArrowData, which is an object with two properties: encoding and data
 * @see processArrowData
 * @returns Feature or null
 */
export function parseGeometryFromArrow(rawData: RawArrowFeature): Feature | null {
  const encoding = rawData.encoding?.toLowerCase() as typeof rawData.encoding;
  const data = rawData.data;
  if (!encoding || !data) {
    return null;
  }

  let geometry;

  switch (encoding) {
    case 'geoarrow.multipolygon':
      geometry = arrowMultiPolygonToFeature(data);
      break;
    case 'geoarrow.polygon':
      geometry = arrowPolygonToFeature(data);
      break;
    case 'geoarrow.multipoint':
      geometry = arrowMultiPointToFeature(data);
      break;
    case 'geoarrow.point':
      geometry = arrowPointToFeature(data);
      break;
    case 'geoarrow.multilinestring':
      geometry = arrowMultiLineStringToFeature(data);
      break;
    case 'geoarrow.linestring':
      geometry = arrowLineStringToFeature(data);
      break;
    case 'geoarrow.wkb':
      throw Error(`GeoArrow encoding not supported ${encoding}`);
    case 'geoarrow.wkt':
      throw Error(`GeoArrow encoding not supported ${encoding}`);
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
  const geometry: MultiPoint = {
    type: 'MultiPoint',
    coordinates: multiPoint
  };
  return geometry;
}

/**
 * convert Arrow Point to geojson Point
 */
function arrowPointToFeature(arrowPoint: arrow.Vector): Point {
  const point: Position = Array.from(arrowPoint);
  const geometry: Point = {
    type: 'Point',
    coordinates: point
  };
  return geometry;
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
  const geometry: MultiLineString = {
    type: 'MultiLineString',
    coordinates: multiLineString
  };
  return geometry;
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
  const geometry: LineString = {
    type: 'LineString',
    coordinates: lineString
  };
  return geometry;
}
