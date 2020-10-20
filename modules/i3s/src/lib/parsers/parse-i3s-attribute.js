/* global Buffer */
import {STRING_ATTRIBUTE_TYPE, OBJECT_ID_ATTRIBUTE_TYPE, FLOAT_64_TYPE} from './constants';
/**
 * Get particular tile and creates attribute object inside.
 * @param arrayBuffer
 * @param options
 * @returns {Promise<object>}
 */
export async function parseI3STileAttribute(arrayBuffer, options) {
  const {attributeName, attributeType} = options;
  return {
    [attributeName]: parseAttribute(attributeType, arrayBuffer)
  };
}
/**
 * Parse attributes based on attribute type.
 * @param attributeType
 * @param arrayBuffer
 * @returns {any}
 */
function parseAttribute(attributeType, arrayBuffer) {
  switch (attributeType) {
    case STRING_ATTRIBUTE_TYPE:
      return parseStringsAttribute(arrayBuffer);
    case OBJECT_ID_ATTRIBUTE_TYPE:
      return parseShortNumberAttribute(arrayBuffer);
    case FLOAT_64_TYPE:
      return parseFloatAttribute(arrayBuffer);
    default:
      return parseShortNumberAttribute(arrayBuffer);
  }
}
/**
 * Parse short number attribute.
 * Short Integer spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param arrayBuffer
 * @returns {Uint32Array}
 */
function parseShortNumberAttribute(arrayBuffer) {
  const countOffset = 4;
  const attributes = new Uint32Array(arrayBuffer, countOffset);
  return attributes;
}
/**
 * Parse float attribute.
 * Double Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param arrayBuffer
 * @returns {Float64Array}
 */
function parseFloatAttribute(arrayBuffer) {
  const countOffset = 8;
  const arrtibutes = new Float64Array(arrayBuffer, countOffset);
  return arrtibutes;
}
/**
 * Parse string attribute.
 * String spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param arrayBuffer
 * @returns {Array}
 */
function parseStringsAttribute(arrayBuffer) {
  const dataOffset = 8;
  const bytesPerStringSize = 4;
  const stringsCount = new Uint32Array(arrayBuffer, 0, bytesPerStringSize)[0];
  const stringSizes = new Uint32Array(arrayBuffer, dataOffset, stringsCount);

  const stringsArray = [];
  let stringOffset = dataOffset + stringsCount * bytesPerStringSize;

  for (const stringByteSize of stringSizes) {
    const stringAttribute = Buffer.from(arrayBuffer, stringOffset, stringByteSize).toString();
    stringsArray.push(stringAttribute);
    stringOffset += stringByteSize;
  }

  return stringsArray;
}
