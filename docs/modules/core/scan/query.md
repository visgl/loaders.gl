---
title: query and queryInBatches
description: Execute logical or parsed SQL queries against Arrow tables and table sources.
---

# query and queryInBatches

For a step-by-step introduction, see [Querying tables](/docs/developer-guide/querying-tables).
Both functions are exported only from `@loaders.gl/core/scan`.

```ts
query(query: TableQuery | string, options: QueryOptions): Promise<ArrowTable>;
queryInBatches(query: TableQuery | string, options: QueryOptions): AsyncIterable<ArrowTableBatch>;
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

## Optional SQL parsers

Import `parseSQLQuery` or `parseSQLSelect` from `@loaders.gl/core/scan/query` and pass it as
`sqlParser`. The former includes WHERE through `parseSQLPredicate`; the smaller latter parses
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
