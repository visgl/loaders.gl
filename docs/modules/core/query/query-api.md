---
title: query and queryInBatches
description: Execute logical or parsed SQL queries against Arrow tables and table sources.
---

# query and queryInBatches

For a step-by-step introduction, see [Querying tables](/docs/developer-guide/querying-tables).
Both functions are available from `@loaders.gl/core/query`.

```ts
query(query: Query | string, options: QueryOptions): Promise<Table>;
queryInBatches(query: Query | string, options: QueryOptions): AsyncIterable<RecordBatch>;
```

## Logical query

```ts
type TableReference = string | {source: string; table: string};

type TableQuery = {
  from?: TableReference;
  select?: readonly (string | {column: string; as?: string})[];
  where?: ColumnarPredicate;
  offset?: number;
  limit?: number;
};
```

WHERE refers to source column names before aliases. Predicates are applied before projection and
limits; predicate-only columns are retained internally. Rows and selected columns retain their
specified order. Both `offset` and `limit` must be non-negative safe integers. A supplied `select` must be
non-empty and produce unique output names.

Pass `offset` and `limit` in the logical request or write `OFFSET` and `LIMIT` in SQL.
The execution options and their `_scan` namespace reject row-window fields. Sources configured
with a default row window, such as Parquet sources created with `parquet.offset` or
`parquet.limit`, must be reopened without those defaults. This keeps source-side reads
from applying a window before the logical predicate or applying it twice. Direct
`source.read({offset, limit})` calls still support per-read windows on sources that implement them.

`from` resolves an exact source name in `options.sources`. Its structured form calls
`source.getTable(table, {signal})`. Dots in identifier components are literal. Without `from`,
execution uses `options.source`. Unknown/duplicate source names, unsupported table lookup, and
non-table results fail; there is no fallback after an explicit FROM fails.

## Execution options

| Option | Contract |
| --- | --- |
| `source` | An Apache Arrow `Table`, an existing `TableScanSource`, or a URL string. Optional for metadata commands or when FROM selects a registered source. |
| `sources` | Readonly array of named `DataSource` objects. Names must be non-empty and unique. |
| `loaders` | Required for URLs: one URL-capable `SourceLoader` or an array of explicit candidates. Omit for loaded inputs. |
| `sqlParser` | Required for SQL strings: `SQLQueryParser` or `Promise<SQLQueryParser>`. Unused for logical input. |
| `signal` | Cooperative cancellation during source resolution and execution. |
| `onQueryComplete` | One terminal `TableQueryExecutionSummary`. Observer exceptions are ignored. |
| `core`, format namespaces | Existing source request and parser options, including `core.fetch`, credentials, and `core.name`. |

```ts
type SQLQueryParser = (sql: string) => Query | Promise<Query>;

interface TableSourceCollection {
  getTable(name: string, options?: {signal?: AbortSignal}):
    arrow.Table | TableScanSource | Promise<arrow.Table | TableScanSource>;
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
from `@loaders.gl/core/query/sql`:

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
  getTableMetadata?(name: string, options?: {signal?: AbortSignal}):
    TableMetadata | Promise<TableMetadata>;
}
```

Listings may omit schemas. A provider without `getTableMetadata` may include schemas in its listing
instead. If `queryable` is omitted, a collection's `getTable` method supplies the default.
Collections require a qualified DESCRIBE reference, even when they also expose a default table.
Single-table scan sources use `getQueryMetadata`; non-table sources are skipped. GeoPackage and
SQL data sources implement named metadata discovery. SQL source loaded names preserve quoted native
catalog/schema/table components as one identifier; an unqualified name is accepted for DESCRIBE only
when unique. Use returned references rather than constructing those names yourself.

Discovery never calls `read()` or opens child handles through `getTable()`. Providers may read headers, schema samples or complete container files, or contact metadata services. Signals are forwarded and checked after awaited
hooks; providers must cooperate to cancel in-flight work. Consumer return stops discovery of later
sources. Catalogs and commands never close caller-owned sources.

## Optional SQL parsers

Import `parseSQLQuery` from `@math.gl/sql/parser` or `@loaders.gl/core/query/sql` and pass it as
`sqlParser`. It supports SELECT, WHERE, FROM, LIMIT, OFFSET, and catalog commands. Use `parseSQLSelect`
for SELECT parsing with an optional caller-supplied WHERE parser. Both preserve case and double-quoted identifiers.

Math.gl compiles computed SELECT expressions, fixed-size ARRAY projections, and computed or
cast-bearing WHERE predicates against the source Arrow schema. Computed filters run before the
row limit and output projection. For example, `SELECT value + 1 AS next WHERE value * 2 > 10`
filters source rows before computing `next`. Use `ARRAY[x, y, z]::REAL[3] AS position` for a packed
Float32 column. Without an explicit type, math.gl infers component precision from the inputs.
A null component makes the whole tuple null. The query executor supports SQL OFFSET and LIMIT.
Use dotted access such as `location.score` to read an Arrow struct field in
an expression. Use double quotes around a literal column name containing a dot,
such as `"location.score"`. Table aliases, ordering, grouping, and joins are
outside this query API.

## Results and execution

`queryInBatches()` is lazy and applies backpressure; `query()` collects that stream. Supported source
batches are Arrow, object rows, array rows, and columnar tables. Other batch shapes are rejected.
After filtering, `OFFSET` skips matching rows and `LIMIT` caps the remaining results. The stream
discards fully filtered or skipped batches and slices boundary batches without copying Arrow
buffers. An empty result still carries its schema.

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

### Row-preserving scale projections

Use `@loaders.gl/core/scan-scales` to compute scale-driven Arrow columns
and the descriptors that explain their values. The input query controls the
row set. Include the value and domain columns in its output. Scale expressions
preserve the order and cardinality of those rows.

```ts
import {queryScales} from '@loaders.gl/core/scan-scales';
import {parseSQLQuery} from '@math.gl/sql/parser';

const {columns, scales} = await queryScales(
  'SELECT temperature WHERE temperature IS NOT NULL',
  {color: "SCALE_COLOR(temperature, DOMAIN(temperature), PALETTE('viridis'))"},
  {source: arrowTable, sqlParser: parseSQLQuery}
);

const color = columns.color;
const legend = scales.color.descriptor;
```

Domains resolve over the returned rows, including the effect of any row limit
or offset. Each scale exposes its evaluator through `sample(value)` and its
JSON-safe configuration through `descriptor`. This entry point materializes
the query result before resolving its domains.

Use `queryScalesInBatches()` for fixed domains. It appends row-aligned
results in source order and reuses the same resolved scale across batches.

Use `queryScalesProgressive()` for data-derived domains. It reads the
query once and emits complete replacement snapshots as domains evolve.
Each snapshot includes all rows read so far and the scales used for
its vectors. The final snapshot has `final: true`. Configure
`emitEveryBatches` and `maxRetainedRows` to control recoloring frequency
and retained rows. Percentile endpoints use the upstream bounded sketch.
Quantile classification uses exact breaks in `queryScales()` and bounded
sketches in `queryScalesProgressive()`. Both expose their actual class breaks
through the resolved descriptor. Quantize scales can publish constant extents.

Computed quantile inputs such as `SCALE_QUANTILE(value * 2, 5, PALETTE('Blues'))`
work in materialized and progressive queries. Fixed ordinal mappings and threshold
scales can use explicit colors. Use `queryScaleExpressions()` for scale calls
inside `CASE`, `COALESCE`, or nested expressions. Its `scales` map contains
an ordered array of resolved samplers for every expression, matching the scale
calls that produced the output.

Run `yarn bench scale-query` to compare fixed-domain streaming, exact
percentile collection, and approximate percentile snapshots over equivalent
Arrow IPC, Parquet, and CSV sources. The benchmark starts with warm source
metadata and applies the same row predicate in each format.

## Preloading query execution

Import `preloadQuery` from `@loaders.gl/core/query` to warm the ordinary Arrow executor
when an application anticipates a query, for example when it opens a query panel.

```ts
await preloadQuery();
```

Preloading does not open a source or read rows. Concurrent queries share the executor import.
Without an explicit preload, `query()` starts loading the executor alongside SQL parsing,
source opening, and metadata discovery. `queryInBatches()` starts on the first iterator pull.
Row reads begin after planning. Progressive aggregates and computed expressions load their
specialized implementations on demand.
