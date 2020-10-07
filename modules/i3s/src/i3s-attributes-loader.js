import {fetchFile} from '@loaders.gl/core';
/* global Buffer */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const STRING_ATTRIBUTE_TYPE = 'String';
const OBJECT_ID_ATTRIBUTE_TYPE = 'Oid32';
const FLOAT_64_TYPE = 'Float64';
const FILES = 'FILES';
const ARRAY_BUFFERS = 'ARRAY_BUFFERS';

async function parseI3STileAttributes(tile, options) {
  if (!tile.attributeUrls) {
    return tile;
  }

  const filesWithAttributes = await getFilesOrArrayBuffers(tile.attributeUrls, FILES);
  const arrayBuffers = await getFilesOrArrayBuffers(filesWithAttributes, ARRAY_BUFFERS);

  tile.attributes = getTileAttributes(arrayBuffers, options);
  return tile;
}

async function getFilesOrArrayBuffers(items, type) {
  const promises = [];

  for (let index = 0; index < items.length; index++) {
    const fileOrUrl = items[index];

    switch (type) {
      case FILES:
        promises.push(fetchFile(fileOrUrl));
        break;
      case ARRAY_BUFFERS:
        promises.push(fileOrUrl.arrayBuffer());
        break;
      default:
        break;
    }
  }

  return await Promise.all(promises);
}

function getTileAttributes(arrayBuffers, options) {
  const attributes = {};
  const {attributeStorageInfo} = options;

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const attributeName = attributeStorageInfo[index].name;
    const attributeType = attributeStorageInfo[index].attributeValues.valueType;
    attributes[attributeName] = parseAttributes(attributeType, arrayBuffers[index]);
  }

  return attributes;
}

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

function parseShortNumberAttributes(arrayBuffer) {
  const countOffset = 4;
  const attributes = new Uint32Array(arrayBuffer, countOffset);
  return attributes;
}

function parseFloatAttributes(arrayBuffer) {
  const countOffset = 8;
  const arrtibutes = new Float64Array(arrayBuffer, countOffset);
  return arrtibutes;
}

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

/** @type {LoaderObject} */
const I3SAttributesLoader = {
  id: 'i3s-attributes',
  name: 'I3S Attributes',
  version: VERSION,
  mimeTypes: ['application/binary'],
  parse,
  extensions: ['bin'],
  options: {}
};

async function parse(data, options) {
  data = parseI3STileAttributes(data, options);
  return data;
}

export default I3SAttributesLoader;
