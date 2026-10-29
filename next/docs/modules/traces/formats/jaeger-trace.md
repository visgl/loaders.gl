<!-- -->

Distributed trace format

# Bring Jaeger traces into a typed table path.

Jaeger JSON is a practical interchange format for spans, process descriptors, logs, tags, and references. loaders.gl normalizes it into the shared trace tables used by OTLP and Zipkin adapters.

[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)[OTLP format](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[Jaeger loader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

Jaeger JSON represents distributed spans with microsecond timestamps, typed tags, process descriptors, logs, and `CHILD_OF` or `FOLLOWS_FROM` references. Jaeger Query API responses wrap traces in a `data` array, while archive and interchange tools commonly use individual trace objects or arrays of spans with embedded process descriptors.

Detailed guide

## Jaeger shape and fidelity details

The reference below covers accepted JSON shapes, Arrow projection, timestamp conversion, tags, references, and round-trip limitations.

## Supported Shapes[​](#supported-shapes "Direct link to Supported Shapes")

The loader accepts:

* Jaeger Query API responses with `data`, `total`, `limit`, `offset`, and `errors` fields
* individual `{traceID, spans, processes}` trace objects
* arrays of trace objects
* arrays of spans carrying embedded `process` objects
* JSON Lines containing one supported object or array per non-empty line

## Arrow Projection[​](#arrow-projection "Direct link to Arrow Projection")

Jaeger data uses the same [`OtlpTrace`](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md) projection as the OTLP loaders:

| Jaeger concept                        | Arrow table or field            |
| ------------------------------------- | ------------------------------- |
| process service name and tags         | `resources.attributes_json`     |
| instrumentation source                | one `scopes` row named `jaeger` |
| span                                  | `spans`                         |
| log                                   | `events`                        |
| first same-trace `CHILD_OF` reference | `spans.parent_span_id`          |
| remaining references                  | `links`                         |

Jaeger's 64-bit trace IDs are left-padded with zeroes to the 128-bit OTLP width. Existing 128-bit IDs are retained. Span IDs already have the shared 64-bit width.

Typed Jaeger tags are stored as OTLP `AnyValue` JSON in `attributes_json`. The `span.kind` tag also sets the OTLP span-kind enum. A truthy `error` tag sets OTLP error status. Original tags remain in the attribute list so they can be written back.

## Time Units[​](#time-units "Direct link to Time Units")

Jaeger `startTime`, `duration`, and log `timestamp` values are integer microseconds. The loader converts them to unsigned nanoseconds. Values must be non-negative JavaScript safe integers.

The writer converts nanoseconds back to microseconds by integer division. Sub-microsecond precision cannot be represented by Jaeger JSON and is truncated.

## Fidelity[​](#fidelity "Direct link to Fidelity")

The writer reconstructs parent references and links. Link attributes created by the loader retain the original Jaeger reference type; other OTLP links become `FOLLOWS_FROM`. OTLP scope metadata, trace state, dropped-item counters, status messages, and attributes that cannot be represented by Jaeger's scalar tag types are not losslessly expressible in Jaeger JSON.
