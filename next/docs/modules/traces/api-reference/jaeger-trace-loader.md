<!-- -->

Traces module · loader API

# JaegerTraceLoader

Read Jaeger query responses, archives, embedded span arrays, and JSON Lines into the shared five-table OTLP Arrow projection.

[Jaeger format](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it returns

## Normalize a provider-specific trace into shared tables.

JaegerTraceLoader keeps the Jaeger input boundary separate from the application model, returning the same relational Arrow projection used by OTLP and other trace formats.

01

Resources

Service and process context

02

Scopes

Instrumentation scope metadata

03

Spans

Timed operations and relationships

04

Events

Span events and links

Detailed guide

## JaegerTraceLoader reference

The sections below document usage, parser access, options, batches, and the normalized trace result.

`JaegerTraceLoader` reads Jaeger query, archive, embedded-process span-array, and JSON Lines data. It returns the five-table [`OtlpTrace`](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md) Arrow projection shared with the OTLP loaders.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {JaegerTraceLoader} from '@loaders.gl/traces';



const trace = await load('trace.jaeger.json', JaegerTraceLoader);



console.log(trace.resources);

console.log(trace.scopes);

console.log(trace.spans);

console.log(trace.events);

console.log(trace.links);
```

The package-root export is metadata-only. Direct parser access is available from the implementation subpath:

```
import {JaegerTraceLoaderWithParser} from '@loaders.gl/traces/jaeger-trace-loader';
```

## Options[​](#options "Direct link to Options")

| Option                  | Type     | Default | Description                                     |
| ----------------------- | -------- | ------- | ----------------------------------------------- |
| `jaegerTrace.batchSize` | `number` | `4096`  | Maximum rows in each tagged Arrow record batch. |

## Batched Parsing[​](#batched-parsing "Direct link to Batched Parsing")

```
import {parseInBatches} from '@loaders.gl/core';

import {JaegerTraceLoader} from '@loaders.gl/traces';



const batches = await parseInBatches(chunks, JaegerTraceLoader, {

  jaegerTrace: {batchSize: 1024}

});



for await (const batch of batches) {

  consume(batch.table, batch.data);

}
```

JSON Lines documents are parsed and emitted incrementally. Pretty-printed JSON and multi-line Query API responses fall back to whole-document parsing because JSON object boundaries are not line delimited.

## Detection and Errors[​](#detection-and-errors "Direct link to Detection and Errors")

The loader recognizes `.jaeger.json` and `.jaeger.jsonl`. Generic JSON MIME types are supported when the loader is selected explicitly. Invalid shapes, malformed hexadecimal IDs, and unsafe or negative timestamps throw parsing errors.
