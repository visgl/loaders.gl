import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# ChromeTraceLoader

<TracesDocsTabs active="chrometraceloader" />

`ChromeTraceLoader` loads Chrome Trace Event JSON. It returns a validated JSON container by default
or an Apache Arrow event table when `chromeTrace.shape` is `arrow-table`.

## Usage

```typescript
import {load, parse} from '@loaders.gl/core';
import {ChromeTraceLoader} from '@loaders.gl/traces';

const traceFile = await load('trace.json', ChromeTraceLoader);
const eventTable = await load('trace.json', ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table'}
});
const parsed = await parse(jsonText, ChromeTraceLoader);
```

The package-root export is metadata-only. Async core APIs preload the parser from
`@loaders.gl/traces/chrome-trace-loader`. Synchronous code that needs a parser-bearing loader must
import `ChromeTraceLoaderWithParser` from that subpath.

## Return Types

| Shape | Return value |
| --- | --- |
| `json` | `ChromeTraceFileSchema`, preserving top-level and event passthrough fields. |
| `arrow-table` | `ChromeTraceEventArrowTable`, with file metadata attached to the Arrow schema. |

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `chromeTrace.shape` | `'json' \| 'arrow-table'` | `'json'` | Whole-file result shape. |
| `chromeTrace.batchSize` | `number` | `256` | Maximum events per streamed Arrow record batch. |
| `maxLength` | `number` | `1000` | Maximum number of events structurally validated; all events are still returned. |

The legacy top-level `shape` option is also accepted. Prefer `chromeTrace.shape` in new code.

## Batched Parsing

`parseInBatches` requires `chromeTrace.shape: 'arrow-table'` and yields
`ChromeTraceEventArrowRecordBatch` values with the same lossless schema used by whole-file parsing.

```typescript
import {parseInBatches} from '@loaders.gl/core';
import {ChromeTraceLoader} from '@loaders.gl/traces';

const batches = await parseInBatches(chunks, ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table', batchSize: 1024}
});

for await (const batch of batches) {
  console.log(batch.numRows);
}
```

The tokenizer accepts string, `ArrayBuffer`, and typed-array chunks at arbitrary UTF-8 and JSON
boundaries. `displayTimeUnit` and top-level `metadata` are attached to emitted schema metadata once
they are available.

Use [Chrome trace streaming](./chrome-trace-streaming) when the destination expects live
`TraceStreamChunk` snapshots instead of Arrow record batches.
