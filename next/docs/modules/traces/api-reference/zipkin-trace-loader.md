<!-- -->

Traces module · loader API

# ZipkinTraceLoader

Read Zipkin v2 JSON and JSON Lines into the shared five-table OTLP Arrow projection for common trace analysis.

[Zipkin format](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it returns

## Use Zipkin input with the shared trace model.

The loader accepts complete JSON or line-oriented input and produces the same relational Arrow tables used by OTLP and Jaeger adapters.

01

Input

Zipkin v2 JSON or JSON Lines

02

Output

The five-table OtlpTrace projection

03

Streaming

Incremental JSON Lines parsing

04

Fidelity

Large identifiers preserved safely

Detailed guide

## ZipkinTraceLoader reference

The sections below document usage, parser access, options, JSON Lines behavior, and validation.

`ZipkinTraceLoader` reads Zipkin v2 JSON and JSON Lines into the five-table [`OtlpTrace`](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md) Arrow projection.

```
import {load} from '@loaders.gl/core';

import {ZipkinTraceLoader} from '@loaders.gl/traces';



const trace = await load('trace.zipkin.json', ZipkinTraceLoader);

console.log(trace.spans);

console.log(trace.events);
```

The package-root loader is metadata-only. The parser-bearing loader is available from:

```
import {ZipkinTraceLoaderWithParser} from '@loaders.gl/traces/zipkin-trace-loader';
```

## Options[​](#options "Direct link to Options")

| Option                  | Type     | Default | Description                                     |
| ----------------------- | -------- | ------- | ----------------------------------------------- |
| `zipkinTrace.batchSize` | `number` | `4096`  | Maximum rows in each tagged Arrow record batch. |

JSON Lines documents emit incrementally through `parseInBatches`. Pretty or multi-line JSON falls back to complete-document parsing. The loader recognizes `.zipkin.json` and `.zipkin.jsonl`.

Malformed shapes, invalid hexadecimal IDs, negative values, and unsafe numeric timestamps throw parsing errors. Large integer timestamps can be supplied as strings without losing precision.
