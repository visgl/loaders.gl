// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz

import type {Point, MultiPoint, LineString} from '@loaders.gl/schema';
import type {
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection,
  Geometry
} from '@loaders.gl/schema';

import {BinaryWriter} from './utils/binary-writer';
import {WKBGeometryType} from './parse-wkb-header';

type TWKBPrecision = {
  xy: number;
  z: number;
  m: number;
  xyFactor: number;
  zFactor: number;
  mFactor: number;
};

type TWKBEncoderContext = TWKBPrecision & {
  hasZ?: boolean;
  hasM?: boolean;
};

export function encodeTWKB(
  geometry: Geometry,
  options?: {hasZ?: boolean; hasM?: boolean}
): ArrayBuffer {
  const writer = new BinaryWriter(0, true);

  const context: TWKBEncoderContext = {
    ...getTwkbPrecision(5, 0, 0),
    hasZ: options?.hasZ,
    hasM: options?.hasM
  };

  encodeGeometry(writer, geometry, context);

  // TODO - we need to slice it?
  return writer.arrayBuffer;
}

function encodeGeometry(writer: BinaryWriter, geometry: Geometry, context: TWKBEncoderContext) {
  switch (geometry.type) {
    case 'Point':
      return encodePoint(writer, context, geometry);
    case 'LineString':
      return encodeLineString(writer, context, geometry);
    case 'Polygon':
      return encodePolygon(writer, context, geometry);
    case 'MultiPoint':
      return encodeMultiPoint(writer, context, geometry);
    case 'MultiLineString':
      return encodeMultiLineString(writer, context, geometry);
    case 'MultiPolygon':
      return encodeMultiPolygon(writer, context, geometry);
    case 'GeometryCollection':
      return encodeGeometryCollection(writer, context, geometry);
    default:
      throw new Error('unsupported geometry type');
  }
}

function encodePoint(writer: BinaryWriter, context: TWKBEncoderContext, point: Point): void {
  const isEmpty =
    point.coordinates.length === 0 || point[0] === 'undefined' || point[1] === 'undefined';

  writeTwkbHeader(writer, context, WKBGeometryType.Point, isEmpty);

  if (!isEmpty) {
    const previousPoint = [0, 0, 0, 0];
    writeTwkbPoint(writer, context, point.coordinates, previousPoint);
  }
}

function encodeLineString(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  lineString: LineString
): ArrayBuffer {
  const points = lineString.coordinates;
  const isEmpty = points.length === 0;

  writeTwkbHeader(writer, context, WKBGeometryType.LineString, isEmpty);

  if (!isEmpty) {
    writer.writeVarInt(points.length);
    const previousPoint = [0, 0, 0, 0];
    for (const point of points) {
      writeTwkbPoint(writer, context, point, previousPoint);
    }
  }

  return writer.arrayBuffer;
}

function encodePolygon(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  polygon: Polygon
): ArrayBuffer {
  const polygonRings = polygon.coordinates;

  const isEmpty = polygonRings.length === 0;

  writeTwkbHeader(writer, context, WKBGeometryType.Polygon, isEmpty);

  if (!isEmpty) {
    writer.writeVarInt(polygonRings.length);

    const previousPoint = [0, 0, 0, 0];
    for (const ring of polygonRings) {
      writer.writeVarInt(ring.length);
      for (const point of ring) {
        writeTwkbPoint(writer, context, previousPoint, point);
      }
    }
  }

  return writer.arrayBuffer;
}

function encodeMultiPoint(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  multiPoint: MultiPoint
): void {
  const points = multiPoint.coordinates;
  const isEmpty = points.length === 0;

  writeTwkbHeader(writer, context, WKBGeometryType.MultiPoint, isEmpty);

  if (!isEmpty) {
    writer.writeVarInt(points.length);

    const previousPoint = [0, 0, 0, 0];
    for (let i = 0; i < points.length; i++) {
      writeTwkbPoint(writer, context, previousPoint, points[i]);
    }
  }
}

function encodeMultiLineString(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  multiLineStrings: MultiLineString
): ArrayBuffer {
  const lineStrings = multiLineStrings.coordinates;
  const isEmpty = lineStrings.length === 0;

  writeTwkbHeader(writer, context, WKBGeometryType.MultiLineString, isEmpty);

  if (!isEmpty) {
    writer.writeVarInt(lineStrings.length);

    const previousPoint = [0, 0, 0, 0];
    for (const lineString of lineStrings) {
      writer.writeVarInt(lineString.length);

      for (const point of lineString) {
        writeTwkbPoint(writer, context, previousPoint, point);
      }
    }
  }

  return writer.arrayBuffer;
}

function encodeMultiPolygon(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  multiPolygon: MultiPolygon
): void {
  const {coordinates} = multiPolygon;
  const isEmpty = coordinates.length === 0;

  writeTwkbHeader(writer, context, WKBGeometryType.MultiPolygon, isEmpty);

  if (!isEmpty) {
    const polygons = coordinates;
    writer.writeVarInt(polygons.length);

    const previousPoint = [0, 0, 0, 0];

    for (const polygonRings of polygons) {
      writer.writeVarInt(polygonRings.length);
      for (const ring of polygonRings) {
        writer.writeVarInt(ring.length);
        for (const point of ring) {
          writeTwkbPoint(writer, context, previousPoint, point);
        }
      }
    }
  }
}

function encodeGeometryCollection(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  geometryCollection: GeometryCollection
): void {
  const {geometries} = geometryCollection;
  const isEmpty = geometries.length === 0;

  writeTwkbHeader(writer, context, WKBGeometryType.GeometryCollection, isEmpty);

  if (geometries.length > 0) {
    writer.writeVarInt(geometries.length);
    for (const geometry of geometries) {
      encodeGeometry(writer, geometry, context);
    }
  }
}

/**
 *
 * @param writer
 * @param context
 * @param geometryType
 * @param isEmpty
 */
function writeTwkbHeader(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  geometryType: WKBGeometryType,
  isEmpty: boolean
) {
  const type = (zigZagEncode(context.xy) << 4) + geometryType;
  let metadataHeader = context.hasZ || context.hasM ? 1 << 3 : 0;
  metadataHeader += isEmpty ? 1 << 4 : 0;

  writer.writeUInt8(type);
  writer.writeUInt8(metadataHeader);

  if (context.hasZ || context.hasM) {
    let extendedPrecision = 0;
    if (context.hasZ) {
      extendedPrecision |= 0x1;
    }
    if (context.hasM) {
      extendedPrecision |= 0x2;
    }
    writer.writeUInt8(extendedPrecision);
  }
}

/**
 * Write one point to array buffer. ZigZagEncoding the delta fdrom the previous point. Mutates previousPoint.
 * @param writer
 * @param context
 * @param previousPoint - Mutated by this function
 * @param point
 */
function writeTwkbPoint(
  writer: BinaryWriter,
  context: TWKBEncoderContext,
  point: number[],
  previousPoint: number[]
): void {
  const x = point[0] * context.xyFactor;
  const y = point[1] * context.xyFactor;
  const z = point[2] * context.zFactor;
  const m = point[3] * context.mFactor;

  writer.writeVarInt(zigZagEncode(x - previousPoint[0]));
  writer.writeVarInt(zigZagEncode(y - previousPoint[1]));
  if (context.hasZ) {
    writer.writeVarInt(zigZagEncode(z - previousPoint[2]));
  }
  if (context.hasM) {
    writer.writeVarInt(zigZagEncode(m - previousPoint[3]));
  }

  previousPoint[0] = x;
  previousPoint[1] = y;
  previousPoint[2] = z;
  previousPoint[3] = m;
}

// HELPERS

function zigZagEncode(value: number): number {
  return (value << 1) ^ (value >> 31);
}

function getTwkbPrecision(
  xyPrecision: number,
  zPrecision: number,
  mPrecision: number
): TWKBPrecision {
  return {
    xy: xyPrecision,
    z: zPrecision,
    m: mPrecision,
    xyFactor: Math.pow(10, xyPrecision),
    zFactor: Math.pow(10, zPrecision),
    mFactor: Math.pow(10, mPrecision)
  };
}
