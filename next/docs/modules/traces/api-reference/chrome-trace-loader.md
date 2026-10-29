Traces module · loader API

![](/images/examples/traces/chrome.svg)Chrome Trace

# ChromeTraceLoader

Read Chrome Trace Event JSON as a validated file container or as a typed Arrow event table for analysis and transformation.

[Chrome trace format](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

![](/images/examples/traces/chrome.svg)Chrome Trace[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it returns

## Keep the trace document—or work with typed events.

ChromeTraceLoader returns typed Arrow events by default, preserving container metadata on the schema. Explicit JSON output retains the validated source container.

01

JSON

Validated container with passthrough fields

02

Arrow

Typed event table with metadata

03

Batches

Bounded events for streaming reads

04

Compatibility

Package-root preload and parser subpath

Detailed guide

## ChromeTraceLoader reference

The sections below document usage, return types, options, validation, and parser boundaries.

`ChromeTraceLoader` loads Chrome Trace Event JSON. It returns an Apache Arrow event table by default, or a validated JSON container when `chromeTrace.shape` is `json`.

## Usage[​](#usage "Direct link to Usage")

```
import {load, parse} from '@loaders.gl/core';

import {ChromeTraceLoader} from '@loaders.gl/traces';



const eventTable = await load('trace.json', ChromeTraceLoader);

const traceFile = await load('trace.json', ChromeTraceLoader, {

  chromeTrace: {shape: 'json'}

});

const parsed = await parse(jsonText, ChromeTraceLoader);
```

The package-root export is metadata-only. Async core APIs preload the parser from `@loaders.gl/traces/chrome-trace-loader`. Synchronous code that needs a parser-bearing loader must import `ChromeTraceLoaderWithParser` from that subpath.

## Return Types[​](#return-types "Direct link to Return Types")

| Shape         | Return value                                                                   |
| ------------- | ------------------------------------------------------------------------------ |
| `json`        | `ChromeTraceFileSchema`, preserving top-level and event passthrough fields.    |
| `arrow-table` | `ChromeTraceEventArrowTable`, with file metadata attached to the Arrow schema. |

## Options[​](#options "Direct link to Options")

| Option                  | Type                      | Default         | Description                                                                     |
| ----------------------- | ------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `chromeTrace.shape`     | `'json' \| 'arrow-table'` | `'arrow-table'` | Whole-file result shape.                                                        |
| `chromeTrace.batchSize` | `number`                  | `256`           | Maximum events per streamed Arrow record batch.                                 |
| `maxLength`             | `number`                  | `1000`          | Maximum number of events structurally validated; all events are still returned. |

The legacy top-level `shape` option is also accepted and takes precedence if supplied. Prefer `chromeTrace.shape` in new code. Arrow results retain this module's native Apache Arrow `Table` API (`table.numRows`), not a loaders.gl `{shape, data}` wrapper.

## Batched Parsing[​](#batched-parsing "Direct link to Batched Parsing")

`parseInBatches` defaults to Arrow and yields `ChromeTraceEventArrowRecordBatch` values with the same lossless schema used by whole-file parsing. Explicit JSON batch output is not supported.

```
import {parseInBatches} from '@loaders.gl/core';

import {ChromeTraceLoader} from '@loaders.gl/traces';



const batches = await parseInBatches(chunks, ChromeTraceLoader, {

  chromeTrace: {shape: 'arrow-table', batchSize: 1024}

});



for await (const batch of batches) {

  console.log(batch.numRows);

}
```

The tokenizer accepts string, `ArrayBuffer`, and typed-array chunks at arbitrary UTF-8 and JSON boundaries. `displayTimeUnit` and top-level `metadata` are attached to emitted schema metadata once they are available.

Use [Chrome trace streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md) when the destination expects live `TraceStreamChunk` snapshots instead of Arrow record batches.
