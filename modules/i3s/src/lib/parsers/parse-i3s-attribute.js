import {STRING_ATTRIBUTE_TYPE, OBJECT_ID_ATTRIBUTE_TYPE, FLOAT_64_TYPE} from './constants';

/**
 * Get particular tile and creates attribute object inside.
 * @param {ArrayBuffer} arrayBuffer
 * @param {Object} options
 * @returns {Promise<object>}
 */
export async function parseI3STileAttribute(arrayBuffer, options) {
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
 * @param {ArrayBuffer} arrayBuffer
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
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Uint32Array}
 */
function parseShortNumberAttribute(arrayBuffer) {
  const countOffset = 4;
  return new Uint32Array(arrayBuffer, countOffset);
}

/**
 * Parse float attribute.
 * Double Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Float64Array}
 */
function parseFloatAttribute(arrayBuffer) {
  const countOffset = 8;
  return new Float64Array(arrayBuffer, countOffset);
}

/**
 * Parse string attribute.
 * String spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param {ArrayBuffer} arrayBuffer
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
    const textDecoder = new TextDecoder('utf-8');
    const stringAttribute = new Uint8Array(arrayBuffer, stringOffset, stringByteSize);
    stringsArray.push(textDecoder.decode(stringAttribute));
    stringOffset += stringByteSize;
  }

  return stringsArray;
}
