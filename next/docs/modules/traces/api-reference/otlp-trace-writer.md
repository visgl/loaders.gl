<!-- -->

Traces module · writer API

# OTLP trace writers

Encode the shared five-table Arrow trace projection as binary OTLP protobuf or standards-compliant OTLP protobuf-JSON.

[OTLP format](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it writes

## Send normalized trace tables back to OTLP systems.

The writers reconstruct resource, scope, span, event, and link messages from the shared Arrow tables while validating identifiers, relationships, and attribute encoding.

01

Input

The five documented Arrow tables

02

Binary

OTLP protobuf bytes

03

JSON

OTLP protobuf-JSON text or bytes

04

Validation

IDs, references, values, and attributes

Detailed guide

## OTLP trace writer reference

The sections below document usage, JSON formatting, validation, and reconstruction behavior.

`OtlpTraceWriter` encodes an `OtlpTrace` Arrow projection as binary protobuf. `OtlpTraceJsonWriter` encodes the same input as standards-compliant OTLP protobuf-JSON.

## Usage[​](#usage "Direct link to Usage")

```
import {encode, load} from '@loaders.gl/core';

import {

  OtlpTraceJsonLoader,

  OtlpTraceJsonWriter,

  OtlpTraceWriter

} from '@loaders.gl/traces';



const trace = await load('traces.otlp.json', OtlpTraceJsonLoader);

const protobuf = await encode(trace, OtlpTraceWriter);

const json = await encode(trace, OtlpTraceJsonWriter, {

  otlpTraceJson: {space: 2}

});
```

The JSON writer emits trace and span IDs as lowercase hexadecimal strings, enum values as integers, and 64-bit integers using protobuf-JSON string representation.

## JSON Writer Options[​](#json-writer-options "Direct link to JSON Writer Options")

| Option                | Type     | Default | Description                                                           |
| --------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `otlpTraceJson.space` | `number` | `0`     | Spaces used to pretty-print JSON. Values are clamped to 0 through 10. |

## Validation[​](#validation "Direct link to Validation")

The writers require the five documented Arrow tables and schemas. They reject missing relational references, malformed attribute JSON, nonnumeric required values, and identifiers whose byte width does not match OTLP. Rows are grouped back into resource, scope, and span messages using their keys.

Unknown protobuf fields discarded during loading cannot be written back. Attribute values remain lossless because their protobuf-JSON tagged representation is retained in Arrow.
