// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {TypedArray,} from '../../../types/types';
import {Field} from '../../../types/schema';
import {getArrayTypeFromDataType} from './data-type';

export interface ArrayType<T = unknown> {
  readonly length: number;
  [n: number]: T;
}

export function makeColumnFromField(field: Field, length: number): ArrayType {
  const ArrayType = getArrayTypeFromDataType(field.type, field.nullable);
  return new ArrayType(length);
}

/*
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function deduceSchema(rows) {
  const row = rows[0];

  const schema = {};
  let i = 0;
  for (const columnName in row) {
    const value = row[columnName];
    switch (typeof value) {
      case 'number':
      case 'boolean':
        // TODO - booleans could be handled differently...
        schema[columnName] = {name: String(columnName), index: i, type: Float32Array};
        break;

      case 'object':
        schema[columnName] = {name: String(columnName), index: i, type: Array};
        break;

      case 'string':
      default:
        schema[columnName] = {name: String(columnName), index: i, type: Array};
      // We currently only handle numeric rows
      // TODO we could offer a function to map strings to numbers?
    }
    i++;
  }
  return schema;
}
*/
