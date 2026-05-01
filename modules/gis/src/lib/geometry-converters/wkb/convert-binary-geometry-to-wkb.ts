// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryGeometry,
  BinaryLineGeometry,
  BinaryPointGeometry,
  BinaryPolygonGeometry
} from '@loaders.gl/schema';
import type {GeoParquetGeometryType} from '../../geoarrow/geoparquet-metadata';
import {parseWKBHeader} from './helpers/parse-wkb-header';
import {WKBGeometryType, type WKBHeader} from './helpers/wkb-types';
import {WKBBuilder, type WKBCoordinateTransform} from './wkb-builder';

export type CoordinateTransform = WKBCoordinateTransform;

export type BinaryGeometryWKBOptions = {
  hasZ?: boolean;
  hasM?: boolean;
  transform?: CoordinateTransform;
};

export function convertBinaryGeometryToWKB(
  geometry: BinaryGeometry | null,
  options: BinaryGeometryWKBOptions = {}
): Uint8Array | null {
  if (!geometry) {
    return null;
  }

  const wkbOptions = getWKBOptions(geometry.positions.size, options);
  const byteLength = getBinaryGeometryWKBSize(geometry, wkbOptions);
  const wkb = new Uint8Array(byteLength);
  const builder = new WKBBuilder({mode: 'write', target: wkb, ...wkbOptions});
  writeBinaryGeometryToWKB(builder, geometry);
  builder.finishGeometry();
  return wkb;
}

/** Measures the byte length of one binary geometry encoded as WKB. */
export function getBinaryGeometryWKBSize(
  geometry: BinaryGeometry,
  options: BinaryGeometryWKBOptions = {}
): number {
  const wkbOptions = getWKBOptions(geometry.positions.size, options);
  const builder = new WKBBuilder({mode: 'measure', ...wkbOptions});
  writeBinaryGeometryToWKB(builder, geometry);
  return builder.finishGeometry();
}

/** Writes one binary geometry into an incremental WKB builder. */
export function writeBinaryGeometryToWKB(builder: WKBBuilder, geometry: BinaryGeometry): void {
  switch (geometry.type) {
    case 'Point':
      writePointGeometry(builder, geometry);
      break;
    case 'LineString':
      writeLineGeometry(builder, geometry);
      break;
    case 'Polygon':
      writePolygonGeometry(builder, geometry);
      break;
  }
}

export function reprojectWKBInPlace(wkb: Uint8Array, transform: CoordinateTransform): Uint8Array {
  reprojectWKBGeometry(new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength), 0, transform);
  return wkb;
}

export function inferBinaryGeometryTypes(
  geometries: (BinaryGeometry | null)[]
): GeoParquetGeometryType[] {
  const geometryTypes = new Set<GeoParquetGeometryType>();
  for (const geometry of geometries) {
    if (!geometry) {
      continue;
    }
    const suffix = geometry.positions.size > 2 ? ' Z' : '';
    switch (geometry.type) {
      case 'Point':
        geometryTypes.add(`${getPointCount(geometry) > 1 ? 'MultiPoint' : 'Point'}${suffix}`);
        break;
      case 'LineString':
        geometryTypes.add(
          `${getPartCount(geometry.pathIndices.value) > 1 ? 'MultiLineString' : 'LineString'}${suffix}`
        );
        break;
      case 'Polygon':
        geometryTypes.add(
          `${getPartCount(geometry.polygonIndices.value) > 1 ? 'MultiPolygon' : 'Polygon'}${suffix}`
        );
        break;
    }
  }
  return [...geometryTypes];
}

function writePointGeometry(builder: WKBBuilder, geometry: BinaryPointGeometry) {
  const pointCount = getPointCount(geometry);
  if (pointCount === 1) {
    writePoint(builder, geometry, 0);
    return;
  }

  builder.beginMultiPoint(pointCount);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    writePoint(builder, geometry, pointIndex);
  }
}

function writeLineGeometry(builder: WKBBuilder, geometry: BinaryLineGeometry) {
  const pathIndices = geometry.pathIndices.value;
  if (getPartCount(pathIndices) === 1) {
    writeLineString(builder, geometry, pathIndices[0], pathIndices[1]);
    return;
  }

  builder.beginMultiLineString(getPartCount(pathIndices));
  for (let partIndex = 0; partIndex < pathIndices.length - 1; partIndex++) {
    writeLineString(builder, geometry, pathIndices[partIndex], pathIndices[partIndex + 1]);
  }
}

function writePolygonGeometry(builder: WKBBuilder, geometry: BinaryPolygonGeometry) {
  const polygonIndices = geometry.polygonIndices.value;
  if (getPartCount(polygonIndices) === 1) {
    writePolygon(builder, geometry, polygonIndices[0], polygonIndices[1]);
    return;
  }

  builder.beginMultiPolygon(getPartCount(polygonIndices));
  for (let partIndex = 0; partIndex < polygonIndices.length - 1; partIndex++) {
    writePolygon(builder, geometry, polygonIndices[partIndex], polygonIndices[partIndex + 1]);
  }
}

function writePoint(builder: WKBBuilder, geometry: BinaryPointGeometry, pointIndex: number) {
  builder.beginPoint();
  writeCoordinate(builder, geometry.positions.value, geometry.positions.size, pointIndex);
}

function writeLineString(
  builder: WKBBuilder,
  geometry: BinaryLineGeometry,
  startPoint: number,
  endPoint: number
) {
  builder.beginLineString(endPoint - startPoint);
  for (let pointIndex = startPoint; pointIndex < endPoint; pointIndex++) {
    writeCoordinate(builder, geometry.positions.value, geometry.positions.size, pointIndex);
  }
}

function writePolygon(
  builder: WKBBuilder,
  geometry: BinaryPolygonGeometry,
  startPoint: number,
  endPoint: number
) {
  const primitivePolygonIndices = geometry.primitivePolygonIndices.value;
  builder.beginPolygon(getPolygonRingCount(primitivePolygonIndices, startPoint, endPoint));

  for (let ringIndex = 0; ringIndex < primitivePolygonIndices.length - 1; ringIndex++) {
    const ringStart = primitivePolygonIndices[ringIndex];
    const ringEnd = primitivePolygonIndices[ringIndex + 1];
    if (ringStart >= startPoint && ringEnd <= endPoint) {
      builder.beginLinearRing(ringEnd - ringStart);
      for (let pointIndex = ringStart; pointIndex < ringEnd; pointIndex++) {
        writeCoordinate(builder, geometry.positions.value, geometry.positions.size, pointIndex);
      }
    }
  }
}

function writeCoordinate(
  builder: WKBBuilder,
  positions: ArrayLike<number>,
  size: number,
  pointIndex: number
) {
  const offset = pointIndex * size;
  const x = Number(positions[offset]);
  const y = Number(positions[offset + 1]);
  const z = builder.hasZ ? Number(positions[offset + 2]) : undefined;
  const m = builder.hasM ? Number(positions[offset + (builder.hasZ ? 3 : 2)]) : undefined;
  builder.writeCoordinate(x, y, z, m);
}

function reprojectWKBGeometry(
  dataView: DataView,
  byteOffset: number,
  transform: CoordinateTransform
): number {
  const header = parseWKBHeader(dataView, {byteOffset} as WKBHeader);
  const {geometryType, littleEndian} = header;
  const coordinateSize = header.dimensions * 8;
  let offset = header.byteOffset;

  switch (geometryType) {
    case WKBGeometryType.Point:
      reprojectWKBCoordinate(dataView, offset, littleEndian, transform);
      return offset + coordinateSize;
    case WKBGeometryType.LineString:
      return reprojectWKBLineString(dataView, offset, littleEndian, coordinateSize, transform);
    case WKBGeometryType.Polygon:
      return reprojectWKBPolygon(dataView, offset, littleEndian, coordinateSize, transform);
    case WKBGeometryType.MultiPoint:
    case WKBGeometryType.MultiLineString:
    case WKBGeometryType.MultiPolygon: {
      const geometryCount = dataView.getUint32(offset, littleEndian);
      offset += 4;
      for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
        offset = reprojectWKBGeometry(dataView, offset, transform);
      }
      return offset;
    }
    default:
      throw new Error(`Unsupported WKB geometry type: ${geometryType}`);
  }
}

function reprojectWKBLineString(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean,
  coordinateSize: number,
  transform: CoordinateTransform
): number {
  const pointCount = dataView.getUint32(byteOffset, littleEndian);
  let offset = byteOffset + 4;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    reprojectWKBCoordinate(dataView, offset, littleEndian, transform);
    offset += coordinateSize;
  }
  return offset;
}

function reprojectWKBPolygon(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean,
  coordinateSize: number,
  transform: CoordinateTransform
): number {
  const ringCount = dataView.getUint32(byteOffset, littleEndian);
  let offset = byteOffset + 4;
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    offset = reprojectWKBLineString(dataView, offset, littleEndian, coordinateSize, transform);
  }
  return offset;
}

function reprojectWKBCoordinate(
  dataView: DataView,
  byteOffset: number,
  littleEndian: boolean,
  transform: CoordinateTransform
) {
  const coordinate = [
    dataView.getFloat64(byteOffset, littleEndian),
    dataView.getFloat64(byteOffset + 8, littleEndian)
  ];
  const projected = transform(coordinate);
  dataView.setFloat64(byteOffset, projected[0], littleEndian);
  dataView.setFloat64(byteOffset + 8, projected[1], littleEndian);
}

function getWKBOptions(size: number, options: BinaryGeometryWKBOptions): BinaryGeometryWKBOptions {
  return {
    ...options,
    hasZ: options.hasZ ?? size > 2,
    hasM: options.hasM ?? size > 3
  };
}

function getPointCount(geometry: BinaryPointGeometry): number {
  return geometry.positions.value.length / geometry.positions.size;
}

function getPartCount(indices: ArrayLike<number>): number {
  return Math.max(0, indices.length - 1);
}

function getPolygonRingCount(
  primitivePolygonIndices: ArrayLike<number>,
  startPoint: number,
  endPoint: number
): number {
  let ringCount = 0;
  for (let ringIndex = 0; ringIndex < primitivePolygonIndices.length - 1; ringIndex++) {
    if (
      primitivePolygonIndices[ringIndex] >= startPoint &&
      primitivePolygonIndices[ringIndex + 1] <= endPoint
    ) {
      ringCount++;
    }
  }
  return ringCount;
}
