// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseSQLPredicate as parseMathSQLPredicate} from '@math.gl/core/sql';
import {validateSQLPredicate} from './sql-predicate-schema';
import type {
  BoundSQLPredicate,
  SQLPredicate,
  SQLPredicateParserOptions
} from './sql-predicate-types';

/** Parses predicates for scan backends, which accept the portable column-only vocabulary. */
export function parseSQLPredicate(
  source: string,
  options?: SQLPredicateParserOptions & {preserveParameters?: false}
): BoundSQLPredicate;
export function parseSQLPredicate(source: string, options: SQLPredicateParserOptions): SQLPredicate;
export function parseSQLPredicate(
  source: string,
  options?: SQLPredicateParserOptions
): SQLPredicate {
  const predicate = options
    ? parseMathSQLPredicate(source, options)
    : parseMathSQLPredicate(source);
  validateSQLPredicate(predicate);
  return predicate;
}
