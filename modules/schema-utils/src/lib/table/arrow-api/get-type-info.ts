// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Type} from './arrow-like-type';

/**
 * Gets type information from an Arrow type object or "mock" Arrow type object
 * @param arrowTypeLike Arrow Type or type object of similar shape
 */
export function getTypeInfo(arrowTypeLike: any): {
  typeId: Type;
  ArrayType: ArrayLike<unknown>;
  typeName: string;
  typeEnumName?: string;
  precision?: number;
} {
  return {
    typeId: arrowTypeLike.typeId,
    ArrayType: arrowTypeLike.ArrayType,
    typeName: arrowTypeLike.toString(),
    typeEnumName: getTypeKey(arrowTypeLike.typeId),
    precision: arrowTypeLike.precision
  };
}

let ReverseType: {[key: string]: string} | null = null;

function getTypeKey(typeKey) {
  if (!ReverseType) {
    ReverseType = {};
    for (const key in Type) {
      ReverseType[Type[key]] = key;
    }
  }

  return ReverseType[typeKey];
}
