// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableQuery} from '@loaders.gl/core/loader-utils';
import {parseSQLPredicate} from './parse-sql-predicate';
import type {BoundSQLPredicate, SQLPredicateProperty} from './sql-predicate-types';
import type {SQLCatalogQuery} from './sql-catalog';
import {parseSQLSelect, SQLQueryReader} from './parse-sql-select';

/** Parses the supported SELECT subset or SHOW SOURCES, SHOW TABLES and DESCRIBE commands. */
export function parseSQLQuery(sql: string): TableQuery | SQLCatalogQuery {
  const reader = new SQLQueryReader(sql);
  if (reader.takeKeyword('SHOW')) {
    let request: SQLCatalogQuery;
    if (reader.takeKeyword('SOURCES')) request = {command: 'showSources'};
    else {
      reader.expectKeyword('TABLES');
      request = reader.takeKeyword('FROM')
        ? {command: 'showTables', from: reader.identifier()}
        : {command: 'showTables'};
    }
    reader.end();
    return request;
  }
  if (reader.takeKeyword('DESCRIBE')) {
    const source = reader.identifier();
    const from = reader.takeSymbol('.') ? {source, table: reader.identifier()} : source;
    reader.end();
    return {command: 'describe', from};
  }
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
