// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  TypedArray,
  BinaryGeometry,
  BinaryPointGeometry,
  BinaryLineGeometry,
  BinaryPolygonGeometry,
  Geometry
} from '@loaders.gl/schema';
import {binaryToGeometry} from '@loaders.gl/gis';
import type {WKBLoaderOptions} from '../wkb-loader';

import {parseWKBHeader, WKBGeometryType} from './parse-wkb-header';

export function parseWKB(
  arrayBuffer: ArrayBuffer,
  options?: WKBLoaderOptions
): BinaryGeometry | Geometry {
  const binaryGeometry = parseWKBToBinary(arrayBuffer, options);
  const shape = options?.wkb?.shape || 'binary-geometry';
  switch (shape) {
    case 'binary-geometry':
      return binaryGeometry;
    case 'geojson-geometry':
      return binaryToGeometry(binaryGeometry);
    case 'geometry':
      // eslint-disable-next-line no-console
      console.error('WKBLoader: "geometry" shape is deprecated, use "binary-geometry" instead');
      return binaryToGeometry(binaryGeometry);
    default:
      throw new Error(shape);
  }
}

export function parseWKBToBinary(
  arrayBuffer: ArrayBuffer,
  options?: WKBLoaderOptions
): BinaryGeometry {
  const dataView = new DataView(arrayBuffer);

  const wkbHeader = parseWKBHeader(dataView);

  const {geometryType, dimensions, littleEndian} = wkbHeader;
  const offset = wkbHeader.byteOffset;

  switch (geometryType) {
    case WKBGeometryType.Point:
      const point = parsePoint(dataView, offset, dimensions, littleEndian);
      return point.geometry;
    case WKBGeometryType.LineString:
      const line = parseLineString(dataView, offset, dimensions, littleEndian);
      return line.geometry;
    case WKBGeometryType.Polygon:
      const polygon = parsePolygon(dataView, offset, dimensions, littleEndian);
      return polygon.geometry;
    case WKBGeometryType.MultiPoint:
      const multiPoint = parseMultiPoint(dataView, offset, dimensions, littleEndian);
      multiPoint.type = 'Point';
      return multiPoint;
    case WKBGeometryType.MultiLineString:
      const multiLine = parseMultiLineString(dataView, offset, dimensions, littleEndian);
      multiLine.type = 'LineString';
      return multiLine;
    case WKBGeometryType.MultiPolygon:
      const multiPolygon = parseMultiPolygon(dataView, offset, dimensions, littleEndian);
      multiPolygon.type = 'Polygon';
      return multiPolygon;
    // case WKBGeometryType.GeometryCollection:
    // TODO: handle GeometryCollections
    // return parseGeometryCollection(dataView, offset, dimensions, littleEndian);
    default:
      throw new Error(`WKB: Unsupported geometry type: ${geometryType}`);
  }
}

// Primitives; parse point and linear ring
function parsePoint(
  dataView: DataView,
  offset: number,
  dimension: number,
  littleEndian: boolean
): {geometry: BinaryPointGeometry; offset: number} {
  const positions = new Float64Array(dimension);
  for (let i = 0; i < dimension; i++) {
    positions[i] = dataView.getFloat64(offset, littleEndian);
    offset += 8;
  }

  return {
    geometry: {type: 'Point', positions: {value: positions, size: dimension}},
    offset
  };
}

function parseLineString(
  dataView: DataView,
  offset: number,
  dimension: number,
  littleEndian: boolean
): {geometry: BinaryLineGeometry; offset: number} {
  const nPoints = dataView.getUint32(offset, littleEndian);
  offset += 4;

  // Instantiate array
  const positions = new Float64Array(nPoints * dimension);
  for (let i = 0; i < nPoints * dimension; i++) {
    positions[i] = dataView.getFloat64(offset, littleEndian);
    offset += 8;
  }

  const pathIndices = [0];
  if (nPoints > 0) {
    pathIndices.push(nPoints);
  }

  return {
    geometry: {
      type: 'LineString',
      positions: {value: positions, size: dimension},
      pathIndices: {value: new Uint16Array(pathIndices), size: 1}
    },
    offset
  };
}

// https://stackoverflow.com/a/55261098
const cumulativeSum = (sum: number) => (value: number) => (sum += value);

function parsePolygon(
  dataView: DataView,
  offset: number,
  dimension: number,
  littleEndian: boolean
): {geometry: BinaryPolygonGeometry; offset: number} {
  const nRings = dataView.getUint32(offset, littleEndian);
  offset += 4;

  const rings: TypedArray[] = [];
  for (let i = 0; i < nRings; i++) {
    const parsed = parseLineString(dataView, offset, dimension, littleEndian);
    const {positions} = parsed.geometry;
    offset = parsed.offset;
    rings.push(positions.value);
  }

  const concatenatedPositions = new Float64Array(concatTypedArrays(rings).buffer);
  const polygonIndices = [0];
  if (concatenatedPositions.length > 0) {
    polygonIndices.push(concatenatedPositions.length / dimension);
  }
  const primitivePolygonIndices = rings.map((l) => l.length / dimension).map(cumulativeSum(0));
  primitivePolygonIndices.unshift(0);

  return {
    geometry: {
      type: 'Polygon',
      positions: {value: concatenatedPositions, size: dimension},
      polygonIndices: {
        value: new Uint16Array(polygonIndices),
        size: 1
      },
      primitivePolygonIndices: {value: new Uint16Array(primitivePolygonIndices), size: 1}
    },
    offset
  };
}

function parseMultiPoint(
  dataView: DataView,
  offset: number,
  dimension: number,
  littleEndian: boolean
): BinaryPointGeometry {
  const nPoints = dataView.getUint32(offset, littleEndian);
  offset += 4;

  const binaryPointGeometries: BinaryPointGeometry[] = [];
  for (let i = 0; i < nPoints; i++) {
    // Byte order for point
    const littleEndianPoint = dataView.getUint8(offset) === 1;
    offset++;

    // Assert point type
    if (dataView.getUint32(offset, littleEndianPoint) % 1000 !== 1) {
      throw new Error('WKB: Inner geometries of MultiPoint not of type Point');
    }

    offset += 4;

    const parsed = parsePoint(dataView, offset, dimension, littleEndianPoint);
    offset = parsed.offset;
    binaryPointGeometries.push(parsed.geometry);
  }

  return concatenateBinaryPointGeometries(binaryPointGeometries, dimension);
}

function parseMultiLineString(
  dataView: DataView,
  offset: number,
  dimension: number,
  littleEndian: boolean
): BinaryLineGeometry {
  const nLines = dataView.getUint32(offset, littleEndian);
  offset += 4;

  const binaryLineGeometries: BinaryLineGeometry[] = [];
  for (let i = 0; i < nLines; i++) {
    // Byte order for line
    const littleEndianLine = dataView.getUint8(offset) === 1;
    offset++;

    // Assert type LineString
    if (dataView.getUint32(offset, littleEndianLine) % 1000 !== 2) {
      throw new Error('WKB: Inner geometries of MultiLineString not of type LineString');
    }
    offset += 4;

    const parsed = parseLineString(dataView, offset, dimension, littleEndianLine);
    offset = parsed.offset;
    binaryLineGeometries.push(parsed.geometry);
  }

  return concatenateBinaryLineGeometries(binaryLineGeometries, dimension);
}

function parseMultiPolygon(
  dataView: DataView,
  offset: number,
  dimension: number,
  littleEndian: boolean
): BinaryPolygonGeometry {
  const nPolygons = dataView.getUint32(offset, littleEndian);
  offset += 4;

  const binaryPolygonGeometries: BinaryPolygonGeometry[] = [];
  for (let i = 0; i < nPolygons; i++) {
    // Byte order for polygon
    const littleEndianPolygon = dataView.getUint8(offset) === 1;
    offset++;

    // Assert type Polygon
    if (dataView.getUint32(offset, littleEndianPolygon) % 1000 !== 3) {
      throw new Error('WKB: Inner geometries of MultiPolygon not of type Polygon');
    }
    offset += 4;

    const parsed = parsePolygon(dataView, offset, dimension, littleEndianPolygon);
    offset = parsed.offset;
    binaryPolygonGeometries.push(parsed.geometry);
  }

  return concatenateBinaryPolygonGeometries(binaryPolygonGeometries, dimension);
}

// TODO - move to loaders.gl/schema/gis

function concatenateBinaryPointGeometries(
  binaryPointGeometries: BinaryPointGeometry[],
  dimension: number
): BinaryPointGeometry {
  const positions: TypedArray[] = binaryPointGeometries.map((geometry) => geometry.positions.value);
  const concatenatedPositions = new Float64Array(concatTypedArrays(positions).buffer);

  return {
    type: 'Point',
    positions: {value: concatenatedPositions, size: dimension}
  };
}

function concatenateBinaryLineGeometries(
  binaryLineGeometries: BinaryLineGeometry[],
  dimension: number
): BinaryLineGeometry {
  const lines: TypedArray[] = binaryLineGeometries.map((geometry) => geometry.positions.value);
  const concatenatedPositions = new Float64Array(concatTypedArrays(lines).buffer);
  const pathIndices = lines.map((line) => line.length / dimension).map(cumulativeSum(0));
  pathIndices.unshift(0);

  return {
    type: 'LineString',
    positions: {value: concatenatedPositions, size: dimension},
    pathIndices: {value: new Uint16Array(pathIndices), size: 1}
  };
}

function concatenateBinaryPolygonGeometries(
  binaryPolygonGeometries: BinaryPolygonGeometry[],
  dimension: number
): BinaryPolygonGeometry {
  const polygons: TypedArray[] = [];
  const primitivePolygons: TypedArray[] = [];

  for (const binaryPolygon of binaryPolygonGeometries) {
    const {positions, primitivePolygonIndices} = binaryPolygon;
    polygons.push(positions.value);
    primitivePolygons.push(primitivePolygonIndices.value);
  }

  const concatenatedPositions = new Float64Array(concatTypedArrays(polygons).buffer);
  const polygonIndices = polygons.map((p) => p.length / dimension).map(cumulativeSum(0));
  polygonIndices.unshift(0);

  // Combine primitivePolygonIndices from each individual polygon
  const primitivePolygonIndices = [0];
  for (const primitivePolygon of primitivePolygons) {
    primitivePolygonIndices.push(
      ...primitivePolygon
        .filter((x: number) => x > 0)
        .map((x: number) => x + primitivePolygonIndices[primitivePolygonIndices.length - 1])
    );
  }

  return {
    type: 'Polygon',
    positions: {value: concatenatedPositions, size: dimension},
    polygonIndices: {value: new Uint16Array(polygonIndices), size: 1},
    primitivePolygonIndices: {value: new Uint16Array(primitivePolygonIndices), size: 1}
  };
}

// TODO: remove copy; import from typed-array-utils
// modules/math/src/geometry/typed-arrays/typed-array-utils.js
function concatTypedArrays(arrays: TypedArray[]): TypedArray {
  let byteLength = 0;
  for (let i = 0; i < arrays.length; ++i) {
    byteLength += arrays[i].byteLength;
  }
  const buffer = new Uint8Array(byteLength);

  let byteOffset = 0;
  for (let i = 0; i < arrays.length; ++i) {
    const data = new Uint8Array(arrays[i].buffer);
    byteLength = data.length;
    for (let j = 0; j < byteLength; ++j) {
      buffer[byteOffset++] = data[j];
    }
  }
  return buffer;
}
