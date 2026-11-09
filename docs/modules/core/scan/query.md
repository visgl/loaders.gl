---
title: query and queryInBatches
description: Execute logical or parsed SQL queries against Arrow tables and table sources.
---

# query and queryInBatches

For a step-by-step introduction, see [Querying tables](/docs/developer-guide/querying-tables).
Both functions are exported only from `@loaders.gl/core/scan`.

```ts
query(query: Query | string, options: QueryOptions): Promise<ArrowTable>;
queryInBatches(query: Query | string, options: QueryOptions): AsyncIterable<ArrowTableBatch>;
```

## Logical query

```ts
type TableReference = string | {source: string; table: string};

type TableQuery = {
  from?: TableReference;
  select?: readonly (string | {column: string; as?: string})[];
  where?: ColumnarPredicate;
  limit?: number;
};
```

WHERE refers to source column names before aliases. Predicates are applied before projection and
limits; predicate-only columns are retained internally. Rows and selected columns retain their
specified order. `limit` must be a non-negative safe integer; `select`, when supplied, must be
non-empty and produce unique output names.

`from` resolves an exact source name in `options.sources`. Its structured form calls
`source.getTable(table, {signal})`. Dots in identifier components are literal. Without `from`,
execution uses `options.source`. Unknown/duplicate source names, unsupported table lookup, and
non-table results fail; there is no fallback after an explicit FROM fails.

## Execution options

| Option | Contract |
| --- | --- |
| `source` | A loaders.gl `ArrowTable`, existing `TableScanSource`, or URL string. Optional when FROM selects a registered source. |
| `sources` | Readonly array of named `DataSource` objects. Names must be non-empty and unique. |
| `loaders` | Required for URLs: one URL-capable `SourceLoader` or an array of explicit candidates. Omit for loaded inputs. |
| `sqlParser` | Required for SQL strings: `SQLQueryParser` or `Promise<SQLQueryParser>`. Unused for logical input. |
| `signal` | Cooperative cancellation during source resolution and execution. |
| `onQueryComplete` | One terminal `TableQueryExecutionSummary`. Observer exceptions are ignored. |
| `core`, format namespaces | Existing source request and parser options, including `core.fetch`, credentials, and `core.name`. |

```ts
type SQLQueryParser = (sql: string) => TableQuery | Promise<TableQuery>;

interface TableSourceCollection {
  getTable(name: string, options?: {signal?: AbortSignal}):
    ArrowTable | TableScanSource | Promise<ArrowTable | TableScanSource>;
}
```

URL selection never consults registered loaders or falls back to parser-only loaders. With multiple
candidates, the first matching `testURL()` is selected; a single explicit loader does not need to
match the URL extension. Preloading and authentication complete before source construction.

`DataSource` accepts `core.name` and exposes a stable `name`. Available data/schema names and
File/URL basenames supply defaults without fetching; `core.type` or `source` is the final fallback.
Names cannot be changed with `setProps()`.

## Metadata commands

`Query` is `TableQuery | SQLCatalogQuery`. Metadata commands use `options.sources`; they do not
use the default `options.source`. SQL strings still require a `sqlParser`.

```ts
type SQLCatalogQuery =
  | {command: 'showSources'}
  | {command: 'showTables'; from?: string}
  | {command: 'describe'; from: TableReference};

await query('SHOW SOURCES;', {sources, sqlParser: parseSQLQuery});
await query('SHOW TABLES FROM warehouse;', {sources, sqlParser: parseSQLQuery});
await query('DESCRIBE warehouse.cities;', {sources, sqlParser: parseSQLQuery});
```

Both query functions return Arrow, including empty schema-bearing results. Commands accept no
SELECT, WHERE or LIMIT clauses. Source/table identifiers follow the same quoted-name rules as FROM.

| Command | Output columns, in order |
| --- | --- |
| `SHOW SOURCES` | `source_name: Utf8` |
| `SHOW TABLES [FROM source]` | `source_name: Utf8`, `table_name: Utf8`, `table_reference: Utf8`, `queryable: Bool` |
| `DESCRIBE source[.table]` | `source_name: Utf8`, `table_name: Utf8`, `column_name: Utf8`, `ordinal_position: Int32`, `data_type: Utf8`, `is_nullable: Bool`, `metadata: Utf8` |

All result fields are non-nullable. Ordinals start at one. `data_type` uses Arrow's type display;
`metadata` is JSON field metadata, or `{}`. `table_reference` is safely quoted SQL; use the catalog's
structured references when passing logical queries. `queryable` means the common table query
contract is available. SQL-native backends may expose metadata while requiring their own query API.

### Lazy catalog and provider contract

Import `createSQLCatalog`, `SQLCatalog`, `SQLCatalogSource`, `SQLCatalogTable` and `SQLCatalogQuery`
from `@loaders.gl/core/scan/query`:

```ts
const catalog = createSQLCatalog(sources);
catalog.getSources(); // readonly {name: string}[], no I/O
await catalog.getTables(sourceName, {signal}); // sourceName may be undefined
await catalog.getSchema(reference, {signal});
```

`getTables` returns `{name, sourceName, reference, queryable, schema?}` in source/table order;
`reference` is a `TableReference`, and available schemas retain their original metadata.
`getSchema` returns the portable `Schema`. Unknown or duplicate source names, malformed table
listings and unavailable schemas throw. The catalog snapshots registered names, not provider data.

Multi-table providers implement the following metadata methods (`TableMetadata` and
`TableDiscoverySource` are exported from `@loaders.gl/core/loader-utils`):

```ts
type TableMetadata = {name: string; schema?: Schema; queryable?: boolean};
interface TableDiscoverySource {
  getTablesMetadata(options?: {signal?: AbortSignal}):
    readonly TableMetadata[] | Promise<readonly TableMetadata[]>;
  getTableMetadata(name: string, options?: {signal?: AbortSignal}):
    TableMetadata | Promise<TableMetadata>;
}
```

Listings may omit schemas. A provider without `getTableMetadata` may include schemas in its listing
instead. If `queryable` is omitted, a collection's `getTable` method supplies the default.
Single-table scan sources use `getQueryMetadata`; non-table sources are skipped. GeoPackage and
SQL data sources implement named metadata discovery. SQL source loaded names preserve quoted native
catalog/schema/table components as one identifier; an unqualified name is accepted for DESCRIBE only
when unique. Use returned references rather than constructing those names yourself.

Discovery never calls `read()` or opens child handles through `getTable()`. Providers may read headers
or schema samples or contact metadata services. Signals are forwarded and checked after awaited
hooks; providers must cooperate to cancel in-flight work. Consumer return stops discovery of later
sources. Catalogs and commands never close caller-owned sources.

## Optional SQL parsers

Import `parseSQLQuery` or `parseSQLSelect` from `@loaders.gl/core/scan/query` and pass it as
`sqlParser`. The former supports metadata commands and includes WHERE through `parseSQLPredicate`; the smaller latter parses
SELECT columns/AS aliases, optional FROM and LIMIT, rejecting WHERE unless supplied with a
`parseWhere` callback. Both preserve case and double-quoted identifiers and reject unsupported
clauses or multiple statements. ESM parser-only imports tree-shake Arrow execution away.

These exports parse the supported subset, not general SQL. Table aliases, qualified column
references, comments, SELECT expressions, ordering, grouping, joins, and offsets are unsupported.

## Results and execution

`queryInBatches()` is lazy and applies backpressure; `query()` collects that stream. Supported source
batches are Arrow, object rows, array rows, and columnar tables. Other batch shapes are rejected.
Source metadata determines the output schema. Projection and rename reuse Arrow data buffers;
filtering may allocate. Field types, nullability, available metadata, column order, and row order
are preserved. Output schema drift is rejected.

Empty results emit one empty schema-bearing batch. `limit: 0` discovers metadata without calling
`read()`. A limit is never pushed below an outstanding local predicate. Sources advertising
`pushdown` or `pushdown+residual` predicates must apply exact filtering, including their residual
work after candidate pruning.

| Source | Projection | Predicate | Limit |
| --- | --- | --- | --- |
| CSV | After decoding | Local residual | Stops streaming |
| NDJSON | After decoding | Local residual | Stops streaming |
| Arrow IPC | Buffer views after decoding | Local residual | Stops streaming |
| Parquet | Column reads | Statistics pruning plus exact residual | Stops after matches |

CSV blanks remain empty strings. NDJSON infers primitive field types from the first non-null value
within its first decoded batch and retains known types in later null batches. Supply `ndjson.schema`
for unresolved or nested types. Formats preserve metadata only when they provide it.

## Lifetime, completion, and errors

The query closes sources it constructs from URLs. Caller-supplied sources and table handles returned
by collections remain caller/provider-owned. Upstream iterators are closed on consumer return,
cancellation, and failure. Cleanup errors fail the query but never replace an earlier execution
failure.

Completion includes parser/source-opening failures and reports one terminal status. Counters describe
batches received/emitted by the query; source telemetry supplies physical read/pruning metrics.
No child completion callback is forwarded. Async parser/preload/table hooks must cooperate with
cancellation; the signal is checked again when their awaited work completes.

## Benchmarks

Run `yarn bench query` or `yarn bench-headless query` for hermetic cross-format benchmarks. They use
4096 identical in-memory rows with warm metadata and compare collected/streaming all-pass,
all-reject, contiguous, scattered, and limited queries. Fixture encoding and metadata discovery are
outside timing. Results are queries per second, not network throughput or peak-heap measurements;
compare equivalent runtimes and machines.

Executor predicate-index memory is bounded by an input batch. Retained output and Arrow slices can
keep additional buffers alive; collection retains the complete result.
