// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryGeometry,
  BinaryLineGeometry,
  BinaryPointGeometry,
  BinaryPolygonGeometry
} from '@loaders.gl/schema';
import type {SHPHeader} from './parse-shp-header';

type CoordinateTransform = (coordinate: number[]) => number[];

type WKBOptions = {
  hasZ?: boolean;
  hasM?: boolean;
  transform?: CoordinateTransform;
};

const WKB_TYPE = {
  Point: 1,
  LineString: 2,
  Polygon: 3,
  MultiPoint: 4,
  MultiLineString: 5,
  MultiPolygon: 6
} as const;

export function convertBinaryGeometryToWKB(
  geometry: BinaryGeometry | null,
  header?: SHPHeader,
  transform?: CoordinateTransform
): Uint8Array | null {
  if (!geometry) {
    return null;
  }

  const options = getWKBOptions(geometry.positions.size, header);
  const writer = new WKBWriter(getBinaryGeometryWKBSize(geometry, options));
  writeBinaryGeometry(writer, geometry, options);
  const wkb = new Uint8Array(writer.arrayBuffer);
  if (transform) {
    reprojectWKBInPlace(wkb, transform);
  }
  return wkb;
}

export function reprojectWKBInPlace(wkb: Uint8Array, transform: CoordinateTransform): Uint8Array {
  reprojectWKBGeometry(new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength), 0, transform);
  return wkb;
}

export function inferBinaryGeometryTypes(geometries: (BinaryGeometry | null)[]) {
  const geometryTypes = new Set<string>();
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
  return [...geometryTypes] as any[];
}

function writeBinaryGeometry(writer: WKBWriter, geometry: BinaryGeometry, options: WKBOptions) {
  switch (geometry.type) {
    case 'Point':
      writePointGeometry(writer, geometry, options);
      break;
    case 'LineString':
      writeLineGeometry(writer, geometry, options);
      break;
    case 'Polygon':
      writePolygonGeometry(writer, geometry, options);
      break;
  }
}

function writePointGeometry(writer: WKBWriter, geometry: BinaryPointGeometry, options: WKBOptions) {
  const pointCount = getPointCount(geometry);
  if (pointCount === 1) {
    writePoint(writer, geometry, 0, options);
    return;
  }

  writeHeader(writer, WKB_TYPE.MultiPoint, options);
  writer.writeUInt32(pointCount);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    writePoint(writer, geometry, pointIndex, options);
  }
}

function writeLineGeometry(writer: WKBWriter, geometry: BinaryLineGeometry, options: WKBOptions) {
  const pathIndices = geometry.pathIndices.value;
  if (getPartCount(pathIndices) === 1) {
    writeLineString(writer, geometry, pathIndices[0], pathIndices[1], options);
    return;
  }

  writeHeader(writer, WKB_TYPE.MultiLineString, options);
  writer.writeUInt32(getPartCount(pathIndices));
  for (let partIndex = 0; partIndex < pathIndices.length - 1; partIndex++) {
    writeLineString(writer, geometry, pathIndices[partIndex], pathIndices[partIndex + 1], options);
  }
}

function writePolygonGeometry(
  writer: WKBWriter,
  geometry: BinaryPolygonGeometry,
  options: WKBOptions
) {
  const polygonIndices = geometry.polygonIndices.value;
  if (getPartCount(polygonIndices) === 1) {
    writePolygon(writer, geometry, polygonIndices[0], polygonIndices[1], options);
    return;
  }

  writeHeader(writer, WKB_TYPE.MultiPolygon, options);
  writer.writeUInt32(getPartCount(polygonIndices));
  for (let partIndex = 0; partIndex < polygonIndices.length - 1; partIndex++) {
    writePolygon(
      writer,
      geometry,
      polygonIndices[partIndex],
      polygonIndices[partIndex + 1],
      options
    );
  }
}

function writePoint(
  writer: WKBWriter,
  geometry: BinaryPointGeometry,
  pointIndex: number,
  options: WKBOptions
) {
  writeHeader(writer, WKB_TYPE.Point, options);
  writeCoordinate(writer, geometry.positions.value, geometry.positions.size, pointIndex, options);
}

function writeLineString(
  writer: WKBWriter,
  geometry: BinaryLineGeometry,
  startPoint: number,
  endPoint: number,
  options: WKBOptions
) {
  writeHeader(writer, WKB_TYPE.LineString, options);
  writer.writeUInt32(endPoint - startPoint);
  for (let pointIndex = startPoint; pointIndex < endPoint; pointIndex++) {
    writeCoordinate(writer, geometry.positions.value, geometry.positions.size, pointIndex, options);
  }
}

function writePolygon(
  writer: WKBWriter,
  geometry: BinaryPolygonGeometry,
  startPoint: number,
  endPoint: number,
  options: WKBOptions
) {
  const ringIndices = geometry.primitivePolygonIndices.value.filter(
    ringIndex => ringIndex >= startPoint && ringIndex <= endPoint
  );
  writeHeader(writer, WKB_TYPE.Polygon, options);
  writer.writeUInt32(getPartCount(ringIndices));
  for (let ringIndex = 0; ringIndex < ringIndices.length - 1; ringIndex++) {
    const ringStart = ringIndices[ringIndex];
    const ringEnd = ringIndices[ringIndex + 1];
    writer.writeUInt32(ringEnd - ringStart);
    for (let pointIndex = ringStart; pointIndex < ringEnd; pointIndex++) {
      writeCoordinate(
        writer,
        geometry.positions.value,
        geometry.positions.size,
        pointIndex,
        options
      );
    }
  }
}

function writeHeader(writer: WKBWriter, geometryType: number, options: WKBOptions) {
  writer.writeUInt8(1);
  let dimensionType = 0;
  if (options.hasZ && options.hasM) {
    dimensionType = 3000;
  } else if (options.hasZ) {
    dimensionType = 1000;
  } else if (options.hasM) {
    dimensionType = 2000;
  }
  writer.writeUInt32(dimensionType + geometryType);
}

function writeCoordinate(
  writer: WKBWriter,
  positions: ArrayLike<number>,
  size: number,
  pointIndex: number,
  options: WKBOptions
) {
  const offset = pointIndex * size;
  const coordinate = Array.from({length: size}, (_, index) => Number(positions[offset + index]));
  writer.writeFloat64(coordinate[0]);
  writer.writeFloat64(coordinate[1]);
  if (options.hasZ) {
    writer.writeFloat64(coordinate[2]);
  }
  if (options.hasM) {
    writer.writeFloat64(coordinate[options.hasZ ? 3 : 2]);
  }
}

function reprojectWKBGeometry(
  dataView: DataView,
  byteOffset: number,
  transform: CoordinateTransform
): number {
  const littleEndian = dataView.getUint8(byteOffset) === 1;
  const typeCode = dataView.getUint32(byteOffset + 1, littleEndian);
  const {geometryType, coordinateSize} = parseWKBType(typeCode);
  let offset = byteOffset + getHeaderSize();

  switch (geometryType) {
    case WKB_TYPE.Point:
      reprojectWKBCoordinate(dataView, offset, littleEndian, transform);
      return offset + coordinateSize;
    case WKB_TYPE.LineString:
      return reprojectWKBLineString(dataView, offset, littleEndian, coordinateSize, transform);
    case WKB_TYPE.Polygon:
      return reprojectWKBPolygon(dataView, offset, littleEndian, coordinateSize, transform);
    case WKB_TYPE.MultiPoint:
    case WKB_TYPE.MultiLineString:
    case WKB_TYPE.MultiPolygon: {
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

function parseWKBType(typeCode: number): {geometryType: number; coordinateSize: number} {
  let geometryType = typeCode;
  let hasZ = false;
  let hasM = false;

  if (geometryType >= 3000) {
    hasZ = true;
    hasM = true;
    geometryType -= 3000;
  } else if (geometryType >= 2000) {
    hasM = true;
    geometryType -= 2000;
  } else if (geometryType >= 1000) {
    hasZ = true;
    geometryType -= 1000;
  }

  return {geometryType, coordinateSize: 16 + (hasZ ? 8 : 0) + (hasM ? 8 : 0)};
}

function getBinaryGeometryWKBSize(geometry: BinaryGeometry, options: WKBOptions): number {
  switch (geometry.type) {
    case 'Point':
      return getPointGeometrySize(geometry, options);
    case 'LineString':
      return getLineGeometrySize(geometry, options);
    case 'Polygon':
      return getPolygonGeometrySize(geometry, options);
  }
}

function getPointGeometrySize(geometry: BinaryPointGeometry, options: WKBOptions): number {
  const pointCount = getPointCount(geometry);
  if (pointCount === 1) {
    return getPointSize(options);
  }
  return getHeaderSize() + 4 + pointCount * getPointSize(options);
}

function getLineGeometrySize(geometry: BinaryLineGeometry, options: WKBOptions): number {
  const pathIndices = geometry.pathIndices.value;
  if (getPartCount(pathIndices) === 1) {
    return getLineStringSize(pathIndices[0], pathIndices[1], options);
  }
  let size = getHeaderSize() + 4;
  for (let partIndex = 0; partIndex < pathIndices.length - 1; partIndex++) {
    size += getLineStringSize(pathIndices[partIndex], pathIndices[partIndex + 1], options);
  }
  return size;
}

function getPolygonGeometrySize(geometry: BinaryPolygonGeometry, options: WKBOptions): number {
  const polygonIndices = geometry.polygonIndices.value;
  if (getPartCount(polygonIndices) === 1) {
    return getPolygonSize(geometry, polygonIndices[0], polygonIndices[1], options);
  }
  let size = getHeaderSize() + 4;
  for (let partIndex = 0; partIndex < polygonIndices.length - 1; partIndex++) {
    size += getPolygonSize(
      geometry,
      polygonIndices[partIndex],
      polygonIndices[partIndex + 1],
      options
    );
  }
  return size;
}

function getPointSize(options: WKBOptions): number {
  return getHeaderSize() + getCoordinateSize(options);
}

function getLineStringSize(startPoint: number, endPoint: number, options: WKBOptions): number {
  return getHeaderSize() + 4 + (endPoint - startPoint) * getCoordinateSize(options);
}

function getPolygonSize(
  geometry: BinaryPolygonGeometry,
  startPoint: number,
  endPoint: number,
  options: WKBOptions
): number {
  const ringIndices = geometry.primitivePolygonIndices.value.filter(
    ringIndex => ringIndex >= startPoint && ringIndex <= endPoint
  );
  let size = getHeaderSize() + 4;
  for (let ringIndex = 0; ringIndex < ringIndices.length - 1; ringIndex++) {
    size += 4 + (ringIndices[ringIndex + 1] - ringIndices[ringIndex]) * getCoordinateSize(options);
  }
  return size;
}

function getWKBOptions(size: number, header?: SHPHeader): WKBOptions {
  switch (header?.type) {
    case 11:
    case 13:
    case 15:
    case 18:
      return {hasZ: size > 2, hasM: size > 3};
    case 21:
    case 23:
    case 25:
    case 28:
      return {hasM: size > 2};
    default:
      return {hasZ: size > 2, hasM: size > 3};
  }
}

function getPointCount(geometry: BinaryPointGeometry): number {
  return geometry.positions.value.length / geometry.positions.size;
}

function getPartCount(indices: ArrayLike<number>): number {
  return Math.max(0, indices.length - 1);
}

function getHeaderSize(): number {
  return 1 + 4;
}

function getCoordinateSize(options: WKBOptions): number {
  return 16 + (options.hasZ ? 8 : 0) + (options.hasM ? 8 : 0);
}

class WKBWriter {
  arrayBuffer: ArrayBuffer;
  dataView: DataView;
  offset = 0;

  constructor(size: number) {
    this.arrayBuffer = new ArrayBuffer(size);
    this.dataView = new DataView(this.arrayBuffer);
  }

  writeUInt8(value: number) {
    this.dataView.setUint8(this.offset, value);
    this.offset += 1;
  }

  writeUInt32(value: number) {
    this.dataView.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  writeFloat64(value: number) {
    this.dataView.setFloat64(this.offset, value, true);
    this.offset += 8;
  }
}
