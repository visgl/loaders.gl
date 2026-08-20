// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {SQLDataSource, registerSQLAdapter, getSQLAdapterFactory} from './sql-source';
export {DuckDBSQLSource, DuckDBSQLDataSource} from './duckdb-sql-source';
export {SnowflakeSQLSource, SnowflakeSQLDataSource} from './snowflake-sql-source';
export {parseSQLPredicate} from './parse-sql-predicate';
export {
  isSQLPredicate,
  SQL_PREDICATE_JSON_SCHEMA,
  validateSQLPredicate
} from './sql-predicate-schema';

export type {
  SQLComparisonPredicate,
  SQLInPredicate,
  SQLLogicalPredicate,
  SQLNotPredicate,
  SQLNullPredicate,
  SQLPredicate,
  SQLPredicateParserOptions,
  SQLPredicateProperty,
  SQLPredicateValue
} from './sql-predicate-types';

export type {
  SQLAdapter,
  SQLAdapterCapabilities,
  SQLAdapterFactory,
  SQLAdapterFactoryContext,
  SQLCatalogInfo,
  SQLColumnInfo,
  SQLMetadata,
  SQLParameterValues,
  SQLQueryOptions,
  SQLSchemaInfo,
  SQLSourceOptions,
  SQLTableInfo
} from './sql-types';
