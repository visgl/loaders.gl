// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import type {TypedArrayConstructor} from '@math.gl/core';
import {getTileComponentArrayType} from './helpers/tile-component-types';

// Reference:
// https://github.com/AnalyticalGraphicsInc/cesium/blob/1de96d087f0b17575eb1a3f736407b348c765d59/Source/Scene/Cesium3DTileFeatureTable.js
export default class Tile3DFeatureTable {
  json;
  buffer;
  featuresLength = 0;
  _cachedTypedArrays = {};

  constructor(featureTableJson, featureTableBinary) {
    this.json = featureTableJson;
    this.buffer = featureTableBinary;
  }

  getExtension(extensionName) {
    return this.json.extensions && this.json.extensions[extensionName];
  }

  hasProperty(propertyName) {
    return Boolean(this.json[propertyName]);
  }

  /** Reads a global property, using the component type for binary storage. */
  getGlobalProperty(
    propertyName,
    componentType: TypedArrayConstructor | number = Uint32Array,
    componentLength = 1
  ) {
    const jsonValue = this.json[propertyName];

    if (jsonValue && Number.isFinite(jsonValue.byteOffset)) {
      return this._getTypedArrayFromBinary(
        propertyName,
        componentType,
        componentLength,
        1,
        jsonValue.byteOffset
      );
    }

    return jsonValue;
  }

  /** Reads a property for all features as a typed array. */
  getPropertyArray(propertyName, componentType: TypedArrayConstructor | number, componentLength) {
    const jsonValue = this.json[propertyName];

    if (jsonValue && Number.isFinite(jsonValue.byteOffset)) {
      if ('componentType' in jsonValue) {
        componentType = getTileComponentArrayType(jsonValue.componentType);
      }
      return this._getTypedArrayFromBinary(
        propertyName,
        componentType,
        componentLength,
        this.featuresLength,
        jsonValue.byteOffset
      );
    }

    return this._getTypedArrayFromArray(propertyName, componentType, jsonValue);
  }

  /** Reads a single feature property, writing vector components to result. */
  getProperty(
    propertyName,
    componentType: TypedArrayConstructor | number,
    componentLength,
    featureId,
    result
  ) {
    const jsonValue = this.json[propertyName];
    if (!jsonValue) {
      return jsonValue;
    }

    const typedArray = this.getPropertyArray(propertyName, componentType, componentLength);

    if (componentLength === 1) {
      return typedArray[featureId];
    }

    for (let i = 0; i < componentLength; ++i) {
      result[i] = typedArray[componentLength * featureId + i];
    }

    return result;
  }

  // HELPERS

  _getTypedArrayFromBinary(
    propertyName,
    componentType: TypedArrayConstructor | number,
    componentLength,
    count,
    byteOffset
  ) {
    const cachedTypedArrays = this._cachedTypedArrays;
    let typedArray = cachedTypedArrays[propertyName];
    if (!typedArray) {
      const ArrayType =
        typeof componentType === 'number'
          ? getTileComponentArrayType(componentType)
          : componentType;
      typedArray = new ArrayType(
        this.buffer.buffer,
        this.buffer.byteOffset + byteOffset,
        count * componentLength
      );
      cachedTypedArrays[propertyName] = typedArray;
    }
    return typedArray;
  }

  _getTypedArrayFromArray(propertyName, componentType: TypedArrayConstructor | number, array) {
    const cachedTypedArrays = this._cachedTypedArrays;
    let typedArray = cachedTypedArrays[propertyName];
    if (!typedArray) {
      const ArrayType =
        typeof componentType === 'number'
          ? getTileComponentArrayType(componentType)
          : componentType;
      if (ArrayBuffer.isView(array)) {
        const byteOffset = array.byteOffset;
        const byteLength = array.byteLength;
        const elementCount = byteLength / ArrayType.BYTES_PER_ELEMENT;
        typedArray = new ArrayType(array.buffer, byteOffset, elementCount);
      } else {
        typedArray = new ArrayType(array);
      }
      cachedTypedArrays[propertyName] = typedArray;
    }
    return typedArray;
  }
}
