<!-- -->

Distributed trace format

# Use Zipkin JSON at the edge, then analyze it like OTLP.

Zipkin v2 is compact and widely deployed. loaders.gl maps its spans, endpoints, annotations, and tags into the shared five-table Arrow projection while making precision and fidelity limits explicit.

[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)[OTLP format](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[Zipkin loader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)

The Zipkin path

## Read spans and annotations. Put them beside the other trace dialects.

Zipkin’s smaller model is enough for many compatibility boundaries. The shared projection makes its data consumable by the same table-oriented tools without claiming lossless equivalence.

01

Input

Zipkin v2 span arrays, trace lists, or JSON Lines

02

Map

Endpoints, tags, annotations, and references

03

Output

Resources, scopes, spans, events, and links tables

04

Fidelity

Microseconds and string tags remain explicit limits

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

Zipkin v2 JSON represents distributed spans with microsecond timestamps, local and remote network endpoints, string tags, and timestamped annotations. It is used by the Zipkin v2 HTTP API and by many tracing SDK exporters.

Detailed guide

## Zipkin projection and fidelity details

The reference below covers accepted shapes, Arrow projection, timestamp conversion, endpoint mapping, and lossy fields.

## Supported Shapes[​](#supported-shapes "Direct link to Supported Shapes")

The loader accepts a single span, a span array such as the `/api/v2/spans` request and `/api/v2/trace/{traceId}` response, a nested list of traces, or JSON Lines containing any of these shapes.

## Arrow Projection[​](#arrow-projection "Direct link to Arrow Projection")

Zipkin uses the shared five-table [`OtlpTrace`](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md) projection:

| Zipkin concept                               | Arrow table or field            |
| -------------------------------------------- | ------------------------------- |
| local endpoint                               | `resources.attributes_json`     |
| instrumentation source                       | one `scopes` row named `zipkin` |
| span and parent ID                           | `spans`                         |
| annotation                                   | `events`                        |
| remote endpoint, tags, `debug`, and `shared` | `spans.attributes_json`         |

Zipkin's 64-bit trace IDs are left-padded to the 128-bit OTLP width. Its server, client, producer, and consumer kinds map directly to OTLP enum values. A non-empty `error` tag sets OTLP error status while remaining available as an attribute.

## Time and Fidelity[​](#time-and-fidelity "Direct link to Time and Fidelity")

Zipkin timestamps and durations are integer microseconds and may be JSON numbers or unsigned integer strings. They are converted to nanoseconds in Arrow. Writing truncates sub-microsecond precision because Zipkin cannot represent it.

Zipkin tags are strings. OTLP scalar attributes are stringified when written as Zipkin tags; arrays, maps, bytes, scope metadata, links, dropped-item counters, and trace state do not have lossless Zipkin v2 equivalents.
