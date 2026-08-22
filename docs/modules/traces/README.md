import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Traces

<TracesDocsTabs active="overview" />

The `@loaders.gl/traces` module reads and writes performance trace formats without requiring a
specific visualization framework. Chrome Trace Event JSON can be loaded as validated JSON or
Apache Arrow. Stable Perfetto TrackEvent protobuf data is projected into four typed Arrow tables.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/traces apache-arrow
```

## Formats and APIs

| Format | Loader result | Batched result | Writer input |
| --- | --- | --- | --- |
| [Chrome Trace Event JSON](/docs/modules/traces/formats/chrome-trace) | Validated JSON or one Arrow event table | Arrow event record batches | Arrow event table or record batch |
| [Perfetto protobuf](/docs/modules/traces/formats/perfetto-trace) | `tracks`, `slices`, `processes`, and `threads` Arrow tables | Tagged `{table, data}` record batches | The same four Arrow tables |

| API | Purpose |
| --- | --- |
| [`ChromeTraceLoader`](/docs/modules/traces/api-reference/chrome-trace-loader) | Load Chrome Trace JSON as JSON or Arrow. |
| [`ChromeTraceWriter`](/docs/modules/traces/api-reference/chrome-trace-writer) | Reconstruct Chrome Trace JSON from Arrow events. |
| [`PerfettoTraceLoader`](/docs/modules/traces/api-reference/perfetto-trace-loader) | Load stable Perfetto TrackEvent data as Arrow. |
| [`PerfettoTraceWriter`](/docs/modules/traces/api-reference/perfetto-trace-writer) | Encode the package's Perfetto Arrow projection as protobuf. |
| [Chrome trace streaming](/docs/modules/traces/api-reference/chrome-trace-streaming) | Adapt event, Arrow, or JSON chunk streams into live trace snapshots. |

## Quick Start

```typescript
import {load, encode} from '@loaders.gl/core';
import {
  ChromeTraceLoader,
  ChromeTraceWriter,
  PerfettoTraceLoader,
  PerfettoTraceWriter
} from '@loaders.gl/traces';

const chromeEvents = await load('trace.json', ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table'}
});
const chromeJson = await encode(chromeEvents, ChromeTraceWriter);

const perfettoTables = await load('trace.perfetto-trace', PerfettoTraceLoader);
const perfettoProtobuf = await encode(perfettoTables, PerfettoTraceWriter);
```

## Bundle Splitting

The package root exports metadata-only loaders. Async core APIs call each loader's `preload()`
method and dynamically import its parser-bearing implementation. This keeps parser code out of the
initial bundle until parsing starts.

Applications that need parser-bearing loader objects directly can import the implementation
subpaths:

```typescript
import {ChromeTraceLoaderWithParser} from '@loaders.gl/traces/chrome-trace-loader';
import {PerfettoTraceLoaderWithParser} from '@loaders.gl/traces/perfetto-trace-loader';
```

Writers and shared public types remain available from `@loaders.gl/traces`.

## Choosing an API

- Use `load` or `parse` when the complete Arrow result is required before processing starts.
- Use `parseInBatches` when input arrives incrementally or when downstream work can consume Arrow
  batches.
- Use the Chrome streaming helpers when a live consumer expects `TraceStreamChunk` snapshots rather
  than Arrow batches.
- Use `parseChromeTrace(...)` when an application needs semantic Chrome processes, threads, spans,
  counters, flows, and instants instead of raw event rows.
