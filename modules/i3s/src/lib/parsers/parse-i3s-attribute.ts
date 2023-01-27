// loaders.gl, MIT license

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
      return parseFloatAttribute(arrayBuffer);
    case INT_16_ATTRIBUTE_TYPE:
      return parseInt16ShortNumberAttribute(arrayBuffer);
    default:
      return parseShortNumberAttribute(arrayBuffer);
  }
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
 * Parse Int16 short number attribute.
 * Parsing of such data is not documented. Added to handle Building Scene Layer Tileset attributes data.
 * @param  arrayBuffer
 * @returns
 */
function parseInt16ShortNumberAttribute(arrayBuffer: ArrayBuffer): Int16Array {
  const countOffset = 4;
  return new Int16Array(arrayBuffer, countOffset);
}

/**
 * Parse float attribute.
 * Double Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param  arrayBuffer
 * @returns
 */
function parseFloatAttribute(arrayBuffer: ArrayBuffer): Float64Array {
  const countOffset = 8;
  return new Float64Array(arrayBuffer, countOffset);
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
