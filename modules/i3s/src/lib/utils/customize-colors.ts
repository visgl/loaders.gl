import type {MeshAttribute, TypedArray} from '@loaders.gl/schema';
import type {AttributeStorageInfo, COLOR, Field} from '../../types';

import {load} from '@loaders.gl/core';
import {getAttributeValueType, I3SAttributeLoader} from '../../i3s-attribute-loader';
import {getUrlWithToken} from './url-utils';
import {I3STileAttributes} from '../parsers/parse-i3s-attribute';

type ColorsByAttribute = {
  /** Feature attribute name */
  attributeName: string;
  /** Minimum attribute value */
  minValue: number;
  /** Maximum attribute value */
  maxValue: number;
  /** Minimum color. 3DObject will be colorized with gradient from `minColor to `maxColor` */
  minColor: [number, number, number, number];
  /** Maximum color. 3DObject will be colorized with gradient from `minColor to `maxColor` */
  maxColor: [number, number, number, number];
  /** Colorization mode. `replace` - replace vertex colors with a new colors, `multiply` - multiply vertex colors with new colors */
  mode: string;
};

/**
 * Calculate new vertex colors array to visualize 3D objects in a attribute driven way
 * @param colors - vertex colors attribute
 * @param featureIds - feature Ids attribute
 * @param attributeUrls - array of attribute's urls
 * @param fields - array of attribute's fileds
 * @param attributeStorageInfo - array of attributeStorageInfo
 * @param colorsByAttribute - attribute color options
 * @param token - access token
 * @returns new colors attribute
 */
// eslint-disable-next-line max-params
export async function customizeColors(
  colors: MeshAttribute,
  featureIds: number[] | TypedArray,
  attributeUrls: string[],
  fields: Field[],
  attributeStorageInfo: AttributeStorageInfo[],
  colorsByAttribute: ColorsByAttribute | null,
  token?: string
): Promise<MeshAttribute> {
  if (!colorsByAttribute) {
    return colors;
  }

  const resultColors = {
    ...colors,
    value: new Uint8Array(colors.value)
  };

  const colorizeAttributeField = fields.find(({name}) => name === colorsByAttribute?.attributeName);
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
    attributeUrls,
    attributeStorageInfo,
    token
  );
  if (!colorizeAttributeData) {
    return colors;
  }

  const objectIdField = fields.find(({type}) => type === 'esriFieldTypeOID');
  if (!objectIdField) {
    return colors;
  }

  const objectIdAttributeData = await loadFeatureAttributeData(
    objectIdField.name,
    attributeUrls,
    attributeStorageInfo,
    token
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
      colorsByAttribute
    );
  }

  for (let i = 0; i < featureIds.length; i++) {
    const color = attributeValuesMap[featureIds[i]];
    if (!color) {
      continue; // eslint-disable-line no-continue
    }

    /* eslint max-statements: ["error", 30] */
    /* eslint complexity: ["error", 12] */
    if (colorsByAttribute.mode === 'multiply') {
      // multiplying original mesh and calculated for attribute rgba colors in range 0-255
      color.forEach((colorItem, index) => {
        resultColors.value[i * 4 + index] = (resultColors.value[i * 4 + index] * colorItem) / 255;
      });
    } else {
      resultColors.value.set(color, i * 4);
    }
  }

  return resultColors;
}

/**
 * Calculate rgba color from the attribute value
 * @param attributeValue - value of the attribute
 * @param colorsByAttribute - attribute color options
 * @returns - color array for a specific attribute value
 */
function calculateColorForAttribute(
  attributeValue: number,
  colorsByAttribute: ColorsByAttribute
): COLOR {
  if (!colorsByAttribute) {
    return [255, 255, 255, 255];
  }
  const {minValue, maxValue, minColor, maxColor} = colorsByAttribute;
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
 * @param attributeUrls - array of attribute's urls
 * @param attributeStorageInfo - array of attributeStorageInfo
 * @param token - access token
 * @returns - Array-like list of the attribute values
 */
async function loadFeatureAttributeData(
  attributeName: string,
  attributeUrls: string[],
  attributeStorageInfo: AttributeStorageInfo[],
  token?: string
): Promise<I3STileAttributes | null> {
  const attributeIndex = attributeStorageInfo.findIndex(({name}) => attributeName === name);
  if (attributeIndex === -1) {
    return null;
  }
  const objectIdAttributeUrl = getUrlWithToken(attributeUrls[attributeIndex], token);
  const attributeType = getAttributeValueType(attributeStorageInfo[attributeIndex]);
  const objectIdAttributeData = await load(objectIdAttributeUrl, I3SAttributeLoader, {
    attributeName,
    attributeType
  });

  return objectIdAttributeData;
}
