// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@math.gl/types';
import {getFixedSizeListSize} from './arrow-fixed-size-list-utils';
import * as arrow from 'apache-arrow';

export function getSizeAndValueFromMeshArrowVector(attributeVector: arrow.Vector): {
  size: number;
  value: TypedArray;
} {
  const size = getFixedSizeListSize(attributeVector);
  const typedArrays = getTypedArraysFromMeshArrowVector(attributeVector);
  return {size, value: typedArrays[0]};
}

export function getTypedArraysFromMeshArrowVector(attributeVector: arrow.Vector): TypedArray[] {
  const typedArrays: TypedArray[] = [];
  for (const attributeData of attributeVector.data) {
    const valueData = attributeData?.children[0];
    const typedArray = valueData.values;
    typedArrays.push(typedArray);
  }

  return typedArrays;
}
