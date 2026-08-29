# Delta Lake table source

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

`DeltaTableSource` is a read-only Delta Lake snapshot adapter. It replays newline-delimited
transaction-log actions, resolves the active Parquet files, and delegates physical reads to
`ParquetDatasetSource`.

```ts
import {DeltaTableSource} from '@loaders.gl/scan/delta';

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

## Scan support

| Capability | Support | Notes |
| --- | --- | --- |
| Entry point | `read()`; `scan()` alias | Streaming Arrow batches from active Parquet files |
| Query metadata | Supported | Schema, capabilities, row count, and byte length when available |
| Version selection | Supported | Replays JSON commits from version 0 through the selected version |
| Add/remove actions | Supported | Produces the active file set |
| Projection, predicate, limit, cancellation | Supported | Delegated to the Parquet dataset executor |
| Explain/plan | Supported | Active fragments plus delegated Parquet plans |
| Checkpoint files | Not decoded | Supply a JSON commit log URL |
| Deletion vectors | Rejected | The source fails explicitly rather than returning deleted rows |
| Reader protocol above version 1 or reader features | Rejected | Unsupported protocol requirements fail explicitly |
| Writes, CDC, and catalog discovery | Not provided | Read-only source |

## URL and version behavior

When the input URL names a zero-padded Delta commit, the version is inferred from the filename. Set
`delta.version` or the per-read `version` option to select another non-negative version. Relative
Parquet paths are resolved from the table root; `delta.baseUrl` can override that root.

The current implementation fetches and replays each JSON commit needed for the selected version. It
does not use `_last_checkpoint` or Parquet checkpoint files, so very long transaction histories are
not an efficient input yet.

## Safety boundaries

Delta features that can change row visibility are never ignored silently. Active files containing
deletion vectors are rejected, as are protocol declarations the adapter cannot interpret. This
ensures a successful scan represents the selected snapshot rather than an approximate view.
