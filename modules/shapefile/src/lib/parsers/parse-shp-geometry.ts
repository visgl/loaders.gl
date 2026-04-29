// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryGeometry, BinaryGeometryType} from '@loaders.gl/schema';
import {WKBBuilder, convertWKBToBinaryGeometry} from '@loaders.gl/gis';
import {SHPLoaderOptions} from './types';

const LITTLE_ENDIAN = true;

/**
 * Parse individual record
 *
 * @param view Record data
 * @return Binary Geometry Object
 */
// eslint-disable-next-line complexity
export function parseRecord(view: DataView, options?: SHPLoaderOptions): BinaryGeometry | null {
  const wkb = parseRecordToWKB(view, options);
  return wkb ? convertWKBToBinaryGeometry(toArrayBuffer(wkb)) : null;
}

/**
 * Parses one SHP record directly into WKB bytes.
 *
 * @param view Record data.
 * @param options Loader options.
 * @return WKB geometry bytes, or null for Null Shape records.
 */
export function parseRecordToWKB(view: DataView, options?: SHPLoaderOptions): Uint8Array | null {
  const type = view.getInt32(0, LITTLE_ENDIAN);
  if (type === 0) {
    return null;
  }

  const measureBuilder = new WKBBuilder({
    mode: 'measure',
    ...getRecordWKBOptions(type, options)
  });
  writeRecordToWKB(measureBuilder, view, type);
  const wkb = new Uint8Array(measureBuilder.finishGeometry());
  const writeBuilder = new WKBBuilder({
    mode: 'write',
    target: wkb,
    ...getRecordWKBOptions(type, options)
  });
  writeRecordToWKB(writeBuilder, view, type);
  writeBuilder.finishGeometry();
  return wkb;
}

function writeRecordToWKB(builder: WKBBuilder, view: DataView, type: number): void {
  const offset = Int32Array.BYTES_PER_ELEMENT;
  switch (type) {
    case 1:
    case 11:
    case 21:
      writePointRecordToWKB(builder, view, offset);
      return;
    case 3:
    case 13:
    case 23:
      writePolyRecordToWKB(builder, view, offset, 'LineString', type);
      return;
    case 5:
    case 15:
    case 25:
      writePolyRecordToWKB(builder, view, offset, 'Polygon', type);
      return;
    case 8:
    case 18:
    case 28:
      writeMultiPointRecordToWKB(builder, view, offset, type);
      return;
    default:
      throw new Error(`unsupported shape type: ${type}`);
  }
}

function writePointRecordToWKB(builder: WKBBuilder, view: DataView, offset: number): void {
  builder.beginPoint();
  const x = view.getFloat64(offset, LITTLE_ENDIAN);
  const y = view.getFloat64(offset + 8, LITTLE_ENDIAN);
  const zOffset = offset + 16;
  const mOffset = offset + (builder.hasZ ? 24 : 16);
  const z =
    builder.hasZ && zOffset + Float64Array.BYTES_PER_ELEMENT <= view.byteLength
      ? view.getFloat64(zOffset, LITTLE_ENDIAN)
      : undefined;
  const m =
    builder.hasM && mOffset + Float64Array.BYTES_PER_ELEMENT <= view.byteLength
      ? view.getFloat64(mOffset, LITTLE_ENDIAN)
      : undefined;
  builder.writeCoordinate(x, y, z, m);
}

function writeMultiPointRecordToWKB(
  builder: WKBBuilder,
  view: DataView,
  offset: number,
  type: number
): void {
  const layout = getMultiPointRecordLayout(view, offset, type);

  if (layout.pointCount === 1) {
    builder.beginPoint();
    writeRecordCoordinate(builder, view, layout, 0);
    return;
  }

  builder.beginMultiPoint(layout.pointCount);
  for (let pointIndex = 0; pointIndex < layout.pointCount; pointIndex++) {
    builder.beginPoint();
    writeRecordCoordinate(builder, view, layout, pointIndex);
  }
}

function writePolyRecordToWKB(
  builder: WKBBuilder,
  view: DataView,
  offset: number,
  geometryType: BinaryGeometryType,
  type: number
): void {
  const layout = getPolyRecordLayout(view, offset, type);
  if (geometryType === 'LineString') {
    writeLineRecordToWKB(builder, view, layout);
    return;
  }
  writePolygonRecordToWKB(builder, view, layout);
}

function writeLineRecordToWKB(builder: WKBBuilder, view: DataView, layout: SHPPolyRecordLayout) {
  if (layout.partCount === 1) {
    writeLinePartToWKB(builder, view, layout, 0);
    return;
  }

  builder.beginMultiLineString(layout.partCount);
  for (let partIndex = 0; partIndex < layout.partCount; partIndex++) {
    writeLinePartToWKB(builder, view, layout, partIndex);
  }
}

function writeLinePartToWKB(
  builder: WKBBuilder,
  view: DataView,
  layout: SHPPolyRecordLayout,
  partIndex: number
) {
  const startPoint = getPartStart(view, layout, partIndex);
  const endPoint = getPartEnd(view, layout, partIndex);
  builder.beginLineString(endPoint - startPoint);
  for (let pointIndex = startPoint; pointIndex < endPoint; pointIndex++) {
    writeRecordCoordinate(builder, view, layout, pointIndex);
  }
}

function writePolygonRecordToWKB(builder: WKBBuilder, view: DataView, layout: SHPPolyRecordLayout) {
  const exteriorPartIndices = getExteriorPartIndices(view, layout);
  if (exteriorPartIndices.length <= 1) {
    writePolygonPartsToWKB(builder, view, layout, 0, layout.partCount);
    return;
  }

  builder.beginMultiPolygon(exteriorPartIndices.length);
  for (let polygonIndex = 0; polygonIndex < exteriorPartIndices.length; polygonIndex++) {
    const startPartIndex = exteriorPartIndices[polygonIndex];
    const endPartIndex = exteriorPartIndices[polygonIndex + 1] ?? layout.partCount;
    writePolygonPartsToWKB(builder, view, layout, startPartIndex, endPartIndex);
  }
}

function writePolygonPartsToWKB(
  builder: WKBBuilder,
  view: DataView,
  layout: SHPPolyRecordLayout,
  startPartIndex: number,
  endPartIndex: number
) {
  builder.beginPolygon(endPartIndex - startPartIndex);
  for (let partIndex = startPartIndex; partIndex < endPartIndex; partIndex++) {
    const startPoint = getPartStart(view, layout, partIndex);
    const endPoint = getPartEnd(view, layout, partIndex);
    builder.beginLinearRing(endPoint - startPoint);
    for (let pointIndex = startPoint; pointIndex < endPoint; pointIndex++) {
      writeRecordCoordinate(builder, view, layout, pointIndex);
    }
  }
}

type SHPPointRecordLayout = {
  pointCount: number;
  xyOffset: number;
  zOffset?: number;
  mOffset?: number;
};

type SHPPolyRecordLayout = SHPPointRecordLayout & {
  partCount: number;
  partsOffset: number;
};

function getMultiPointRecordLayout(
  view: DataView,
  offset: number,
  type: number
): SHPPointRecordLayout {
  offset += 4 * Float64Array.BYTES_PER_ELEMENT;
  const pointCount = view.getInt32(offset, LITTLE_ENDIAN);
  const xyOffset = offset + Int32Array.BYTES_PER_ELEMENT;
  return getCoordinateLayout(view, xyOffset, pointCount, type);
}

function getPolyRecordLayout(view: DataView, offset: number, type: number): SHPPolyRecordLayout {
  offset += 4 * Float64Array.BYTES_PER_ELEMENT;
  const partCount = view.getInt32(offset, LITTLE_ENDIAN);
  const pointCount = view.getInt32(offset + Int32Array.BYTES_PER_ELEMENT, LITTLE_ENDIAN);
  const partsOffset = offset + 2 * Int32Array.BYTES_PER_ELEMENT;
  const xyOffset = partsOffset + partCount * Int32Array.BYTES_PER_ELEMENT;
  return {
    ...getCoordinateLayout(view, xyOffset, pointCount, type),
    partCount,
    partsOffset
  };
}

function getCoordinateLayout(
  view: DataView,
  xyOffset: number,
  pointCount: number,
  type: number
): SHPPointRecordLayout {
  const afterXYOffset = xyOffset + pointCount * 2 * Float64Array.BYTES_PER_ELEMENT;
  let zOffset: number | undefined;
  let mOffset: number | undefined;

  if (isZShapeType(type)) {
    zOffset = afterXYOffset + 2 * Float64Array.BYTES_PER_ELEMENT;
    const afterZOffset = zOffset + pointCount * Float64Array.BYTES_PER_ELEMENT;
    mOffset =
      afterZOffset + 2 * Float64Array.BYTES_PER_ELEMENT <= view.byteLength
        ? afterZOffset + 2 * Float64Array.BYTES_PER_ELEMENT
        : undefined;
  } else if (isMShapeType(type)) {
    mOffset =
      afterXYOffset + 2 * Float64Array.BYTES_PER_ELEMENT <= view.byteLength
        ? afterXYOffset + 2 * Float64Array.BYTES_PER_ELEMENT
        : undefined;
  }

  return {pointCount, xyOffset, zOffset, mOffset};
}

function writeRecordCoordinate(
  builder: WKBBuilder,
  view: DataView,
  layout: SHPPointRecordLayout,
  pointIndex: number
) {
  const xyOffset = layout.xyOffset + pointIndex * 2 * Float64Array.BYTES_PER_ELEMENT;
  const x = view.getFloat64(xyOffset, LITTLE_ENDIAN);
  const y = view.getFloat64(xyOffset + Float64Array.BYTES_PER_ELEMENT, LITTLE_ENDIAN);
  const z =
    builder.hasZ && layout.zOffset !== undefined
      ? view.getFloat64(layout.zOffset + pointIndex * Float64Array.BYTES_PER_ELEMENT, LITTLE_ENDIAN)
      : undefined;
  const m =
    builder.hasM && layout.mOffset !== undefined
      ? view.getFloat64(layout.mOffset + pointIndex * Float64Array.BYTES_PER_ELEMENT, LITTLE_ENDIAN)
      : undefined;
  builder.writeCoordinate(x, y, z, m);
}

function getPartStart(view: DataView, layout: SHPPolyRecordLayout, partIndex: number): number {
  return view.getInt32(
    layout.partsOffset + partIndex * Int32Array.BYTES_PER_ELEMENT,
    LITTLE_ENDIAN
  );
}

function getPartEnd(view: DataView, layout: SHPPolyRecordLayout, partIndex: number): number {
  return partIndex + 1 < layout.partCount
    ? getPartStart(view, layout, partIndex + 1)
    : layout.pointCount;
}

function getExteriorPartIndices(view: DataView, layout: SHPPolyRecordLayout): number[] {
  const exteriorPartIndices: number[] = [];
  for (let partIndex = 0; partIndex < layout.partCount; partIndex++) {
    const startPoint = getPartStart(view, layout, partIndex);
    const endPoint = getPartEnd(view, layout, partIndex);
    if (getWindingDirectionFromRecord(view, layout, startPoint, endPoint) > 0) {
      exteriorPartIndices.push(partIndex);
    }
  }
  return exteriorPartIndices;
}

function getWindingDirectionFromRecord(
  view: DataView,
  layout: SHPPointRecordLayout,
  startPoint: number,
  endPoint: number
): number {
  let area = 0;
  for (let pointIndex = startPoint; pointIndex < endPoint - 1; pointIndex++) {
    const currentOffset = layout.xyOffset + pointIndex * 2 * Float64Array.BYTES_PER_ELEMENT;
    const nextOffset = layout.xyOffset + (pointIndex + 1) * 2 * Float64Array.BYTES_PER_ELEMENT;
    area +=
      (view.getFloat64(currentOffset, LITTLE_ENDIAN) + view.getFloat64(nextOffset, LITTLE_ENDIAN)) *
      (view.getFloat64(currentOffset + Float64Array.BYTES_PER_ELEMENT, LITTLE_ENDIAN) -
        view.getFloat64(nextOffset + Float64Array.BYTES_PER_ELEMENT, LITTLE_ENDIAN));
  }
  return Math.sign(area / 2);
}

function getRecordWKBOptions(type: number, options?: SHPLoaderOptions) {
  const {_maxDimensions = 4} = options?.shp || {};
  switch (type) {
    case 11:
    case 13:
    case 15:
    case 18:
      return {
        hasZ: Math.min(4, _maxDimensions) > 2,
        hasM: Math.min(4, _maxDimensions) > 3
      };
    case 21:
    case 23:
    case 25:
    case 28:
      return {hasM: Math.min(3, _maxDimensions) > 2};
    default:
      return {};
  }
}

function isZShapeType(type: number): boolean {
  return type === 11 || type === 13 || type === 15 || type === 18;
}

function isMShapeType(type: number): boolean {
  return type === 21 || type === 23 || type === 25 || type === 28;
}

function toArrayBuffer(wkb: Uint8Array): ArrayBuffer {
  return wkb.buffer.slice(wkb.byteOffset, wkb.byteOffset + wkb.byteLength) as ArrayBuffer;
}
