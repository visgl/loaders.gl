<!-- -->

Traces module · writer API

# ZipkinTraceWriter

Convert the shared five-table OTLP Arrow projection into Zipkin v2 span arrays or trace-grouped JSON.

[Zipkin format](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it writes

## Export shared trace data to Zipkin clients.

ZipkinTraceWriter reconstructs endpoints, annotations, and span relationships from the normalized Arrow tables, with either span-array or trace-grouped output.

01

Input

The five-table OtlpTrace projection

02

Spans

A flat array of Zipkin spans

03

Traces

Arrays grouped by trace ID

04

Context

Local, remote, and event annotations

Detailed guide

## ZipkinTraceWriter reference

The sections below document usage, output shapes, formatting options, reconstruction, and fidelity limits.

`ZipkinTraceWriter` converts the shared `OtlpTrace` Arrow projection into Zipkin v2 JSON.

```
import {encode, load} from '@loaders.gl/core';

import {ZipkinTraceLoader, ZipkinTraceWriter} from '@loaders.gl/traces';



const trace = await load('trace.zipkin.json', ZipkinTraceLoader);

const spans = await encode(trace, ZipkinTraceWriter, {

  zipkinTrace: {shape: 'spans', space: 2}

});
```

| Option              | Type                  | Default   | Description                                                  |
| ------------------- | --------------------- | --------- | ------------------------------------------------------------ |
| `zipkinTrace.shape` | `'spans' \| 'traces'` | `'spans'` | Emit one span array or a list of arrays grouped by trace ID. |
| `zipkinTrace.space` | `number`              | `0`       | Spaces used to pretty-print JSON.                            |

The writer reconstructs local endpoints from resources, remote endpoints from compatibility attributes, and annotations from OTLP events. See the [Zipkin format page](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md) for mappings and fidelity limits.
