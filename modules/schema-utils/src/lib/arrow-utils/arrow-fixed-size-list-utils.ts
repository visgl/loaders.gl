// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@math.gl/types';
import {DataType, getFloat16Storage, isNativeFloat16Array} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import {getDataTypeFromArray} from '../schema/data-type';
import {deserializeArrowType} from '../schema/convert-arrow-schema';

export function isFixedSizeList(vector: arrow.Vector): vector is arrow.Vector<arrow.FixedSizeList> {
  return vector.type instanceof arrow.FixedSizeList;
}

export function getFixedSizeListSize(vector: arrow.Vector): number {
  return vector.type instanceof arrow.FixedSizeList ? vector.type.listSize : 1;
}

/** Get Arrow FixedSizeList vector from a typed array */
export function getFixedSizeListVector(
  typedArray: TypedArray,
  stride: number,
  logicalType?: DataType
): arrow.Vector<arrow.FixedSizeList> {
  const data = getFixedSizeListData(typedArray, stride, logicalType);
  return new arrow.Vector<arrow.FixedSizeList>([data]);
}

/** Get Arrow FixedSizeList vector from a typed array */
export function getFixedSizeListData(
  typedArray: TypedArray,
  stride: number,
  logicalType?: DataType
): arrow.Data<arrow.FixedSizeList> {
  const listType = getFixedSizeListType(typedArray, stride, logicalType);
  const nestedType = listType.children[0].type;
  const storage =
    logicalType === 'float16' && isNativeFloat16Array(typedArray)
      ? getFloat16Storage(typedArray)
      : typedArray;
  const buffers: Partial<Record<arrow.BufferType, any>> = {
    // valueOffsets: undefined,
    [arrow.BufferType.DATA]: storage // values
    // nullBitmap: undefined,
    // typeIds: undefined
  };

  // Note: The contiguous array of data is held by the nested "primitive type" column
  const nestedData = new arrow.Data(nestedType, 0, storage.length, 0, buffers);

  // Wrapped in a FixedSizeList column that provides a "strided" view of the data
  const data = new arrow.Data<arrow.FixedSizeList>(
    listType,
    0,
    storage.length / stride,
    0,
    undefined,
    [nestedData]
  );

  return data;
}

/** Get Arrow FixedSizeList vector from a typed array */
export function getFixedSizeListType(
  typedArray: TypedArray,
  stride: number,
  logicalType?: DataType
): arrow.FixedSizeList {
  const type = logicalType || getDataTypeFromArray(typedArray).type;
  const arrowType = deserializeArrowType(type);
  const listType = new arrow.FixedSizeList(stride, new arrow.Field('value', arrowType, false));
  return listType;
}
