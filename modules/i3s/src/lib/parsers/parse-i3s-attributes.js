/* global Buffer */
import {fetchFile} from '@loaders.gl/core';
import {STRING_ATTRIBUTE_TYPE, OBJECT_ID_ATTRIBUTE_TYPE, FLOAT_64_TYPE} from './constants';
/**
 * Get particular tile and creates attribute object inside.
 * @param tile
 * @param attributeStorageInfo
 * @returns {Promise<object>}
 */
export async function parseI3STileAttributes(tile, attributeStorageInfo) {
  if (!tile.attributeUrls || !attributeStorageInfo) {
    return tile;
  }

  const filesWithAttributes = await getAttributeFiles(tile.attributeUrls);
  const arrayBuffers = await getAttributeArrayBuffers(filesWithAttributes);

  tile.attributes = getTileAttributes(arrayBuffers, attributeStorageInfo);
  return tile;
}
/**
 * Get attribute files from attribute URLs.
 * @param attributeUrls
 * @returns {Promise<Array>}
 */
async function getAttributeFiles(attributeUrls) {
  const promises = [];
  for (let index = 0; index < attributeUrls.length; index++) {
    promises.push(fetchFile(attributeUrls[index]));
  }
  return await Promise.all(promises);
}
/**
 * Get attribute array buffers from attribute files.
 * @param attributeFiles
 * @returns {Promise<Array>}
 */
async function getAttributeArrayBuffers(attributeFiles) {
  const promises = [];
  for (let index = 0; index < attributeFiles.length; index++) {
    promises.push(attributeFiles[index].arrayBuffer());
  }
  return await Promise.all(promises);
}
/**
 * Get attributes from array buffers.
 * @param arrayBuffers
 * @param attributeStorageInfo
 * @returns {object}
 */
function getTileAttributes(arrayBuffers, attributeStorageInfo) {
  const attributes = {};

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const attributeName = attributeStorageInfo[index].name;
    const attributeType = attributeStorageInfo[index].attributeValues.valueType;
    attributes[attributeName] = parseAttributes(attributeType, arrayBuffers[index]);
  }

  return attributes;
}
/**
 * Parse attributes based on attribute type.
 * @param attributeType
 * @param arrayBuffer
 * @returns {any}
 */
function parseAttributes(attributeType, arrayBuffer) {
  switch (attributeType) {
    case STRING_ATTRIBUTE_TYPE:
      return parseStringsAttributes(arrayBuffer);
    case OBJECT_ID_ATTRIBUTE_TYPE:
      return parseShortNumberAttributes(arrayBuffer);
    case FLOAT_64_TYPE:
      return parseFloatAttributes(arrayBuffer);
    default:
      return parseShortNumberAttributes(arrayBuffer);
  }
}
/**
 * Parse short number attributes.
 * Short Integer spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param arrayBuffer
 * @returns {Uint32Array}
 */
function parseShortNumberAttributes(arrayBuffer) {
  const countOffset = 4;
  const attributes = new Uint32Array(arrayBuffer, countOffset);
  return attributes;
}
/**
 * Parse float attributes.
 * Double Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param arrayBuffer
 * @returns {Float64Array}
 */
function parseFloatAttributes(arrayBuffer) {
  const countOffset = 8;
  const arrtibutes = new Float64Array(arrayBuffer, countOffset);
  return arrtibutes;
}
/**
 * Parse string attributes.
 * String spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
 * @param arrayBuffer
 * @returns {Array}
 */
function parseStringsAttributes(arrayBuffer) {
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
