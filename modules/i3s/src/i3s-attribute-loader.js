/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {parseI3STileAttribute} from './lib/parsers/parse-i3s-attribute';

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

export function getAttributesFromTileByFeatureId(tile, featureId) {
  if (featureId < 0 || !tile || !tile.header) {
    return null;
  }

  if (!tile.header.userData.layerFeaturesAttributes) {
    return null;
  }

  const {attributeStorageInfo} = tile.tileset.tileset;
  const {layerFeaturesAttributes} = tile.header.userData;
  const calculatedFeatureIndex = getFeatureAttributeIndex(layerFeaturesAttributes, featureId);

  if (calculatedFeatureIndex < 0) {
    return null;
  }

  return prepareFeatureAttributes(
    attributeStorageInfo,
    layerFeaturesAttributes,
    calculatedFeatureIndex
  );
}

function getFeatureAttributeIndex(layerFeaturesAttributes, featureId) {
  let featureIndex = -1;

  for (let index = 0; index < layerFeaturesAttributes.length; index++) {
    const attribute = layerFeaturesAttributes[index];

    if (attribute.hasOwnProperty('OBJECTID')) {
      featureIndex = attribute.OBJECTID.indexOf(featureId);
      break;
    }
  }

  return featureIndex;
}

function prepareFeatureAttributes(attributeStorageInfo, layerFeaturesAttributes, featureIndex) {
  const featureAttributes = {};

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const attributeName = attributeStorageInfo[index].name;
    const attributeData = layerFeaturesAttributes[index][attributeName];
    featureAttributes[attributeName] = formatAttributeValue(attributeData, featureIndex);
  }

  return featureAttributes;
}

function formatAttributeValue(attributeData, featureIndex) {
  return attributeData && attributeData[featureIndex]
    ? // eslint-disable-next-line no-control-regex
      attributeData[featureIndex].toString().replace(/\u0000/g, '')
    : EMPTY_VALUE;
}
