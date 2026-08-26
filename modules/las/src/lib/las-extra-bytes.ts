// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LASExtraBytesDescriptor} from './las-types';

/** Typed-array values supported for LAS Extra Bytes Arrow attributes. */
export type LASTypedExtraBytesValue =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array;

/** Prepared typed LAS Extra Bytes attribute and its source-record layout. */
export type LASTypedExtraBytesAttribute = {
  /** Stable Arrow attribute name. */
  name: string;
  /** Typed output values. */
  value: LASTypedExtraBytesValue;
  /** Number of components per point. */
  size: number;
  /** LAS scalar data type code. */
  scalarDataType: number;
  /** Byte offset within the packed Extra Bytes record. */
  byteOffset: number;
  /** Total source byte length per point. */
  byteLength: number;
  /** Per-component scales. */
  scales: number[];
  /** Per-component offsets. */
  offsets: number[];
  /** Whether transformed integer values require Float64 output. */
  outputFloat64: boolean;
};

/** Parse the 192-byte descriptors in an LAS Extra Bytes VLR payload. */
export function parseLASExtraBytes(data: Uint8Array): LASExtraBytesDescriptor[] {
  if (data.byteLength % 192 !== 0) {
    throw new Error(`LAS Extra Bytes VLR length ${data.byteLength} is not a multiple of 192`);
  }
  const descriptors: LASExtraBytesDescriptor[] = [];
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let descriptorOffset = 0; descriptorOffset < data.byteLength; descriptorOffset += 192) {
    const scales: [number, number, number] = [
      dataView.getFloat64(descriptorOffset + 112, true),
      dataView.getFloat64(descriptorOffset + 120, true),
      dataView.getFloat64(descriptorOffset + 128, true)
    ];
    const offsets: [number, number, number] = [
      dataView.getFloat64(descriptorOffset + 136, true),
      dataView.getFloat64(descriptorOffset + 144, true),
      dataView.getFloat64(descriptorOffset + 152, true)
    ];
    descriptors.push({
      dataType: data[descriptorOffset + 2],
      options: data[descriptorOffset + 3],
      name: readLASString(data, descriptorOffset + 4, 32),
      description: readLASString(data, descriptorOffset + 160, 32),
      scale: scales[0],
      offset: offsets[0],
      scales,
      offsets,
      data: data.slice(descriptorOffset, descriptorOffset + 192)
    });
  }
  return descriptors;
}

/** Allocate typed Arrow attributes described by an LAS Extra Bytes VLR. */
export function createLASTypedExtraBytesAttributes(
  pointCount: number,
  descriptors: readonly LASExtraBytesDescriptor[],
  extraByteCount: number
): LASTypedExtraBytesAttribute[] {
  let byteOffset = 0;
  const usedNames = new Set<string>();
  const attributes: LASTypedExtraBytesAttribute[] = [];
  for (let descriptorIndex = 0; descriptorIndex < descriptors.length; descriptorIndex++) {
    const descriptor = descriptors[descriptorIndex];
    const scalarDataType = getExtraBytesScalarDataType(descriptor.dataType);
    const size = getExtraBytesComponentCount(descriptor.dataType);
    const scalarByteLength = getExtraBytesScalarByteLength(scalarDataType);
    const byteLength = scalarByteLength * size;
    if (descriptor.dataType < 1 || descriptor.dataType > 30 || !byteLength) {
      throw new Error(`Unsupported typed LAS Extra Bytes data type ${descriptor.dataType}`);
    }
    if (scalarDataType === 7 || scalarDataType === 8) {
      throw new Error(
        `Typed LAS Extra Bytes data type ${descriptor.dataType} requires BigInt output`
      );
    }
    let name = `EXTRA_BYTES_${sanitizeExtraBytesName(descriptor.name)}`;
    if (name === 'EXTRA_BYTES_') {
      name = `EXTRA_BYTES_${descriptorIndex}`;
    }
    const baseName = name;
    let suffix = 1;
    while (usedNames.has(name)) {
      name = `${baseName}_${suffix++}`;
    }
    usedNames.add(name);
    const outputFloat64 = Boolean(descriptor.options & 0x18) && scalarDataType !== 10;
    attributes.push({
      name,
      value: createLASTypedExtraBytesValue(scalarDataType, pointCount * size, outputFloat64),
      size,
      scalarDataType,
      byteOffset,
      byteLength,
      outputFloat64,
      scales:
        descriptor.options & 0x08 ? descriptor.scales.slice(0, size) : new Array(size).fill(1),
      offsets:
        descriptor.options & 0x10 ? descriptor.offsets.slice(0, size) : new Array(size).fill(0)
    });
    byteOffset += byteLength;
  }
  if (byteOffset !== extraByteCount) {
    throw new Error(
      `LAS Extra Bytes descriptors use ${byteOffset} bytes; point records provide ${extraByteCount}`
    );
  }
  return attributes;
}

/** Populate typed attributes from packed Extra Bytes records. */
export function populateLASTypedExtraBytes(
  rawExtraBytes: Uint8Array,
  pointCount: number,
  extraByteCount: number,
  attributes: readonly LASTypedExtraBytesAttribute[]
): void {
  if (rawExtraBytes.byteLength < pointCount * extraByteCount) {
    throw new Error('Packed LAS Extra Bytes data is truncated');
  }
  const dataView = new DataView(
    rawExtraBytes.buffer,
    rawExtraBytes.byteOffset,
    rawExtraBytes.byteLength
  );
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const recordOffset = pointIndex * extraByteCount;
    for (const attribute of attributes) {
      const targetOffset = pointIndex * attribute.size;
      const sourceOffset = recordOffset + attribute.byteOffset;
      const scalarByteLength = getExtraBytesScalarByteLength(attribute.scalarDataType);
      for (let componentIndex = 0; componentIndex < attribute.size; componentIndex++) {
        attribute.value[targetOffset + componentIndex] =
          readExtraBytesValue(
            dataView,
            sourceOffset + componentIndex * scalarByteLength,
            attribute.scalarDataType
          ) *
            attribute.scales[componentIndex] +
          attribute.offsets[componentIndex];
      }
    }
  }
}

function readLASString(bytes: Uint8Array, offset: number, length: number): string {
  return new TextDecoder()
    .decode(bytes.subarray(offset, offset + length))
    .replace(/\0+$/, '')
    .trim();
}

function sanitizeExtraBytesName(name: string): string {
  return name.trim().replace(/[^A-Za-z0-9_]+/g, '_');
}

function getExtraBytesScalarDataType(dataType: number): number {
  return dataType > 20 ? dataType - 20 : dataType > 10 ? dataType - 10 : dataType;
}

function getExtraBytesComponentCount(dataType: number): number {
  return dataType > 20 ? 3 : dataType > 10 ? 2 : 1;
}

function getExtraBytesScalarByteLength(dataType: number): number {
  if (dataType <= 2) return 1;
  if (dataType <= 4) return 2;
  if (dataType <= 6 || dataType === 9) return 4;
  if (dataType === 7 || dataType === 8 || dataType === 10) return 8;
  return 0;
}

function readExtraBytesValue(dataView: DataView, offset: number, scalarDataType: number): number {
  switch (scalarDataType) {
    case 1:
      return dataView.getUint8(offset);
    case 2:
      return dataView.getInt8(offset);
    case 3:
      return dataView.getUint16(offset, true);
    case 4:
      return dataView.getInt16(offset, true);
    case 5:
      return dataView.getUint32(offset, true);
    case 6:
      return dataView.getInt32(offset, true);
    case 9:
      return dataView.getFloat32(offset, true);
    case 10:
      return dataView.getFloat64(offset, true);
    default:
      throw new Error(`Unsupported typed LAS Extra Bytes scalar data type ${scalarDataType}`);
  }
}

/** Allocate the typed-array representation for one LAS Extra Bytes scalar type. */
export function createLASTypedExtraBytesValue(
  scalarDataType: number,
  length: number,
  outputFloat64: boolean
): LASTypedExtraBytesValue {
  if (outputFloat64 && scalarDataType !== 10) return new Float64Array(length);
  switch (scalarDataType) {
    case 1:
      return new Uint8Array(length);
    case 2:
      return new Int8Array(length);
    case 3:
      return new Uint16Array(length);
    case 4:
      return new Int16Array(length);
    case 5:
      return new Uint32Array(length);
    case 6:
      return new Int32Array(length);
    case 9:
      return new Float32Array(length);
    case 10:
      return new Float64Array(length);
    default:
      throw new Error(`Unsupported typed LAS Extra Bytes scalar data type ${scalarDataType}`);
  }
}
