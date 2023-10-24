// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz

import type {Geometry, GeometryCollection} from '@loaders.gl/schema';
import type {Point, LineString, Polygon} from '@loaders.gl/schema';
import type {MultiPoint, MultiLineString, MultiPolygon} from '@loaders.gl/schema';
import {BinaryReader} from './utils/binary-reader';
import {WKBGeometryType} from './parse-wkb-header';

/**
 * Check if an array buffer might be a TWKB array buffer
 * @param arrayBuffer The array buffer to check
 * @returns false if this is definitely not a TWKB array buffer, true if it might be a TWKB array buffer
 */
export function isTWKB(arrayBuffer: ArrayBuffer): boolean {
  const binaryReader = new BinaryReader(arrayBuffer);

  const type = binaryReader.readUInt8();
  const geometryType = type & 0x0f;

  // Only geometry types 1 to 7 (point to geometry collection are currently defined)
  if (geometryType < 1 || geometryType > 7) {
    return false;
  }

  return true;
}

/** Passed around between parsing functions, extracted from the header */
type TWKBHeader = {
  geometryType: WKBGeometryType;

  hasBoundingBox: boolean;
  hasSizeAttribute: boolean;
  hasIdList: boolean;
  hasExtendedPrecision: boolean;
  isEmpty: boolean;

  precision: number;
  precisionFactor: number;

  hasZ: boolean;
  zPrecision: number;
  zPrecisionFactor: number;

  hasM: boolean;
  mPrecision: number;
  mPrecisionFactor: number;
};

export function parseTWKBGeometry(arrayBuffer: ArrayBuffer): Geometry {
  const binaryReader = new BinaryReader(arrayBuffer);

  const context = parseTWKBHeader(binaryReader);

  if (context.hasSizeAttribute) {
    binaryReader.readVarInt();
  }

  if (context.hasBoundingBox) {
    let dimensions = 2;

    if (context.hasZ) {
      dimensions++;
    }
    if (context.hasM) {
      dimensions++;
    }

    // TODO why are we throwing away these datums?
    for (let i = 0; i < dimensions; i++) {
      binaryReader.readVarInt();
      binaryReader.readVarInt();
    }
  }

  return parseGeometry(binaryReader, context, context.geometryType);
}

function parseTWKBHeader(binaryReader: BinaryReader): TWKBHeader {
  const type = binaryReader.readUInt8();
  const metadataHeader = binaryReader.readUInt8();

  const geometryType = type & 0x0f;

  const precision = zigZagDecode(type >> 4);

  const hasExtendedPrecision = Boolean((metadataHeader >> 3) & 1);
  let hasZ = false;
  let hasM = false;
  let zPrecision = 0;
  let zPrecisionFactor = 1;
  let mPrecision = 0;
  let mPrecisionFactor = 1;

  if (hasExtendedPrecision) {
    const extendedPrecision = binaryReader.readUInt8();
    hasZ = (extendedPrecision & 0x01) === 0x01;
    hasM = (extendedPrecision & 0x02) === 0x02;

    zPrecision = zigZagDecode((extendedPrecision & 0x1c) >> 2);
    zPrecisionFactor = Math.pow(10, zPrecision);

    mPrecision = zigZagDecode((extendedPrecision & 0xe0) >> 5);
    mPrecisionFactor = Math.pow(10, mPrecision);
  }

  return {
    geometryType,

    precision,
    precisionFactor: Math.pow(10, precision),

    hasBoundingBox: Boolean((metadataHeader >> 0) & 1),
    hasSizeAttribute: Boolean((metadataHeader >> 1) & 1),
    hasIdList: Boolean((metadataHeader >> 2) & 1),
    hasExtendedPrecision,
    isEmpty: Boolean((metadataHeader >> 4) & 1),

    hasZ,
    hasM,
    zPrecision,
    zPrecisionFactor,
    mPrecision,
    mPrecisionFactor
  };
}

function parseGeometry(
  binaryReader: BinaryReader,
  context: TWKBHeader,
  geometryType: WKBGeometryType
): Geometry {
  switch (geometryType) {
    case WKBGeometryType.Point:
      return parsePoint(binaryReader, context);
    case WKBGeometryType.LineString:
      return parseLineString(binaryReader, context);
    case WKBGeometryType.Polygon:
      return parsePolygon(binaryReader, context);
    case WKBGeometryType.MultiPoint:
      return parseMultiPoint(binaryReader, context);
    case WKBGeometryType.MultiLineString:
      return parseMultiLineString(binaryReader, context);
    case WKBGeometryType.MultiPolygon:
      return parseMultiPolygon(binaryReader, context);
    case WKBGeometryType.GeometryCollection:
      return parseGeometryCollection(binaryReader, context);
    default:
      throw new Error(`GeometryType ${geometryType} not supported`);
  }
}

// GEOMETRIES

function parsePoint(reader: BinaryReader, context: TWKBHeader): Point {
  if (context.isEmpty) {
    return {type: 'Point', coordinates: []};
  }

  return {type: 'Point', coordinates: readFirstPoint(reader, context)};
}

function parseLineString(reader: BinaryReader, context: TWKBHeader): LineString {
  if (context.isEmpty) {
    return {type: 'LineString', coordinates: []};
  }

  const pointCount = reader.readVarInt();

  const previousPoint = makePreviousPoint(context);

  const points: number[][] = [];
  for (let i = 0; i < pointCount; i++) {
    points.push(parseNextPoint(reader, context, previousPoint));
  }

  return {type: 'LineString', coordinates: points};
}

function parsePolygon(reader: BinaryReader, context: TWKBHeader): Polygon {
  if (context.isEmpty) {
    return {type: 'Polygon', coordinates: []};
  }

  const ringCount = reader.readVarInt();

  const previousPoint = makePreviousPoint(context);

  const exteriorRingLength = reader.readVarInt();
  const exteriorRing: number[][] = [];

  for (let i = 0; i < exteriorRingLength; i++) {
    exteriorRing.push(parseNextPoint(reader, context, previousPoint));
  }

  const polygon: number[][][] = [exteriorRing];
  for (let i = 1; i < ringCount; i++) {
    const interiorRingCount = reader.readVarInt();

    const interiorRing: number[][] = [];
    for (let j = 0; j < interiorRingCount; j++) {
      interiorRing.push(parseNextPoint(reader, context, previousPoint));
    }

    polygon.push(interiorRing);
  }

  return {type: 'Polygon', coordinates: polygon};
}

function parseMultiPoint(reader: BinaryReader, context: TWKBHeader): MultiPoint {
  if (context.isEmpty) {
    return {type: 'MultiPoint', coordinates: []};
  }

  const previousPoint = makePreviousPoint(context);
  const pointCount = reader.readVarInt();

  const coordinates: number[][] = [];
  for (let i = 0; i < pointCount; i++) {
    coordinates.push(parseNextPoint(reader, context, previousPoint));
  }

  return {type: 'MultiPoint', coordinates};
}

function parseMultiLineString(reader: BinaryReader, context: TWKBHeader): MultiLineString {
  if (context.isEmpty) {
    return {type: 'MultiLineString', coordinates: []};
  }

  const previousPoint = makePreviousPoint(context);
  const lineStringCount = reader.readVarInt();

  const coordinates: number[][][] = [];
  for (let i = 0; i < lineStringCount; i++) {
    const pointCount = reader.readVarInt();

    const lineString: number[][] = [];
    for (let j = 0; j < pointCount; j++) {
      lineString.push(parseNextPoint(reader, context, previousPoint));
    }

    coordinates.push(lineString);
  }

  return {type: 'MultiLineString', coordinates};
}

function parseMultiPolygon(reader: BinaryReader, context: TWKBHeader): MultiPolygon {
  if (context.isEmpty) {
    return {type: 'MultiPolygon', coordinates: []};
  }

  const previousPoint = makePreviousPoint(context);
  const polygonCount = reader.readVarInt();

  const polygons: number[][][][] = [];
  for (let i = 0; i < polygonCount; i++) {
    const ringCount = reader.readVarInt();

    const exteriorPointCount = reader.readVarInt();

    const exteriorRing: number[][] = [];
    for (let j = 0; j < exteriorPointCount; j++) {
      exteriorRing.push(parseNextPoint(reader, context, previousPoint));
    }

    const polygon: number[][][] = exteriorRing ? [exteriorRing] : [];

    for (let j = 1; j < ringCount; j++) {
      const interiorRing: number[][] = [];

      const interiorRingLength = reader.readVarInt();

      for (let k = 0; k < interiorRingLength; k++) {
        interiorRing.push(parseNextPoint(reader, context, previousPoint));
      }

      polygon.push(interiorRing);
    }

    polygons.push(polygon);
  }

  return {type: 'MultiPolygon', coordinates: polygons};
}

/** Geometry collection not yet supported */
function parseGeometryCollection(reader: BinaryReader, context: TWKBHeader): GeometryCollection {
  return {type: 'GeometryCollection', geometries: []};
  /**
  if (context.isEmpty) {
    return {type: 'GeometryCollection', geometries: []};
  }

  const geometryCount = reader.readVarInt();

  const geometries: Geometry[] = new Array(geometryCount);
  for (let i = 0; i < geometryCount; i++) {
    const geometry = parseGeometry(reader, context, geometryType);
    geometries.push(geometry);
  }

  return {type: 'GeometryCollection', geometries: []};
  */
}

// HELPERS

/** 
 * Maps negative values to positive values while going back and
  forth (0 = 0, -1 = 1, 1 = 2, -2 = 3, 2 = 4, -3 = 5, 3 = 6 ...)
 */
function zigZagDecode(value: number): number {
  return (value >> 1) ^ -(value & 1);
}

function makePointCoordinates(x: number, y: number, z?: number, m?: number): number[] {
  return (z !== undefined ? (m !== undefined ? [x, y, z, m] : [x, y, z]) : [x, y]) as number[];
}

function makePreviousPoint(context: TWKBHeader): number[] {
  return makePointCoordinates(0, 0, context.hasZ ? 0 : undefined, context.hasM ? 0 : undefined);
}

function readFirstPoint(reader: BinaryReader, context: TWKBHeader): number[] {
  const x = zigZagDecode(reader.readVarInt()) / context.precisionFactor;
  const y = zigZagDecode(reader.readVarInt()) / context.precisionFactor;
  const z = context.hasZ ? zigZagDecode(reader.readVarInt()) / context.zPrecisionFactor : undefined;
  const m = context.hasM ? zigZagDecode(reader.readVarInt()) / context.mPrecisionFactor : undefined;
  return makePointCoordinates(x, y, z, m);
}

/**
 * Modifies previousPoint
 */
function parseNextPoint(
  reader: BinaryReader,
  context: TWKBHeader,
  previousPoint: number[]
): number[] {
  previousPoint[0] += zigZagDecode(reader.readVarInt()) / context.precisionFactor;
  previousPoint[1] += zigZagDecode(reader.readVarInt()) / context.precisionFactor;

  if (context.hasZ) {
    previousPoint[2] += zigZagDecode(reader.readVarInt()) / context.zPrecisionFactor;
  }
  if (context.hasM) {
    previousPoint[3] += zigZagDecode(reader.readVarInt()) / context.mPrecisionFactor;
  }

  // Copy the point
  return previousPoint.slice();
}
