Versioned table source

![](/next/images/format-logos/parquet-logo.png)

# DeltaTableSource

DeltaTableSource replays the transaction log to determine the active Parquet files, then uses the common source and scan contracts for metadata, filtering, projection, limits, and streaming Arrow results.

[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Parquet source](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source-loader.md)

The snapshot path

## Resolve the version first, then query its files.

The source keeps transaction-log replay separate from physical Parquet reads. That makes version selection explicit while preserving the same table query semantics as an ordinary dataset.

01

Resolve

Replay add/remove actions through a selected version

02

Plan

Build the active Parquet file set

03

Query

Projection, predicates, limits, and cancellation

04

Return

Streaming Arrow batches in source order

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

`DeltaTableSource` is a read-only Delta Lake snapshot adapter. It replays newline-delimited transaction-log actions, resolves the active Parquet files, and delegates physical reads to `ParquetDatasetSource`.

Detailed guide

## Delta source details

The sections below document construction, snapshot planning, scan support, and the boundaries of the read-only adapter.

```
import {DeltaTableSource} from '@loaders.gl/tables/delta';



const source = new DeltaTableSource(

  'https://data.example.com/events/_delta_log/00000000000000000042.json'

);



const metadata = await source.getQueryMetadata();



for await (const batch of source.read({

  columns: ['timestamp', 'event_type'],

  predicate: {op: '=', args: [{property: 'event_type'}, 'click']},

  limit: 1000

})) {

  consume(batch);

}
```

## Scan support[​](#scan-support "Direct link to Scan support")

| Capability                                         | Support                     | Notes                                                            |
| -------------------------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| Entry point                                        | ✅ `read()`; `scan()` alias | Streaming Arrow batches from active Parquet files                |
| Query metadata                                     | ✅ Supported                | Schema, capabilities, row count, and byte length when available  |
| Version selection                                  | ✅ Supported                | Replays JSON commits from version 0 through the selected version |
| Add/remove actions                                 | ✅ Supported                | Produces the active file set                                     |
| Projection, predicate, limit, cancellation         | ✅ Supported                | Delegated to the Parquet dataset executor                        |
| Explain/plan                                       | ✅ Supported                | Active fragments plus delegated Parquet plans                    |
| Checkpoint files                                   | ❌ Not decoded              | Supply a JSON commit log URL                                     |
| Deletion vectors                                   | ❌ Rejected                 | The source fails explicitly rather than returning deleted rows   |
| Reader protocol above version 1 or reader features | ❌ Rejected                 | Unsupported protocol requirements fail explicitly                |
| Writes, CDC, and catalog discovery                 | ❌ Not provided             | Read-only source                                                 |

## URL and version behavior[​](#url-and-version-behavior "Direct link to URL and version behavior")

When the input URL names a zero-padded Delta commit, the version is inferred from the filename. Set `delta.version` or the per-read `version` option to select another non-negative version. Relative Parquet paths are resolved from the table root; `delta.baseUrl` can override that root.

The current implementation fetches and replays each JSON commit needed for the selected version. It does not use `_last_checkpoint` or Parquet checkpoint files, so very long transaction histories are not an efficient input yet.

## Safety boundaries[​](#safety-boundaries "Direct link to Safety boundaries")

Delta features that can change row visibility are never ignored silently. Active files containing deletion vectors are rejected, as are protocol declarations the adapter cannot interpret. This ensures a successful scan represents the selected snapshot rather than an approximate view.
