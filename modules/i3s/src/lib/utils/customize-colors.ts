// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createFloat16Array, getFloat16Value, setFloat16Value} from '@loaders.gl/schema';
import type {MeshAttribute, TypedArray} from '@loaders.gl/schema';
import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {getAuthenticatedFetch} from '@loaders.gl/loader-utils';
import type {AttributeStorageInfo, COLOR, Field} from '../../types';

import {getAttributeValueType} from '../../i3s-attribute-loader';
import {getUrlWithToken} from './url-utils';
import {I3STileAttributes, parseI3STileAttribute} from '../parsers/parse-i3s-attribute';

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
 * @param options - optional loader options, including scoped credentials
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
  token?: string,
  options?: LoaderOptions
): Promise<MeshAttribute> {
  if (!colorsByAttribute) {
    return colors;
  }

  const resultColors = {
    ...colors,
    value:
      colors.componentType === 'float16'
        ? createFloat16Array(colors.value.length)
        : colors.value instanceof Float32Array
          ? new Float32Array(colors.value.length)
          : new Uint8Array(colors.value)
  };
  if (colors.componentType === 'float16') {
    for (let index = 0; index < colors.value.length; index++) {
      setFloat16Value(
        resultColors.value as any,
        index,
        getFloat16Value(colors.value as any, index)
      );
    }
  }

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
    token,
    options
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
    token,
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
        const colorIndex = i * 4 + index;
        if (colors.componentType === 'float16') {
          setFloat16Value(
            resultColors.value as any,
            colorIndex,
            getFloat16Value(resultColors.value as any, colorIndex) * (colorItem / 255)
          );
        } else if (colors.value instanceof Float32Array) {
          resultColors.value[colorIndex] = resultColors.value[colorIndex] * (colorItem / 255);
        } else {
          resultColors.value[colorIndex] = (resultColors.value[colorIndex] * colorItem) / 255;
        }
      });
    } else {
      for (let index = 0; index < color.length; index++) {
        const colorIndex = i * 4 + index;
        if (colors.componentType === 'float16') {
          setFloat16Value(resultColors.value as any, colorIndex, color[index] / 255);
        } else if (colors.value instanceof Float32Array) {
          resultColors.value[colorIndex] = color[index] / 255;
        } else {
          resultColors.value[colorIndex] = color[index];
        }
      }
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
  token?: string,
  options: LoaderOptions = {}
): Promise<I3STileAttributes | null> {
  const attributeIndex = attributeStorageInfo.findIndex(({name}) => attributeName === name);
  if (attributeIndex === -1) {
    return null;
  }
  const objectIdAttributeUrl = getUrlWithToken(attributeUrls[attributeIndex], token);
  const attributeType = getAttributeValueType(attributeStorageInfo[attributeIndex]);
  const response = await getAuthenticatedFetch(options)(objectIdAttributeUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load I3S attribute ${attributeName}: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const objectIdAttributeData = parseI3STileAttribute(arrayBuffer, {
    attributeName,
    attributeType
  });

  return objectIdAttributeData;
}
