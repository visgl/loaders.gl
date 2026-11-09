// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableQuery} from '@loaders.gl/core/loader-utils';
import {parseSQLPredicate} from './parse-sql-predicate';
import type {BoundSQLPredicate, SQLPredicateProperty} from './sql-predicate-types';
import {parseSQLSelect} from './parse-sql-select';

/** Parses the supported SELECT/AS/FROM/WHERE/LIMIT subset into a portable logical query. */
export function parseSQLQuery(sql: string): TableQuery {
  return parseSQLSelect(sql, {
    parseWhere: expression => {
      const predicate = parseSQLPredicate(expression);
      validateColumnReferences(predicate);
      return predicate;
    }
  });
}

/** Keeps table qualification distinct from literal dotted source-column names. */
function validateColumnReferences(predicate: BoundSQLPredicate): void {
  if (predicate.op === 'and' || predicate.op === 'or') {
    predicate.args.forEach(validateColumnReferences);
  } else if (predicate.op === 'not') validateColumnReferences(predicate.args[0]);
  else {
    const property = predicate.args[0] as SQLPredicateProperty;
    if (!property.quoted && property.property.includes('.'))
      throw new Error(
        'Qualified WHERE columns are not supported; quote literal column names containing dots.'
      );
  }
}
