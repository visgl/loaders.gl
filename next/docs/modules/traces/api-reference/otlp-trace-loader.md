<!-- -->

Traces module · loader API

# OTLP trace loaders

Read binary OTLP protobuf, protobuf-JSON, or JSON Lines into the shared five-table Arrow projection used across the trace module.

[OTLP format](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it returns

## Make trace sources comparable.

Both OTLP input encodings resolve to the same relational Arrow model, so applications can analyze or transform traces without branching on the wire representation.

01

Resources

Service and resource attributes

02

Scopes

Instrumentation scope metadata

03

Spans

Span timing, status, and relationships

04

Events

Events and links as related tables

Detailed guide

## OTLP trace loader reference

The sections below document binary and JSON loaders, parser access, result tables, options, and batch behavior.

`OtlpTraceLoader` reads binary OTLP protobuf. `OtlpTraceJsonLoader` reads OTLP protobuf-JSON and JSON Lines. Both return the same five-table [`OtlpTrace`](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md) Arrow projection.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {OtlpTraceJsonLoader, OtlpTraceLoader} from '@loaders.gl/traces';



const protobufTrace = await load('traces.otlp', OtlpTraceLoader);

const jsonTrace = await load('traces.otlp.json', OtlpTraceJsonLoader);



console.log(protobufTrace.resources);

console.log(protobufTrace.scopes);

console.log(protobufTrace.spans);

console.log(protobufTrace.events);

console.log(protobufTrace.links);
```

The package-root exports are metadata-only and support asynchronous core APIs through `preload()`. For direct access to parser-bearing loaders, use:

```
import {OtlpTraceLoaderWithParser} from '@loaders.gl/traces/otlp-trace-loader';

import {OtlpTraceJsonLoaderWithParser} from '@loaders.gl/traces/otlp-trace-json-loader';
```

## Result[​](#result "Direct link to Result")

```
type OtlpTrace = {

  resources: OtlpResourceArrowTable;

  scopes: OtlpScopeArrowTable;

  spans: OtlpSpanArrowTable;

  events: OtlpEventArrowTable;

  links: OtlpLinkArrowTable;

};
```

## Options[​](#options "Direct link to Options")

| Option                | Type     | Default | Description                                     |
| --------------------- | -------- | ------- | ----------------------------------------------- |
| `otlpTrace.batchSize` | `number` | `4096`  | Maximum rows in each tagged Arrow record batch. |

Invalid, non-finite, or non-positive batch sizes use the default.

## Batched Parsing[​](#batched-parsing "Direct link to Batched Parsing")

```
import {parseInBatches} from '@loaders.gl/core';

import {OtlpTraceLoader} from '@loaders.gl/traces';



const batches = await parseInBatches(byteChunks, OtlpTraceLoader, {

  otlpTrace: {batchSize: 1024}

});



for await (const batch of batches) {

  consume(batch.table, batch.data);

}
```

```
type OtlpTraceBatch = {

  table: 'resources' | 'scopes' | 'spans' | 'events' | 'links';

  data: arrow.RecordBatch;

};
```

The binary loader emits after complete top-level `ResourceSpans` messages arrive. The JSON loader streams newline-delimited documents and falls back to whole-document parsing for pretty JSON.

## Detection[​](#detection "Direct link to Detection")

The protobuf loader recognizes `.otlp` and `.otlp-trace`. The JSON loader recognizes `.otlp.json` and `.otlp.jsonl`. Generic protobuf and JSON MIME types are supported when the loader is selected explicitly; those MIME types alone are not unique enough to identify OTLP among all formats.

## Errors[​](#errors "Direct link to Errors")

Malformed protobuf, truncated final fields, invalid JSON, invalid hexadecimal identifiers, and trace or span identifiers with the wrong fixed width throw parsing errors.
