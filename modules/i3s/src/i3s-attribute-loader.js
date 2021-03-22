/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {parseI3STileAttribute} from './lib/parsers/parse-i3s-attribute';
import {load} from '@loaders.gl/core';
import {getUrlWithToken} from '../src/lib/parsers/url-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const EMPTY_VALUE = '';

/**
 * Loader for I3S attributes
 * @type {LoaderObject}
 */
export const I3SAttributeLoader = {
  name: 'I3S Attribute',
  id: 'i3s-attribute',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/binary'],
  parse,
  extensions: ['bin'],
  options: {},
  binary: true
};

async function parse(data, options) {
  data = parseI3STileAttribute(data, options);
  return data;
}
// TODO add loaded attributes to cache
/**
 * Load attributes based on feature id
 * @param {Object} tile
 * @param {number} featureId
 * @param {Object} options
 * @returns {Promise}
 */
// eslint-disable-next-line complexity
export async function loadFeatureAttributes(tile, featureId, options = {}) {
  const {attributeStorageInfo, attributeUrls} = getAttributesData(tile);

  if (!attributeStorageInfo || !attributeUrls || !featureId) {
    return null;
  }

  let attributes = [];
  const attributeLoadPromises = [];

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const url = getUrlWithToken(attributeUrls[index], options.token);
    const attributeName = attributeStorageInfo[index].name;
    const attributeType = getAttributeValueType(attributeStorageInfo[index]);
    const promise = load(url, I3SAttributeLoader, {attributeName, attributeType});
    attributeLoadPromises.push(promise);
  }
  try {
    attributes = await Promise.all(attributeLoadPromises);
  } catch (error) {
    // do nothing
  }

  if (!attributes.length) {
    return null;
  }

  return generateAttributesByFeatureId(attributes, attributeStorageInfo, featureId);
}

function getAttributesData(tile) {
  const attributeStorageInfo =
    tile && tile.tileset && tile.tileset.tileset && tile.tileset.tileset.attributeStorageInfo;
  const attributeUrls = tile && tile.header && tile.header.attributeUrls;

  return {attributeStorageInfo, attributeUrls};
}

/**
 * Get attribute value type based on property names
 * @param {Object} attribute
 * @returns {String}
 */
function getAttributeValueType(attribute) {
  if (attribute.hasOwnProperty('objectIds')) {
    return 'Oid32';
  } else if (attribute.hasOwnProperty('attributeValues')) {
    return attribute.attributeValues.valueType;
  }
  return '';
}

/**
 * Generates mapping featureId to feature attributes
 * @param {Array} attributes
 * @param {Object} attributeStorageInfo
 * @param {number} featureId
 * @returns {Object}
 */
function generateAttributesByFeatureId(attributes, attributeStorageInfo, featureId) {
  const objectIds = attributes.find(attribute => attribute.OBJECTID);

  if (!objectIds) {
    return null;
  }

  const attributeIndex = objectIds.OBJECTID.indexOf(featureId);

  if (attributeIndex < 0) {
    return null;
  }

  return getFeatureAttributesByIndex(attributes, attributeIndex, attributeStorageInfo);
}

/**
 * Generates attribute object for feature mapping by feature id
 * @param {Array} attributes
 * @param {Number} featureIdIndex
 * @param {Object} attributeStorageInfo
 * @returns {Object}
 */
function getFeatureAttributesByIndex(attributes, featureIdIndex, attributeStorageInfo) {
  const attributesObject = {};

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const attributeName = attributeStorageInfo[index].name;
    const attribute = attributes[index][attributeName];
    attributesObject[attributeName] = formatAttributeValue(attribute, featureIdIndex);
  }

  return attributesObject;
}

/**
 * Do formatting of attribute values or return empty string.
 * @param {Array} attribute
 * @param {Number} featureIdIndex
 * @returns {String}
 */
function formatAttributeValue(attribute, featureIdIndex) {
  return attribute && attribute[featureIdIndex]
    ? // eslint-disable-next-line no-control-regex
      attribute[featureIdIndex].toString().replace(/\u0000/g, '')
    : EMPTY_VALUE;
}
