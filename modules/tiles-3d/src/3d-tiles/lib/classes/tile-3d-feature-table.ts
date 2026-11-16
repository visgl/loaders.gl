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

  getGlobalProperty(
    propertyName,
    ArrayType: TypedArrayConstructor = Uint32Array,
    componentLength = 1
  ) {
    const jsonValue = this.json[propertyName];

    if (jsonValue && Number.isFinite(jsonValue.byteOffset)) {
      return this._getTypedArrayFromBinary(
        propertyName,
        ArrayType,
        componentLength,
        1,
        jsonValue.byteOffset
      );
    }

    return jsonValue;
  }

  getPropertyArray(propertyName, ArrayType: TypedArrayConstructor, componentLength) {
    const jsonValue = this.json[propertyName];

    if (jsonValue && Number.isFinite(jsonValue.byteOffset)) {
      if ('componentType' in jsonValue) {
        ArrayType = getTileComponentArrayType(jsonValue.componentType);
      }
      return this._getTypedArrayFromBinary(
        propertyName,
        ArrayType,
        componentLength,
        this.featuresLength,
        jsonValue.byteOffset
      );
    }

    return this._getTypedArrayFromArray(propertyName, ArrayType, jsonValue);
  }

  getProperty(propertyName, ArrayType: TypedArrayConstructor, componentLength, featureId, result) {
    const jsonValue = this.json[propertyName];
    if (!jsonValue) {
      return jsonValue;
    }

    const typedArray = this.getPropertyArray(propertyName, ArrayType, componentLength);

    if (componentLength === 1) {
      return typedArray[featureId];
    }

    for (let i = 0; i < componentLength; ++i) {
      result[i] = typedArray[componentLength * featureId + i];
    }

    return result;
  }

  // HELPERS

  _getTypedArrayFromBinary(propertyName, ArrayType, componentLength, count, byteOffset) {
    const cachedTypedArrays = this._cachedTypedArrays;
    let typedArray = cachedTypedArrays[propertyName];
    if (!typedArray) {
      typedArray = new ArrayType(
        this.buffer.buffer,
        this.buffer.byteOffset + byteOffset,
        count * componentLength
      );
      cachedTypedArrays[propertyName] = typedArray;
    }
    return typedArray;
  }

  _getTypedArrayFromArray(propertyName, ArrayType, array) {
    const cachedTypedArrays = this._cachedTypedArrays;
    let typedArray = cachedTypedArrays[propertyName];
    if (!typedArray) {
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
