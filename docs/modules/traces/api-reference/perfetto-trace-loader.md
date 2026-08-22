import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# PerfettoTraceLoader

<TracesDocsTabs active="perfettotraceloader" />

`PerfettoTraceLoader` reads stable Perfetto TrackEvent protobuf data into four typed Apache Arrow
tables. See the [Perfetto format page](../formats/perfetto-trace) for the supported projection and
limitations.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {PerfettoTraceLoader} from '@loaders.gl/traces';

const trace = await load('trace.perfetto-trace', PerfettoTraceLoader);

console.log(trace.tracks);
console.log(trace.slices);
console.log(trace.processes);
console.log(trace.threads);
```

The package-root export is metadata-only and supports async core APIs through `preload()`. Import
`PerfettoTraceLoaderWithParser` from `@loaders.gl/traces/perfetto-trace-loader` when direct access to
`parseSync` or the parser-bearing loader object is required.

## Result

```typescript
type PerfettoTrace = {
  tracks: PerfettoTrackArrowTable;
  slices: PerfettoSliceArrowTable;
  processes: PerfettoProcessArrowTable;
  threads: PerfettoThreadArrowTable;
};
```

Unsigned 64-bit UUIDs, timestamps, and durations remain Arrow `Uint64` values and are exposed as
JavaScript `bigint` values by Apache Arrow.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `perfettoTrace.batchSize` | `number` | `4096` | Packet drain threshold and maximum rows in an emitted record batch. |

Invalid, non-finite, or non-positive batch sizes use the default.

## Batched Parsing

`parseInBatches` yields tagged `PerfettoTraceBatch` objects because the four logical tables have
different Arrow schemas.

```typescript
import {parseInBatches} from '@loaders.gl/core';
import {PerfettoTraceLoader} from '@loaders.gl/traces';

const batches = await parseInBatches(byteChunks, PerfettoTraceLoader, {
  perfettoTrace: {batchSize: 1024}
});

for await (const batch of batches) {
  switch (batch.table) {
    case 'tracks':
    case 'slices':
    case 'processes':
    case 'threads':
      consume(batch.table, batch.data);
      break;
  }
}
```

```typescript
type PerfettoTraceBatch = {
  table: 'tracks' | 'slices' | 'processes' | 'threads';
  data: arrow.RecordBatch;
};
```

Batches follow packet order. A descriptor can therefore be emitted before a later update to the
same UUID, PID, or TID. Consumers building a current-state view should replace descriptor rows by
their identifier. Completed slices are emitted after their matching end event is received.

## Detection

The loader recognizes `.perfetto-trace` and `.pftrace` extensions and the
`application/x-perfetto-trace` MIME type. Binary sniffing requires a complete outer packet and a
recognized nested `TracePacket` field; a generic protobuf payload beginning with byte `0x0a` is not
accepted solely on that prefix.

## Errors

Malformed varints, unsupported protobuf wire types, and truncated final packets throw parsing
errors. Unknown well-formed packet fields are skipped.
