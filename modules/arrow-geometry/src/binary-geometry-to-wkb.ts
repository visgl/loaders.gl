// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryGeometry,
  BinaryLineGeometry,
  BinaryPointGeometry,
  BinaryPolygonGeometry
} from '@loaders.gl/schema';
import type {GeoParquetGeometryType} from '@loaders.gl/schema';
import {visitWKB} from '@math.gl/wkb';
import {WKBBuilder, type WKBCoordinateTransform} from './wkb-builder';

/** XY coordinate transform retained by legacy binary output helpers. */
export type CoordinateTransform = WKBCoordinateTransform;

/** Dimensional and reprojection options for legacy binary geometry output. */
export type BinaryGeometryWKBOptions = {
  /** Include elevation ordinates; inferred from positions when absent. */
  hasZ?: boolean;
  /** Include measure ordinates; inferred from positions when absent. */
  hasM?: boolean;
  /** Optional XY transform applied while writing. */
  transform?: CoordinateTransform;
};

/** Encodes one legacy binary geometry, preserving a null geometry as null. */
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

/** Reprojects XY ordinates in place; math.gl validates and traverses each WKB geometry. */
export function reprojectWKBInPlace(wkb: Uint8Array, transform: CoordinateTransform): Uint8Array {
  const dataView = new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength);
  let littleEndian = true;
  visitWKB(wkb, {
    geometry(header) {
      littleEndian = header.littleEndian;
    },
    coordinate(coordinateX, coordinateY, _elevation, _measure, _dimension, byteOffset) {
      const projected = transform([coordinateX, coordinateY]);
      dataView.setFloat64(byteOffset, projected[0], littleEndian);
      dataView.setFloat64(byteOffset + 8, projected[1], littleEndian);
    }
  });
  return wkb;
}

/**
 * Infers legacy geometry type labels using the same dimension options as the WKB writer.
 * Three ordinates default to XYZ; pass hasZ: false and hasM: true for XYM.
 */
export function inferBinaryGeometryTypes(
  geometries: (BinaryGeometry | null)[],
  options: Pick<BinaryGeometryWKBOptions, 'hasZ' | 'hasM'> = {}
): GeoParquetGeometryType[] {
  const geometryTypes = new Set<GeoParquetGeometryType>();
  for (const geometry of geometries) {
    if (!geometry) {
      continue;
    }
    const {hasZ, hasM} = getWKBOptions(geometry.positions.size, options);
    const suffix = hasZ ? (hasM ? ' ZM' : ' Z') : hasM ? ' M' : '';
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
