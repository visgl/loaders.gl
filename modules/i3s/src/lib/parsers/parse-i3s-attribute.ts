// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@loaders.gl/schema';

import {
  STRING_ATTRIBUTE_TYPE,
  OBJECT_ID_ATTRIBUTE_TYPE,
  FLOAT_64_TYPE,
  INT_16_ATTRIBUTE_TYPE
} from './constants';

type Attribute = string[] | TypedArray | null;
export type I3STileAttributes = Record<string, Attribute>;

/**
 * Get particular tile and creates attribute object inside.
 * @param  arrayBuffer
 * @param {Object} options
 * @returns {Promise<object>}
 */
export function parseI3STileAttribute(arrayBuffer: ArrayBuffer, options): I3STileAttributes {
  const {attributeName, attributeType} = options;

  if (!attributeName) {
    return {};
  }
  return {
    [attributeName]: attributeType ? parseAttribute(attributeType, arrayBuffer) : null
  };
}

/**
 * Parse attributes based on attribute type.
 * @param {String} attributeType
 * @param  arrayBuffer
 * @returns
 */
function parseAttribute(attributeType, arrayBuffer: ArrayBuffer): Attribute {
  switch (attributeType) {
    case STRING_ATTRIBUTE_TYPE:
      return parseStringsAttribute(arrayBuffer);
    case OBJECT_ID_ATTRIBUTE_TYPE:
      return parseShortNumberAttribute(arrayBuffer);
    case FLOAT_64_TYPE:
    case 'Float32':
    case 'UInt8':
    case 'UInt16':
    case 'UInt32':
    case 'UInt64':
    case INT_16_ATTRIBUTE_TYPE:
    case 'Int32':
    case 'Int64':
      return parseNumericAttribute(attributeType, arrayBuffer);
    default:
      return parseShortNumberAttribute(arrayBuffer);
  }
}

/**
 * Parse a fixed-width numeric attribute using its declared I3S value type.
 * @param attributeType - I3S numeric value type
 * @param arrayBuffer - encoded attribute payload
 * @returns decoded numeric values
 */
function parseNumericAttribute(attributeType: string, arrayBuffer: ArrayBuffer): TypedArray {
  const valueOffset =
    attributeType === 'Float64' || attributeType === 'Int64' || attributeType === 'UInt64' ? 8 : 4;

  if (attributeType === 'UInt64' || attributeType === 'Int64') {
    return parseInt64Attribute(attributeType, arrayBuffer, valueOffset);
  }

  const TypedArrayType = getNumericAttributeConstructor(attributeType);
  const valueCount = Math.floor(
    (arrayBuffer.byteLength - valueOffset) / TypedArrayType.BYTES_PER_ELEMENT
  );
  return new TypedArrayType(arrayBuffer, valueOffset, valueCount);
}

/**
 * Resolve the JavaScript typed-array constructor for an I3S numeric value type.
 * @param attributeType - I3S numeric value type
 * @returns typed-array constructor
 */
function getNumericAttributeConstructor(
  attributeType: string
):
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor
  | Int16ArrayConstructor
  | Int32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor {
  switch (attributeType) {
    case 'UInt8':
      return Uint8Array;
    case 'UInt16':
      return Uint16Array;
    case 'UInt32':
      return Uint32Array;
    case 'Int16':
      return Int16Array;
    case 'Int32':
      return Int32Array;
    case 'Float32':
      return Float32Array;
    case 'Float64':
      return Float64Array;
    default:
      throw new Error(`Unsupported I3S numeric attribute type: ${attributeType}`);
  }
}

/**
 * Decode 64-bit integer attributes into numbers, preserving values within the safe integer range.
 * @param attributeType - I3S signedness
 * @param arrayBuffer - encoded attribute payload
 * @param valueOffset - byte offset of the values
 * @returns numeric values represented as Float64Array
 */
function parseInt64Attribute(
  attributeType: 'UInt64' | 'Int64',
  arrayBuffer: ArrayBuffer,
  valueOffset: number
): Float64Array {
  const valueCount = Math.floor((arrayBuffer.byteLength - valueOffset) / 8);
  const values = new Float64Array(valueCount);
  const dataView = new DataView(arrayBuffer, valueOffset);
  for (let index = 0; index < valueCount; index++) {
    const byteOffset = index * 8;
    const integerValue =
      attributeType === 'UInt64'
        ? dataView.getBigUint64(byteOffset, true)
        : dataView.getBigInt64(byteOffset, true);
    values[index] = Number(integerValue);
  }
  return values;
}

/**
 * Parse short number attribute.
 * Short Integer spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param  arrayBuffer
 * @returns
 */
function parseShortNumberAttribute(arrayBuffer: ArrayBuffer): Uint32Array {
  const countOffset = 4;
  return new Uint32Array(arrayBuffer, countOffset);
}

/**
 * Parse string attribute.
 * String spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param arrayBuffer
 * @returns list of strings
 */
function parseStringsAttribute(arrayBuffer: ArrayBuffer): string[] {
  const stringsCountOffset = 0;
  const dataOffset = 8;
  const bytesPerStringSize = 4;
  const stringsArray: string[] = [];

  try {
    // Use DataView to avoid multiple of 4 error on Uint32Array constructor
    const stringsCount = new DataView(
      arrayBuffer,
      stringsCountOffset,
      bytesPerStringSize
    ).getUint32(stringsCountOffset, true);
    const stringSizes = new Uint32Array(arrayBuffer, dataOffset, stringsCount);
    let stringOffset = dataOffset + stringsCount * bytesPerStringSize;

    for (const stringByteSize of stringSizes) {
      const textDecoder = new TextDecoder('utf-8');
      const stringAttribute = new Uint8Array(arrayBuffer, stringOffset, stringByteSize);
      stringsArray.push(textDecoder.decode(stringAttribute));
      stringOffset += stringByteSize;
    }
  } catch (error) {
    console.error('Parse string attribute error: ', (error as Error).message); // eslint-disable-line
  }

  return stringsArray;
}
