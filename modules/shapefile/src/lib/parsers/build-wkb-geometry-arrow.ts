// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, Schema as TableSchema} from '@loaders.gl/schema';
import {convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {type CoordinateTransform, WKBBuilder, reprojectWKBInPlace} from '@loaders.gl/gis';
import type {SHPLoaderOptions} from './types';
import {getRecordWKBOptions, writeRecordToWKB} from './parse-shp-geometry';

export type SHPWKBGeometry = Uint8Array;

const BIG_ENDIAN = false;
const LITTLE_ENDIAN = true;
const SHP_HEADER_SIZE = 100;
const RECORD_HEADER_SIZE = 8;
const WKB_HEADER_SIZE = 5;
const WKB_COUNT_SIZE = 4;
const WKB_POINT = 1;
const WKB_LINESTRING = 2;
const WKB_MULTIPOINT = 4;
const WKB_MULTILINESTRING = 5;

/** Creates an Arrow table containing one WKB geometry column. */
export function makeWKBGeometryArrowTable(
  geometries: (SHPWKBGeometry | null | undefined)[],
  schema: TableSchema,
  transform?: CoordinateTransform
): ArrowTable {
  const arrowSchema = convertSchemaToArrow(schema);
  const geometryData = makeWKBGeometryData(geometries, transform);
  const structField = new arrow.Struct(arrowSchema.fields);
  const structData = new arrow.Data(structField, 0, geometries.length, 0, undefined, [
    geometryData
  ]);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, [recordBatch])
  };
}

/** Creates an Arrow table by writing SHP records directly into one WKB values buffer. */
export function makeSHPWKBGeometryArrowTable(
  arrayBuffer: ArrayBuffer,
  schema: TableSchema,
  options?: SHPLoaderOptions,
  transform?: CoordinateTransform
): ArrowTable {
  const arrowSchema = convertSchemaToArrow(schema);
  const geometryData = makeSHPWKBGeometryData(arrayBuffer, options, transform);
  const structField = new arrow.Struct(arrowSchema.fields);
  const structData = new arrow.Data(structField, 0, geometryData.length, 0, undefined, [
    geometryData
  ]);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, [recordBatch])
  };
}

/** Creates Arrow Binary buffers by writing SHP records directly as WKB. */
export function makeSHPWKBGeometryData(
  arrayBuffer: ArrayBuffer,
  options?: SHPLoaderOptions,
  transform?: CoordinateTransform
): arrow.Data<arrow.Binary> {
  const {valueOffsets, nullCount} = measureSHPWKBGeometryOffsets(arrayBuffer, options);
  const values = new Uint8Array(valueOffsets[valueOffsets.length - 1]);
  const nullBitmap = writeSHPWKBGeometryValues(
    arrayBuffer,
    valueOffsets,
    values,
    options,
    transform
  );

  return new arrow.Data(new arrow.Binary(), 0, valueOffsets.length - 1, nullCount, [
    valueOffsets,
    values,
    nullCount > 0 ? nullBitmap : undefined
  ]);
}

/** Creates Arrow Binary buffers containing WKB geometries. */
export function makeWKBGeometryData(
  geometries: (SHPWKBGeometry | null | undefined)[],
  transform?: CoordinateTransform
): arrow.Data<arrow.Binary> {
  const valueOffsets = measureWKBGeometryOffsets(geometries);
  const values = new Uint8Array(valueOffsets[valueOffsets.length - 1]);
  const {nullBitmap, nullCount} = writeWKBGeometryValues(
    geometries,
    valueOffsets,
    values,
    transform
  );

  return new arrow.Data(new arrow.Binary(), 0, geometries.length, nullCount, [
    valueOffsets,
    values,
    nullCount > 0 ? nullBitmap : undefined
  ]);
}

function measureWKBGeometryOffsets(geometries: (SHPWKBGeometry | null | undefined)[]): Int32Array {
  const valueOffsets = new Int32Array(geometries.length + 1);
  for (let geometryIndex = 0; geometryIndex < geometries.length; geometryIndex++) {
    const geometry = geometries[geometryIndex];
    if (!geometry) {
      valueOffsets[geometryIndex + 1] = valueOffsets[geometryIndex];
      continue;
    }

    valueOffsets[geometryIndex + 1] = valueOffsets[geometryIndex] + geometry.byteLength;
  }
  return valueOffsets;
}

function writeWKBGeometryValues(
  geometries: (SHPWKBGeometry | null | undefined)[],
  valueOffsets: Int32Array,
  values: Uint8Array,
  transform?: CoordinateTransform
): {nullBitmap: Uint8Array; nullCount: number} {
  const nullBitmap = new Uint8Array(Math.ceil(geometries.length / 8));
  let nullCount = 0;

  for (let geometryIndex = 0; geometryIndex < geometries.length; geometryIndex++) {
    const geometry = geometries[geometryIndex];
    if (!geometry) {
      nullCount++;
      continue;
    }

    nullBitmap[geometryIndex >> 3] |= 1 << (geometryIndex & 7);
    const startOffset = valueOffsets[geometryIndex];
    const endOffset = valueOffsets[geometryIndex + 1];
    values.set(geometry, startOffset);
    if (transform) {
      reprojectWKBInPlace(values.subarray(startOffset, endOffset), transform);
    }
  }

  return {nullBitmap, nullCount};
}

function measureSHPWKBGeometryOffsets(
  arrayBuffer: ArrayBuffer,
  options?: SHPLoaderOptions
): {valueOffsets: Int32Array; nullCount: number} {
  const valueOffsets: number[] = [0];
  let nullCount = 0;

  scanSHPRecords(arrayBuffer, recordView => {
    const recordType = recordView.getInt32(0, LITTLE_ENDIAN);
    const previousOffset = valueOffsets[valueOffsets.length - 1];
    if (recordType === 0) {
      nullCount++;
      valueOffsets.push(previousOffset);
      return;
    }

    valueOffsets.push(previousOffset + measureRecordWKBByteLength(recordView, recordType, options));
  });

  return {valueOffsets: Int32Array.from(valueOffsets), nullCount};
}

function writeSHPWKBGeometryValues(
  arrayBuffer: ArrayBuffer,
  valueOffsets: Int32Array,
  values: Uint8Array,
  options?: SHPLoaderOptions,
  transform?: CoordinateTransform
): Uint8Array {
  const nullBitmap = new Uint8Array(Math.ceil((valueOffsets.length - 1) / 8));
  let geometryIndex = 0;

  scanSHPRecords(arrayBuffer, recordView => {
    const recordType = recordView.getInt32(0, LITTLE_ENDIAN);
    if (recordType !== 0) {
      nullBitmap[geometryIndex >> 3] |= 1 << (geometryIndex & 7);
      writeRecordWKBValues(
        recordView,
        recordType,
        values,
        valueOffsets[geometryIndex],
        options,
        transform
      );
    }
    geometryIndex++;
  });

  return nullBitmap;
}

function measureRecordWKBByteLength(
  recordView: DataView,
  recordType: number,
  options?: SHPLoaderOptions
): number {
  if (canWriteRecordFast(recordType, options)) {
    switch (recordType) {
      case 1:
        return WKB_HEADER_SIZE + 2 * Float64Array.BYTES_PER_ELEMENT;
      case 3:
        return measureLineRecordWKBByteLength(recordView);
      case 8:
        return measureMultiPointRecordWKBByteLength(recordView);
      default:
        break;
    }
  }

  const builder = new WKBBuilder({
    mode: 'measure',
    ...getRecordWKBOptions(recordType, options)
  });
  writeRecordToWKB(builder, recordView, recordType);
  return builder.finishGeometry();
}

function writeRecordWKBValues(
  recordView: DataView,
  recordType: number,
  values: Uint8Array,
  byteOffset: number,
  options?: SHPLoaderOptions,
  transform?: CoordinateTransform
): void {
  if (!transform && canWriteRecordFast(recordType, options)) {
    switch (recordType) {
      case 1:
        writePointRecordWKBValues(recordView, values, byteOffset);
        return;
      case 3:
        writeLineRecordWKBValues(recordView, values, byteOffset);
        return;
      case 8:
        writeMultiPointRecordWKBValues(recordView, values, byteOffset);
        return;
      default:
        break;
    }
  }

  const builder = new WKBBuilder({
    mode: 'write',
    target: values,
    byteOffset,
    transform,
    ...getRecordWKBOptions(recordType, options)
  });
  writeRecordToWKB(builder, recordView, recordType);
  builder.finishGeometry();
}

function measureLineRecordWKBByteLength(recordView: DataView): number {
  const partCount = recordView.getInt32(36, LITTLE_ENDIAN);
  const pointCount = recordView.getInt32(40, LITTLE_ENDIAN);
  const coordinateByteLength = pointCount * 2 * Float64Array.BYTES_PER_ELEMENT;
  if (partCount === 1) {
    return WKB_HEADER_SIZE + WKB_COUNT_SIZE + coordinateByteLength;
  }
  return (
    WKB_HEADER_SIZE +
    WKB_COUNT_SIZE +
    partCount * (WKB_HEADER_SIZE + WKB_COUNT_SIZE) +
    coordinateByteLength
  );
}

function measureMultiPointRecordWKBByteLength(recordView: DataView): number {
  const pointCount = recordView.getInt32(36, LITTLE_ENDIAN);
  const coordinateByteLength = pointCount * 2 * Float64Array.BYTES_PER_ELEMENT;
  if (pointCount === 1) {
    return WKB_HEADER_SIZE + coordinateByteLength;
  }
  return WKB_HEADER_SIZE + WKB_COUNT_SIZE + pointCount * WKB_HEADER_SIZE + coordinateByteLength;
}

function writePointRecordWKBValues(
  recordView: DataView,
  values: Uint8Array,
  byteOffset: number
): void {
  const dataView = new DataView(values.buffer, values.byteOffset, values.byteLength);
  writeWKBHeader(dataView, byteOffset, WKB_POINT);
  copyRecordBytes(recordView, 4, values, byteOffset + WKB_HEADER_SIZE, 16);
}

function writeLineRecordWKBValues(
  recordView: DataView,
  values: Uint8Array,
  byteOffset: number
): void {
  const dataView = new DataView(values.buffer, values.byteOffset, values.byteLength);
  const partCount = recordView.getInt32(36, LITTLE_ENDIAN);
  const pointCount = recordView.getInt32(40, LITTLE_ENDIAN);
  const partsOffset = 44;
  const xyOffset = partsOffset + partCount * Int32Array.BYTES_PER_ELEMENT;

  if (partCount === 1) {
    writeWKBHeader(dataView, byteOffset, WKB_LINESTRING);
    dataView.setUint32(byteOffset + WKB_HEADER_SIZE, pointCount, LITTLE_ENDIAN);
    copyRecordBytes(
      recordView,
      xyOffset,
      values,
      byteOffset + WKB_HEADER_SIZE + WKB_COUNT_SIZE,
      pointCount * 2 * Float64Array.BYTES_PER_ELEMENT
    );
    return;
  }

  writeWKBHeader(dataView, byteOffset, WKB_MULTILINESTRING);
  dataView.setUint32(byteOffset + WKB_HEADER_SIZE, partCount, LITTLE_ENDIAN);
  let targetOffset = byteOffset + WKB_HEADER_SIZE + WKB_COUNT_SIZE;
  for (let partIndex = 0; partIndex < partCount; partIndex++) {
    const startPoint = recordView.getInt32(
      partsOffset + partIndex * Int32Array.BYTES_PER_ELEMENT,
      LITTLE_ENDIAN
    );
    const endPoint =
      partIndex + 1 < partCount
        ? recordView.getInt32(
            partsOffset + (partIndex + 1) * Int32Array.BYTES_PER_ELEMENT,
            LITTLE_ENDIAN
          )
        : pointCount;
    const partPointCount = endPoint - startPoint;
    writeWKBHeader(dataView, targetOffset, WKB_LINESTRING);
    dataView.setUint32(targetOffset + WKB_HEADER_SIZE, partPointCount, LITTLE_ENDIAN);
    targetOffset += WKB_HEADER_SIZE + WKB_COUNT_SIZE;
    const byteLength = partPointCount * 2 * Float64Array.BYTES_PER_ELEMENT;
    copyRecordBytes(
      recordView,
      xyOffset + startPoint * 2 * Float64Array.BYTES_PER_ELEMENT,
      values,
      targetOffset,
      byteLength
    );
    targetOffset += byteLength;
  }
}

function writeMultiPointRecordWKBValues(
  recordView: DataView,
  values: Uint8Array,
  byteOffset: number
): void {
  const dataView = new DataView(values.buffer, values.byteOffset, values.byteLength);
  const pointCount = recordView.getInt32(36, LITTLE_ENDIAN);
  const xyOffset = 40;
  if (pointCount === 1) {
    writeWKBHeader(dataView, byteOffset, WKB_POINT);
    copyRecordBytes(recordView, xyOffset, values, byteOffset + WKB_HEADER_SIZE, 16);
    return;
  }

  writeWKBHeader(dataView, byteOffset, WKB_MULTIPOINT);
  dataView.setUint32(byteOffset + WKB_HEADER_SIZE, pointCount, LITTLE_ENDIAN);
  let targetOffset = byteOffset + WKB_HEADER_SIZE + WKB_COUNT_SIZE;
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    writeWKBHeader(dataView, targetOffset, WKB_POINT);
    targetOffset += WKB_HEADER_SIZE;
    copyRecordBytes(
      recordView,
      xyOffset + pointIndex * 2 * Float64Array.BYTES_PER_ELEMENT,
      values,
      targetOffset,
      2 * Float64Array.BYTES_PER_ELEMENT
    );
    targetOffset += 2 * Float64Array.BYTES_PER_ELEMENT;
  }
}

function writeWKBHeader(dataView: DataView, byteOffset: number, geometryType: number): void {
  dataView.setUint8(byteOffset, 1);
  dataView.setUint32(byteOffset + 1, geometryType, LITTLE_ENDIAN);
}

function copyRecordBytes(
  recordView: DataView,
  recordByteOffset: number,
  values: Uint8Array,
  valueByteOffset: number,
  byteLength: number
): void {
  values.set(
    new Uint8Array(recordView.buffer, recordView.byteOffset + recordByteOffset, byteLength),
    valueByteOffset
  );
}

function canWriteRecordFast(recordType: number, options?: SHPLoaderOptions): boolean {
  const wkbOptions = getRecordWKBOptions(recordType, options);
  return (
    (recordType === 1 || recordType === 3 || recordType === 8) &&
    !wkbOptions.hasZ &&
    !wkbOptions.hasM
  );
}

function scanSHPRecords(arrayBuffer: ArrayBuffer, visitRecord: (recordView: DataView) => void) {
  let offset = SHP_HEADER_SIZE;
  while (offset + RECORD_HEADER_SIZE <= arrayBuffer.byteLength) {
    const recordHeaderView = new DataView(arrayBuffer, offset, RECORD_HEADER_SIZE);
    const byteLength = recordHeaderView.getInt32(4, BIG_ENDIAN) * 2;
    offset += RECORD_HEADER_SIZE;
    if (byteLength <= 0 || offset + byteLength > arrayBuffer.byteLength) {
      break;
    }
    visitRecord(new DataView(arrayBuffer, offset, byteLength));
    offset += byteLength;
  }
}
