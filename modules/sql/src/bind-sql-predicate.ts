// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {bindColumnarPredicateParameters} from '@loaders.gl/loader-utils';

import {validateSQLPredicate} from './sql-predicate-schema';
import {
  type BoundSQLPredicate,
  type SQLPredicate,
  type SQLPredicateParameterValues
} from './sql-predicate-types';

/** Binds named parameter references in a portable SQL predicate without mutating the input AST. */
export function bindSQLPredicate(
  predicate: SQLPredicate,
  parameters: SQLPredicateParameterValues
): BoundSQLPredicate {
  validateSQLPredicate(predicate);
  return bindColumnarPredicateParameters(predicate, parameters);
}
