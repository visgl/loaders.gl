# @loaders.gl/sql/query

Compile portable table queries and work with SQL predicates.

```
import {ARROW_TABLE_QUERY_CAPABILITIES, parseSQLPredicate, bindSQLPredicate, compileSQLTableQuery} from '@loaders.gl/sql/query';
```

## API[​](#api "Direct link to API")

| Export                                     | Kind    |
| ------------------------------------------ | ------- |
| `ARROW_TABLE_QUERY_CAPABILITIES`           | Utility |
| `parseSQLPredicate`                        | Utility |
| `bindSQLPredicate`                         | Utility |
| `compileSQLTableQuery`                     | Utility |
| `explainTableQuery`                        | Utility |
| `getSQLPredicateColumnNames`               | Utility |
| `planTableQuery`                           | Utility |
| `SQL_DATA_SOURCE_TABLE_QUERY_CAPABILITIES` | Utility |
| `isSQLPredicateParameter`                  | Utility |
| `isSQLPredicate`                           | Utility |
| `SQL_PREDICATE_JSON_SCHEMA`                | Utility |
| `validateSQLPredicate`                     | Utility |
| `BoundSQLPredicate`                        | Type    |
| `SQLComparisonPredicate`                   | Type    |
| `SQLInPredicate`                           | Type    |
| `SQLLogicalPredicate`                      | Type    |
| `SQLNotPredicate`                          | Type    |
| `SQLNullPredicate`                         | Type    |
| `SQLPredicate`                             | Type    |
| `SQLPredicateParameter`                    | Type    |
| `SQLPredicateParameterValues`              | Type    |
| `SQLPredicateParserOptions`                | Type    |
| `SQLPredicateProperty`                     | Type    |
| `SQLPredicateScalar`                       | Type    |
| `SQLPredicateValue`                        | Type    |
| `CompiledSQLTableQuery`                    | Type    |
| `SQLTableQuery`                            | Type    |
| `SQLTableQueryCompilerOptions`             | Type    |
| `SQLTableQueryDialect`                     | Type    |
| `RelationalAggregate`                      | Type    |
| `RelationalExpression`                     | Type    |
| `RelationalOrderKey`                       | Type    |
| `TableQueryFilterStep`                     | Type    |
| `TableQueryLimitStep`                      | Type    |
| `TableQuery`                               | Type    |
| `TableSelection`                           | Type    |
| `TableQueryExecutionOptions`               | Type    |
| `TableQueryOptions`                        | Type    |
| `TableQueryPlan`                           | Type    |
| `TableQueryPlanStep`                       | Type    |
| `TableQueryProjectStep`                    | Type    |
| `TableQueryScanStep`                       | Type    |

See the [sql module](https://loaders.gl/next/docs/modules/sql.md) for installation and related entrypoints.
