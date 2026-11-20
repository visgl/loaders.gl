// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataType, DateUnit, TimeUnit, type Schema} from 'apache-arrow';
import {getColumnarPredicatePaths} from '@loaders.gl/core/loader-utils';
import type {SQLPredicate} from '../sql-predicate-types';

/** RC.2 binds top-level predicates and supports Date32 and microsecond timestamps. */
export function needsPortablePredicateCompatibility(
  schema: Schema,
  predicate: SQLPredicate
): boolean {
  return getColumnarPredicatePaths(predicate).some(path => {
    if (path.length > 1) return true;
    let type = schema.fields.find(field => field.name === path[0])?.type;
    if (type && DataType.isDictionary(type)) type = type.dictionary;
    return Boolean(
      type &&
        ((DataType.isDate(type) && type.unit !== DateUnit.DAY) ||
          (DataType.isTimestamp(type) && type.unit !== TimeUnit.MICROSECOND))
    );
  });
}
