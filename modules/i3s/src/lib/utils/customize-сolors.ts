import type {MeshAttribute, TypedArray} from '@loaders.gl/schema';
import type {AttributeStorageInfo, COLOR, Field, I3STileContent} from '../../types';

import {load} from '@loaders.gl/core';
import {getAttributeValueType, I3SAttributeLoader} from '../../i3s-attribute-loader';
import {I3SLoaderOptions} from '../../i3s-loader';
import {getUrlWithToken} from './url-utils';
import {I3STileAttributes} from '../parsers/parse-i3s-attribute';

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
  featureIds: TypedArray,
  attributeUrls: string[],
  fields: Field[],
  attributeStorageInfo: AttributeStorageInfo[],
  content: I3STileContent,
  inlineColoring: boolean,
  options?: I3SLoaderOptions
): Promise<MeshAttribute> {
  if (!options?.i3s?.colorsByAttribute) {
    return colors;
  }

  const resultColors = inlineColoring
    ? colors
    : {
        ...colors,
        value: colors.value.slice()
      };

  if (!content.originalColorsAttributes) {
    content.originalColorsAttributes = {
      ...colors,
      value: colors.value.slice()
    };
  } else if (options.i3s.colorsByAttribute.mode === 'multiply') {
    resultColors.value = content.originalColorsAttributes.value.slice();
  }

  content.customColors = options.i3s.colorsByAttribute;

  const colorizeAttributeField = fields.find(
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
    attributeUrls,
    attributeStorageInfo,
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

  for (let i = 0; i < featureIds.length; i++) {
    const color = attributeValuesMap[featureIds[i]];
    if (!color) {
      continue; // eslint-disable-line no-continue
    }

    /* eslint max-statements: ["error", 30] */
    /* eslint complexity: ["error", 14] */
    if (options.i3s.colorsByAttribute.mode === 'multiply') {
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
  attributeUrls: string[],
  attributeStorageInfo: AttributeStorageInfo[],
  options?: I3SLoaderOptions
): Promise<I3STileAttributes | null> {
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

  return objectIdAttributeData;
}
