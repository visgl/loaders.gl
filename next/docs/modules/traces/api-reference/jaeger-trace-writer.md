<!-- -->

Traces module · writer API

# JaegerTraceWriter

Convert the shared five-table OTLP Arrow projection into Jaeger query responses or span-array JSON.

[Jaeger format](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it writes

## Export normalized trace data to Jaeger’s shapes.

JaegerTraceWriter reconstructs provider-facing process and span relationships from the shared Arrow tables, with an option for the Query API envelope or raw span arrays.

01

Input

The five-table OTLP Arrow projection

02

Query

Trace IDs grouped with process maps

03

Spans

Raw spans with embedded processes

04

Validation

Relationships checked before encoding

Detailed guide

## JaegerTraceWriter reference

The sections below document usage, output shapes, formatting options, and reconstruction behavior.

`JaegerTraceWriter` converts the five-table `OtlpTrace` Arrow projection into Jaeger JSON.

## Usage[​](#usage "Direct link to Usage")

```
import {encode, load} from '@loaders.gl/core';

import {JaegerTraceLoader, JaegerTraceWriter} from '@loaders.gl/traces';



const trace = await load('trace.jaeger.json', JaegerTraceLoader);

const queryResponse = await encode(trace, JaegerTraceWriter, {

  jaegerTrace: {shape: 'query', space: 2}

});
```

## Options[​](#options "Direct link to Options")

| Option              | Type                 | Default   | Description                                                               |
| ------------------- | -------------------- | --------- | ------------------------------------------------------------------------- |
| `jaegerTrace.shape` | `'query' \| 'spans'` | `'query'` | Emit a Query API response or a raw span array with embedded processes.    |
| `jaegerTrace.space` | `number`             | `0`       | Spaces used to pretty-print JSON. Values are clamped by `JSON.stringify`. |

The Query API shape groups spans by trace ID and emits process descriptors in each trace's `processes` map. The span-array shape copies each referenced process onto its span, which is useful for archive and interchange tools that do not consume the Query API envelope.

The writer validates the normalized Arrow relationships through the shared OTLP reconstruction path before converting them. See the [Jaeger format page](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md) for mappings and known fidelity limits.
