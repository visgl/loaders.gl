// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryGeometry,
  BinaryGeometryType,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry,
  BinaryFeatureCollection,
  BinaryFeature,
  // BinaryPointFeature,
  // BinaryLineFeature,
  // BinaryPolygonFeature,
  BinaryAttribute,
  Feature,
  Geometry,
  Position,
  GeoJsonProperties,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon
} from '@loaders.gl/schema';

// Note:L We do not handle GeometryCollection, define a limited Geometry type that always has coordinates.
// type FeatureGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

type BinaryToGeoJsonOptions = {
  type?: BinaryGeometryType;
  globalFeatureId?: number;
};

/**
 * Convert binary geometry representation to GeoJSON
 * @param data   geometry data in binary representation
 * @param options
 * @param options.type  Input data type: Point, LineString, or Polygon
 * @param options.featureId  Global feature id. If specified, only a single feature is extracted
 * @return GeoJSON objects
 */
export function binaryToGeojson(
  data: BinaryFeatureCollection,
  options?: BinaryToGeoJsonOptions
): Feature[] | Feature {
  const globalFeatureId = options?.globalFeatureId;
  if (globalFeatureId !== undefined) {
    return getSingleFeature(data, globalFeatureId);
  }
  return parseFeatures(data, options?.type);
}

/**
 * Return a single feature from a binary geometry representation as GeoJSON
 * @param data   geometry data in binary representation
 * @return GeoJSON feature
 */
function getSingleFeature(data: BinaryFeatureCollection, globalFeatureId: number): Feature {
  const dataArray = normalizeInput(data);
  for (const data of dataArray) {
    let lastIndex = 0;
    let lastValue = data.featureIds.value[0];

    // Scan through data until we find matching feature
    for (let i = 0; i < data.featureIds.value.length; i++) {
      const currValue = data.featureIds.value[i];
      if (currValue === lastValue) {
        // eslint-disable-next-line no-continue
        continue;
      }
      if (globalFeatureId === data.globalFeatureIds.value[lastIndex]) {
        return parseFeature(data, lastIndex, i);
      }
      lastIndex = i;
      lastValue = currValue;
    }

    if (globalFeatureId === data.globalFeatureIds.value[lastIndex]) {
      return parseFeature(data, lastIndex, data.featureIds.value.length);
    }
  }

  throw new Error(`featureId:${globalFeatureId} not found`);
}

function parseFeatures(data: BinaryFeatureCollection, type?: BinaryGeometryType): Feature[] {
  const dataArray = normalizeInput(data, type);
  return parseFeatureCollection(dataArray);
}

/** Parse input binary data and return a valid GeoJSON geometry object */
export function binaryToGeometry(
  data: BinaryGeometry,
  startIndex?: number,
  endIndex?: number
): Geometry {
  switch (data.type) {
    case 'Point':
      return pointToGeoJson(data, startIndex, endIndex);
    case 'LineString':
      return lineStringToGeoJson(data, startIndex, endIndex);
    case 'Polygon':
      return polygonToGeoJson(data, startIndex, endIndex);
    default:
      const unexpectedInput: never = data;
      throw new Error(`Unsupported geometry type: ${(unexpectedInput as any)?.type}`);
  }
}

// Normalize features
// Return an array of data objects, each of which have a type key
function normalizeInput(data: BinaryFeatureCollection, type?: BinaryGeometryType): BinaryFeature[] {
  const features: BinaryFeature[] = [];
  if (data.points) {
    data.points.type = 'Point';
    features.push(data.points);
  }
  if (data.lines) {
    data.lines.type = 'LineString';
    features.push(data.lines);
  }
  if (data.polygons) {
    data.polygons.type = 'Polygon';
    features.push(data.polygons);
  }

  return features;
}

/** Parse input binary data and return an array of GeoJSON Features */
function parseFeatureCollection(dataArray: BinaryFeature[]): Feature[] {
  const features: Feature[] = [];
  for (const data of dataArray) {
    if (data.featureIds.value.length === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }
    let lastIndex = 0;
    let lastValue = data.featureIds.value[0];

    // Need to deduce start, end indices of each feature
    for (let i = 0; i < data.featureIds.value.length; i++) {
      const currValue = data.featureIds.value[i];
      if (currValue === lastValue) {
        // eslint-disable-next-line no-continue
        continue;
      }

      features.push(parseFeature(data, lastIndex, i));
      lastIndex = i;
      lastValue = currValue;
    }

    // Last feature
    features.push(parseFeature(data, lastIndex, data.featureIds.value.length));
  }
  return features;
}

/** Parse input binary data and return a single GeoJSON Feature */
function parseFeature(data: BinaryFeature, startIndex?: number, endIndex?: number): Feature {
  const geometry = binaryToGeometry(data, startIndex, endIndex);
  const properties = parseProperties(data, startIndex, endIndex);
  const fields = parseFields(data, startIndex, endIndex);
  return {type: 'Feature', geometry, properties, ...fields};
}

/** Parse input binary data and return an object of fields */
function parseFields(data, startIndex: number = 0, endIndex?: number): GeoJsonProperties {
  return data.fields && data.fields[data.featureIds.value[startIndex]];
}

/** Parse input binary data and return an object of properties */
function parseProperties(data, startIndex: number = 0, endIndex?: number): GeoJsonProperties {
  const properties = Object.assign({}, data.properties[data.featureIds.value[startIndex]]);
  for (const key in data.numericProps) {
    properties[key] = data.numericProps[key].value[startIndex];
  }
  return properties;
}

/** Parse binary data of type Polygon */
function polygonToGeoJson(
  data: BinaryPolygonGeometry,
  startIndex: number = -Infinity,
  endIndex: number = Infinity
): Polygon | MultiPolygon {
  const {positions} = data;
  const polygonIndices = data.polygonIndices.value.filter((x) => x >= startIndex && x <= endIndex);
  const primitivePolygonIndices = data.primitivePolygonIndices.value.filter(
    (x) => x >= startIndex && x <= endIndex
  );
  const multi = polygonIndices.length > 2;

  // Polygon
  if (!multi) {
    const coordinates: Position[][] = [];
    for (let i = 0; i < primitivePolygonIndices.length - 1; i++) {
      const startRingIndex = primitivePolygonIndices[i];
      const endRingIndex = primitivePolygonIndices[i + 1];
      const ringCoordinates = ringToGeoJson(positions, startRingIndex, endRingIndex);
      coordinates.push(ringCoordinates);
    }

    return {type: 'Polygon', coordinates};
  }

  // MultiPolygon
  const coordinates: Position[][][] = [];
  for (let i = 0; i < polygonIndices.length - 1; i++) {
    const startPolygonIndex = polygonIndices[i];
    const endPolygonIndex = polygonIndices[i + 1];
    const polygonCoordinates = polygonToGeoJson(
      data,
      startPolygonIndex,
      endPolygonIndex
    ).coordinates;
    coordinates.push(polygonCoordinates as Position[][]);
  }

  return {type: 'MultiPolygon', coordinates};
}

/** Parse binary data of type LineString */
function lineStringToGeoJson(
  data: BinaryLineGeometry,
  startIndex: number = -Infinity,
  endIndex: number = Infinity
): LineString | MultiLineString {
  const {positions} = data;
  const pathIndices = data.pathIndices.value.filter((x) => x >= startIndex && x <= endIndex);
  const multi = pathIndices.length > 2;

  if (!multi) {
    const coordinates = ringToGeoJson(positions, pathIndices[0], pathIndices[1]);
    return {type: 'LineString', coordinates};
  }

  const coordinates: Position[][] = [];
  for (let i = 0; i < pathIndices.length - 1; i++) {
    const ringCoordinates = ringToGeoJson(positions, pathIndices[i], pathIndices[i + 1]);
    coordinates.push(ringCoordinates);
  }

  return {type: 'MultiLineString', coordinates};
}

/** Parse binary data of type Point */
function pointToGeoJson(data: BinaryPointGeometry, startIndex, endIndex): Point | MultiPoint {
  const {positions} = data;
  const coordinates = ringToGeoJson(positions, startIndex, endIndex);
  const multi = coordinates.length > 1;

  if (multi) {
    return {type: 'MultiPoint', coordinates};
  }

  return {type: 'Point', coordinates: coordinates[0]};
}

/**
 * Parse a linear ring of positions to a GeoJSON linear ring
 *
 * @param positions Positions TypedArray
 * @param startIndex Start index to include in ring
 * @param endIndex End index to include in ring
 * @returns GeoJSON ring
 */
function ringToGeoJson(
  positions: BinaryAttribute,
  startIndex?: number,
  endIndex?: number
): Position[] {
  startIndex = startIndex || 0;
  endIndex = endIndex || positions.value.length / positions.size;

  const ringCoordinates: Position[] = [];
  for (let j = startIndex; j < endIndex; j++) {
    const coord = Array<number>();
    for (let k = j * positions.size; k < (j + 1) * positions.size; k++) {
      coord.push(Number(positions.value[k]));
    }
    ringCoordinates.push(coord);
  }
  return ringCoordinates;
}
