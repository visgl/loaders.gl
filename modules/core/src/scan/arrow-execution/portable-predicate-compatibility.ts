// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataType, DateUnit, Precision, TimeUnit, type Schema} from 'apache-arrow';
import {getColumnarPredicatePaths} from '@loaders.gl/core/loader-utils';
import type {SQLPredicate} from '../sql-predicate-types';

/** Keeps predicates on storage that RC.2 cannot bind in the portable evaluator. */
export function needsPortablePredicateCompatibility(
  schema: Schema,
  predicate: SQLPredicate
): boolean {
  return getColumnarPredicatePaths(predicate).some(path => {
    if (path.length > 1) return true;
    let type = schema.fields.find(field => field.name === path[0])?.type;
    while (type && DataType.isDictionary(type)) type = type.dictionary;
    if (!type) return false; // The upstream binder reports a missing top-level column.
    return !(
      DataType.isInt(type) ||
      (DataType.isFloat(type) && type.precision !== Precision.HALF) ||
      DataType.isBool(type) ||
      DataType.isUtf8(type) ||
      DataType.isBinary(type) ||
      (DataType.isDate(type) && type.unit === DateUnit.DAY) ||
      (DataType.isTimestamp(type) && type.unit === TimeUnit.MICROSECOND)
    );
  });
}
