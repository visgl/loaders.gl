import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {load} from '@loaders.gl/core';
import {parseI3STileAttribute} from './lib/parsers/parse-i3s-attribute';
import {getUrlWithToken} from './lib/utils/url-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const EMPTY_VALUE = '';
const REJECTED_STATUS = 'rejected';
/**
 * Loader for I3S attributes
 */
export const I3SAttributeLoader: LoaderWithParser = {
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

/**
 * Load attributes based on feature id
 * @param {Object} tile
 * @param {number} featureId
 * @param {Object} options
 * @returns {Promise}
 */
// eslint-disable-next-line complexity
export async function loadFeatureAttributes(tile, featureId, options = {}) {
  const {attributeStorageInfo, attributeUrls, tilesetFields} = getAttributesData(tile);

  if (!attributeStorageInfo || !attributeUrls || !featureId) {
    return null;
  }

  let attributes: object[] = [];
  const attributeLoadPromises: Promise<object>[] = [];

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    // @ts-ignore
    const url = getUrlWithToken(attributeUrls[index], options.i3s?.token);
    const attributeName = attributeStorageInfo[index].name;
    const attributeType = getAttributeValueType(attributeStorageInfo[index]);
    const loadOptions = {...options, attributeName, attributeType};
    const promise = load(url, I3SAttributeLoader, loadOptions);

    attributeLoadPromises.push(promise);
  }
  try {
    attributes = await Promise.allSettled(attributeLoadPromises);
  } catch (error) {
    // do nothing
  }

  if (!attributes.length) {
    return null;
  }

  return generateAttributesByFeatureId(attributes, attributeStorageInfo, featureId, tilesetFields);
}

/**
 * Gets attributes data from tile.
 * @param tile 
 * @returns 
 */
function getAttributesData(tile) {
  const attributeStorageInfo = tile.tileset?.tileset?.attributeStorageInfo;
  const attributeUrls = tile.header?.attributeUrls;
  const tilesetFields = tile.tileset?.tileset?.fields || [];

  return {attributeStorageInfo, attributeUrls, tilesetFields};
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
 * Find in attributeStorageInfo attribute name responsible for feature ids list.
 * @param attributeStorageInfo 
 * @returns Feature ids attribute name
 */
 function getFeatureIdsAttributeName(attributeStorageInfo) {
  const objectIdsAttribute = attributeStorageInfo.find(attribute => attribute.name.includes('OBJECTID'));

  return objectIdsAttribute?.name;
}

/**
 * Generates mapping featureId to feature attributes
 * @param {Array} attributes
 * @param {Object} attributeStorageInfo
 * @param {number} featureId
 * @returns {Object}
 */
function generateAttributesByFeatureId(attributes, attributeStorageInfo, featureId, tilesetFields) {
  const objectIdsAttributeName = getFeatureIdsAttributeName(attributeStorageInfo);
  const objectIds = attributes.find((attribute) => attribute.value[objectIdsAttributeName]);

  if (!objectIds) {
    return null;
  }

  const attributeIndex = objectIds.value[objectIdsAttributeName].indexOf(featureId);

  if (attributeIndex < 0) {
    return null;
  }

  return getFeatureAttributesByIndex(attributes, attributeIndex, attributeStorageInfo, tilesetFields);
}

/**
 * Generates attribute object for feature mapping by feature id
 * @param {Array} attributes
 * @param {Number} featureIdIndex
 * @param {Object} attributeStorageInfo
 * @returns {Object}
 */
function getFeatureAttributesByIndex(attributes, featureIdIndex, attributeStorageInfo, tilesetFields) {
  const attributesObject = {};

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const attributeName = attributeStorageInfo[index].name;
    const codedValues = getAttributeCodedValues(attributeName, tilesetFields);
    const attribute = getAttributeByIndexAndAttributeName(attributes, index, attributeName);
    attributesObject[attributeName] = formatAttributeValue(attribute, featureIdIndex, codedValues);
  }

  return attributesObject;
}

/**
 * Get coded values list from tileset.
 * @param attributeName 
 * @param tilesetFields 
 */
function getAttributeCodedValues(attributeName, tilesetFields) {
  const attributeField = tilesetFields
    .find(field => field.name === attributeName || field.alias === attributeName);

  return attributeField?.domain?.codedValues || [];
}

/**
 * Return attribute value if it presents in atrributes list
 * @param {array} attributes
 * @param {number} index
 * @param {string} attributesName
 */
function getAttributeByIndexAndAttributeName(attributes, index, attributesName) {
  const attributeObject = attributes[index];

  if (attributeObject.status === REJECTED_STATUS) {
    return null;
  }

  return attributeObject.value[attributesName];
}

/**
 * Do formatting of attribute values or return empty string.
 * @param {Array} attribute
 * @param {Number} featureIdIndex
 * @returns {String}
 */
function formatAttributeValue(attribute, featureIdIndex, codedValues) {
  let value = EMPTY_VALUE;

  if (attribute && (featureIdIndex in attribute)) {
    // eslint-disable-next-line no-control-regex
    value = String(attribute[featureIdIndex]).replace(/\u0000|NaN/g, '').trim();
  }

  // Check if coded values are existed. If so we use them.
  if (codedValues.length) {
    const codeValue = codedValues.find(codedValue => codedValue.code === Number(value));
    value = codeValue?.name || EMPTY_VALUE;
  }

  return value;
}
