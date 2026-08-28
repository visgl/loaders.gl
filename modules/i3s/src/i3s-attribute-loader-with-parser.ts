// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {resolvePath} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import type {I3STileAttributes} from './lib/parsers/parse-i3s-attribute';
import type {Field} from './types';
import {parseI3STileAttribute} from './lib/parsers/parse-i3s-attribute';
import {getUrlWithToken} from './lib/utils/url-utils';
import {I3SAttributeLoader as I3SAttributeLoaderMetadata} from './i3s-attribute-loader';

const {preload: _I3SAttributeLoaderPreload, ...I3SAttributeLoaderMetadataWithoutPreload} =
  I3SAttributeLoaderMetadata;

const EMPTY_VALUE = '';
const REJECTED_STATUS = 'rejected';

/**
 * Loader for I3S attributes
 */
export const I3SAttributeLoaderWithParser = {
  ...I3SAttributeLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: LoaderOptions) =>
    parseI3STileAttribute(arrayBuffer, options)
} as const satisfies LoaderWithParser<I3STileAttributes, never, I3SLoaderOptions>;

// TODO - these seem to use the loader rather than being part of the loader. Move to different file...

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

  if (!attributeStorageInfo || !attributeUrls || featureId < 0) {
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
    const promise = loadAttribute(url, loadOptions);

    attributeLoadPromises.push(promise);
  }
  try {
    attributes = await Promise.allSettled(attributeLoadPromises);
  } catch (_error) {
    // do nothing
  }

  if (!attributes.length) {
    return null;
  }

  return generateAttributesByFeatureId(attributes, attributeStorageInfo, featureId, tilesetFields);
}

async function loadAttribute(url: string, options: LoaderOptions): Promise<I3STileAttributes> {
  const response = await fetchAttribute(url, options.fetch);
  const arrayBuffer = await response.arrayBuffer();
  return parseI3STileAttribute(arrayBuffer, options);
}

async function fetchAttribute(
  url: string,
  fetchOptions?: LoaderOptions['fetch']
): Promise<Response> {
  const resolvedUrl = resolvePath(url);
  const customFetch = typeof fetchOptions === 'function' ? fetchOptions : null;
  const requestInit =
    typeof fetchOptions === 'object' && fetchOptions !== null
      ? (fetchOptions as RequestInit)
      : undefined;

  if (customFetch) {
    return customFetch(resolvedUrl, requestInit);
  }

  if (globalThis.loaders?.fetchNode && !isRequestUrl(resolvedUrl) && !isDataUrl(resolvedUrl)) {
    return globalThis.loaders.fetchNode(resolvedUrl, requestInit);
  }
  return fetch(resolvedUrl, requestInit);
}

function isRequestUrl(url: string): boolean {
  return url.startsWith('http:') || url.startsWith('https:');
}

function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
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
export function getAttributeValueType(attribute) {
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
  const objectIdsAttribute = attributeStorageInfo.find(attribute =>
    attribute.name.includes('OBJECTID')
  );

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
  const objectIds = attributes.find(attribute => attribute.value[objectIdsAttributeName]);

  if (!objectIds) {
    return null;
  }

  const attributeIndex = objectIds.value[objectIdsAttributeName].indexOf(featureId);

  if (attributeIndex < 0) {
    return null;
  }

  return getFeatureAttributesByIndex(
    attributes,
    attributeIndex,
    attributeStorageInfo,
    tilesetFields
  );
}

/**
 * Generates attribute object for feature mapping by feature id
 * @param {Array} attributes
 * @param {Number} featureIdIndex
 * @param {Object} attributeStorageInfo
 * @returns {Object}
 */
function getFeatureAttributesByIndex(
  attributes,
  featureIdIndex,
  attributeStorageInfo,
  tilesetFields
) {
  const attributesObject = {};

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const attributeName = attributeStorageInfo[index].name;
    const attributeField = getAttributeField(attributeName, tilesetFields);
    const codedValues = attributeField?.domain?.codedValues || [];
    const attribute = getAttributeByIndexAndAttributeName(attributes, index, attributeName);
    attributesObject[attributeName] = formatAttributeValue(
      attribute,
      featureIdIndex,
      codedValues,
      attributeField?.type
    );
  }

  return attributesObject;
}

/**
 * Get coded values list from tileset.
 * @param attributeName
 * @param tilesetFields
 */
function getAttributeField(attributeName: string, tilesetFields: Field[]): Field | undefined {
  return tilesetFields.find(field => field.name === attributeName || field.alias === attributeName);
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
 * @param fieldType - optional ArcGIS field type used for semantic formatting
 * @returns {String|null}
 */
function formatAttributeValue(attribute, featureIdIndex, codedValues, fieldType?: string) {
  let value = EMPTY_VALUE;

  if (attribute && featureIdIndex in attribute) {
    const rawValue = attribute[featureIdIndex];
    if (typeof rawValue === 'number' && Number.isNaN(rawValue)) {
      return null;
    }
    // eslint-disable-next-line no-control-regex
    value = String(rawValue)
      .replace(/\u0000/g, '')
      .trim();
  }

  if (fieldType === 'esriFieldTypeDate' && value) {
    const numericValue = Number(value);
    const dateValue = Number.isFinite(numericValue)
      ? numericValue
      : appendUtcToOffsetFreeDate(value);
    const parsedDate = new Date(dateValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      value = parsedDate.toISOString();
    }
  }

  // Check if coded values are existed. If so we use them.
  if (codedValues.length) {
    const codeValue = codedValues.find(codedValue => codedValue.code === Number(value));
    value = codeValue?.name || EMPTY_VALUE;
  }

  return value;
}

/**
 * Make an ISO date-time without an explicit offset deterministic across runtimes.
 * @param value - date value from an I3S attribute resource
 * @returns value with an explicit UTC suffix when it is offset-free
 */
function appendUtcToOffsetFreeDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value) ? `${value}Z` : value;
}
