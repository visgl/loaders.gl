import type {MeshAttribute} from '@loaders.gl/schema';
import type {COLOR, I3STileOptions, I3STilesetOptions} from '../../types';

import {load} from '@loaders.gl/core';
import {getAttributeValueType, I3SAttributeLoader} from '../../i3s-attribute-loader';
import {I3SLoaderOptions} from '../../i3s-loader';
import {getUrlWithToken} from '../utils/url-utils';

/**
 * Modify vertex colors array to visualize 3D objects in a attribute driven way
 * @param colors - vertex colors attribute
 * @param featureIds - feature Ids attribute
 * @param tileOptions - tile - related options
 * @param tilesetOptions - tileset-related options
 * @param options - loader options
 * @returns midified colors attribute
 */
export async function customizeColors(
  colors: MeshAttribute,
  featureIds: MeshAttribute,
  tileOptions: I3STileOptions,
  tilesetOptions: I3STilesetOptions,
  options?: I3SLoaderOptions
): Promise<MeshAttribute> {
  if (!options?.i3s?.colorsByAttribute) {
    return colors;
  }

  const colorizeAttributeField = tilesetOptions.fields.find(
    ({name}) => name === options?.i3s?.colorsByAttribute?.attributeName
  );
  if (
    !colorizeAttributeField ||
    !['esriFieldTypeDouble', 'esriFieldTypeInteger', 'esriFieldTypeSmallInteger'].includes(
      colorizeAttributeField.type
    )
  ) {
    return colors;
  }

  const colorizeAttributeData = await loadFeatureAttributeData(
    colorizeAttributeField.name,
    tileOptions,
    tilesetOptions,
    options
  );
  if (!colorizeAttributeData) {
    return colors;
  }

  const objectIdField = tilesetOptions.fields.find(({type}) => type === 'esriFieldTypeOID');
  if (!objectIdField) {
    return colors;
  }

  const objectIdAttributeData = await loadFeatureAttributeData(
    objectIdField.name,
    tileOptions,
    tilesetOptions,
    options
  );
  if (!objectIdAttributeData) {
    return colors;
  }

  const attributeValuesMap: {[key: number]: COLOR} = {};
  // @ts-expect-error
  for (let i = 0; i < objectIdAttributeData[objectIdField.name].length; i++) {
    // @ts-expect-error
    attributeValuesMap[objectIdAttributeData[objectIdField.name][i]] = calculateColorForAttribute(
      // @ts-expect-error
      colorizeAttributeData[colorizeAttributeField.name][i] as number,
      options
    );
  }

  for (let i = 0; i < featureIds.value.length; i++) {
    const color = attributeValuesMap[featureIds.value[i]];
    if (!color) {
      continue; // eslint-disable-line no-continue
    }
    colors.value.set(color, i * 4);
  }

  return colors;
}

/**
 * Calculate rgba color from the attribute value
 * @param attributeValue - value of the attribute
 * @param options - loader options
 * @returns - color array for a specific attribute value
 */
function calculateColorForAttribute(attributeValue: number, options?: I3SLoaderOptions): COLOR {
  if (!options?.i3s?.colorsByAttribute) {
    return [255, 255, 255, 255];
  }
  const {minValue, maxValue, minColor, maxColor} = options.i3s.colorsByAttribute;
  const rate = (attributeValue - minValue) / (maxValue - minValue);
  const color: COLOR = [255, 255, 255, 255];
  for (let i = 0; i < minColor.length; i++) {
    color[i] = Math.round((maxColor[i] - minColor[i]) * rate + minColor[i]);
  }
  return color;
}

/**
 * Load feature attribute data from the ArcGIS rest service
 * @param attributeName - attribute name
 * @param tileOptions - tile-related options
 * @param tilesetOptions - tileset-related options
 * @param options - loader options
 * @returns - Array-like list of the attribute values
 */
async function loadFeatureAttributeData(
  attributeName: string,
  {attributeUrls}: I3STileOptions,
  {attributeStorageInfo}: I3STilesetOptions,
  options?: I3SLoaderOptions
): Promise<{[key: string]: string[] | Uint32Array | Uint16Array | Float64Array | null} | null> {
  const attributeIndex = attributeStorageInfo.findIndex(({name}) => attributeName === name);
  if (attributeIndex === -1) {
    return null;
  }
  const objectIdAttributeUrl = getUrlWithToken(attributeUrls[attributeIndex], options?.i3s?.token);
  const attributeType = getAttributeValueType(attributeStorageInfo[attributeIndex]);
  const objectIdAttributeData = await load(objectIdAttributeUrl, I3SAttributeLoader, {
    attributeName,
    attributeType
  });

  // @ts-expect-error TODO action engine
  return objectIdAttributeData;
}
