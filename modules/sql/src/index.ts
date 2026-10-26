// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {SQLDataSource, registerSQLAdapter, getSQLAdapterFactory} from './sql-source';
export {ArrowTableSource} from './arrow-table-source';
export {DuckDBSQLSource, DuckDBSQLDataSource} from './duckdb-sql-source';
export {SnowflakeSQLSource, SnowflakeSQLDataSource} from './snowflake-sql-source';
export {
  ARROW_TABLE_QUERY_CAPABILITIES,
  explainArrowTableQuery,
  queryArrowTable
} from '@loaders.gl/core/scan/query-arrow-table';
export {parseSQLPredicate} from '@loaders.gl/core/scan/parse-sql-predicate';
export {bindSQLPredicate} from '@loaders.gl/core/scan/bind-sql-predicate';
export {compileSQLTableQuery} from './compile-table-query';
export {
  explainTableQuery,
  getSQLPredicateColumnNames,
  planTableQuery
} from '@loaders.gl/core/scan/table-query';
export {SQL_DATA_SOURCE_TABLE_QUERY_CAPABILITIES} from '@loaders.gl/core/scan/table-query-capabilities';
export {isSQLPredicateParameter} from '@loaders.gl/core/scan/sql-predicate-types';
export {
  isSQLPredicate,
  SQL_PREDICATE_JSON_SCHEMA,
  validateSQLPredicate
} from '@loaders.gl/core/scan/sql-predicate-schema';

export type {
  BoundSQLPredicate,
  SQLComparisonPredicate,
  SQLInPredicate,
  SQLLogicalPredicate,
  SQLNotPredicate,
  SQLNullPredicate,
  SQLPredicate,
  SQLPredicateParameter,
  SQLPredicateParameterValues,
  SQLPredicateParserOptions,
  SQLPredicateProperty,
  SQLPredicateScalar,
  SQLPredicateValue
} from '@loaders.gl/core/scan/sql-predicate-types';

export type {
  SQLAdapter,
  SQLAdapterCapabilities,
  SQLAdapterFactory,
  SQLAdapterFactoryContext,
  SQLCatalogInfo,
  SQLColumnInfo,
  SQLMetadata,
  SQLParameterValues,
  SQLQuery,
  SQLQueryOptions,
  SQLArrowInsertOptions,
  SQLSchemaInfo,
  SQLSourceOptions,
  SQLTableInfo
} from './sql-types';

export type {ArrowQueryOptions} from '@loaders.gl/core/scan/query-arrow-table';
export type {ArrowTableSourceOptions} from './arrow-table-source';
export type {
  CompiledSQLTableQuery,
  SQLTableQuery,
  SQLTableQueryCompilerOptions,
  SQLTableQueryDialect
} from './compile-table-query';
export type {
  RelationalAggregate,
  RelationalExpression,
  RelationalOrderKey
} from '@loaders.gl/core/loader-utils';
export type {
  TableQueryFilterStep,
  TableQueryLimitStep,
  TableQueryOptions,
  TableQueryPlan,
  TableQueryPlanStep,
  TableQueryProjectStep,
  TableQueryScanStep
} from '@loaders.gl/core/scan/table-query';
