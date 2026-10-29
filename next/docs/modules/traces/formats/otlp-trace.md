<!-- -->

Distributed trace format

# Keep OpenTelemetry’s hierarchy when traces enter the browser.

OTLP carries resources, instrumentation scopes, spans, events, links, status, and typed attributes. loaders.gl preserves that hierarchy through related Arrow tables and supports binary and JSON-oriented encodings.

[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[OTLP loader](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)

The OTLP path

## Decode the envelope. Preserve resources. Analyze spans as tables.

The projection keeps resource and scope identity separate from repeated span rows, while retaining typed attributes and nanosecond timestamps for downstream analysis.

01

Input

OTLP protobuf, protobuf-JSON, or JSON Lines

02

Hierarchy

Resources → scopes → spans → events and links

03

Output

Five related Arrow tables

04

Stream

Repeated protobuf messages or complete JSON Lines

[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

The OpenTelemetry Protocol (OTLP) represents distributed traces as resources containing instrumentation scopes, which contain spans. Spans can contain attributes, timestamped events, links to other spans, and status information. The traces module accepts the standard OTLP `TracesData` wire shape used by trace export requests.

Detailed guide

## OTLP projection and fidelity details

The reference below covers encodings, related Arrow tables, typed attributes, streaming, timestamps, and the supported scope.

## Supported Encodings[​](#supported-encodings "Direct link to Supported Encodings")

* Binary protobuf using the OpenTelemetry trace schema
* OTLP protobuf-JSON, including hexadecimal trace and span identifiers and integer enum values
* JSON Lines where each non-empty line is one complete OTLP JSON document

Unknown JSON and protobuf fields are ignored for forward compatibility. The generated protobuf schema is based on OpenTelemetry Protocol v1.11.0 and retains its Apache-2.0 license.

## Arrow Projection[​](#arrow-projection "Direct link to Arrow Projection")

The loaders normalize the nested OTLP message into five related Arrow tables. Synthetic `resource_id` and `scope_id` values preserve hierarchy without duplicating resource and scope data on every span row.

### `resources`[​](#resources "Direct link to resources")

| Column                     | Arrow type | Nullable | Description                   |
| -------------------------- | ---------- | -------- | ----------------------------- |
| `resource_id`              | `Uint32`   | no       | Loader-assigned resource key. |
| `schema_url`               | `Utf8`     | yes      | Resource schema URL.          |
| `attributes_json`          | `Utf8`     | no       | Protobuf-JSON `KeyValue[]`.   |
| `dropped_attributes_count` | `Uint32`   | no       | Dropped resource attributes.  |

### `scopes`[​](#scopes "Direct link to scopes")

| Column                     | Arrow type | Nullable | Description                     |
| -------------------------- | ---------- | -------- | ------------------------------- |
| `scope_id`                 | `Uint32`   | no       | Loader-assigned scope key.      |
| `resource_id`              | `Uint32`   | no       | Owning resource key.            |
| `schema_url`               | `Utf8`     | yes      | Scope schema URL.               |
| `name`, `version`          | `Utf8`     | no       | Instrumentation scope identity. |
| `attributes_json`          | `Utf8`     | no       | Protobuf-JSON `KeyValue[]`.     |
| `dropped_attributes_count` | `Uint32`   | no       | Dropped scope attributes.       |

### `spans`[​](#spans "Direct link to spans")

| Column                                                                    | Arrow type            | Nullable | Description                                 |
| ------------------------------------------------------------------------- | --------------------- | -------- | ------------------------------------------- |
| `trace_id`                                                                | `FixedSizeBinary(16)` | no       | 128-bit trace identifier.                   |
| `span_id`                                                                 | `FixedSizeBinary(8)`  | no       | 64-bit span identifier.                     |
| `parent_span_id`                                                          | `FixedSizeBinary(8)`  | yes      | Parent identifier, or null for a root span. |
| `resource_id`, `scope_id`                                                 | `Uint32`              | no       | Resource and instrumentation scope keys.    |
| `trace_state`, `name`, `status_message`                                   | `Utf8`                | no       | Span text fields.                           |
| `flags`                                                                   | `Uint32`              | no       | W3C trace flags and OTLP flag bits.         |
| `kind`, `status_code`                                                     | `Int8`                | no       | OTLP enum numeric values.                   |
| `start_time_unix_nano`, `end_time_unix_nano`                              | `Uint64`              | no       | Unix epoch nanoseconds.                     |
| `attributes_json`                                                         | `Utf8`                | no       | Protobuf-JSON `KeyValue[]`.                 |
| `dropped_attributes_count`, `dropped_events_count`, `dropped_links_count` | `Uint32`              | no       | OTLP loss counters.                         |

### `events`[​](#events "Direct link to events")

Events are keyed by `trace_id`, `span_id`, and `event_index`. They retain `time_unix_nano`, `name`, `attributes_json`, and `dropped_attributes_count`.

### `links`[​](#links "Direct link to links")

Links are keyed by `parent_trace_id`, `parent_span_id`, and `link_index`. Each row retains the linked `trace_id`, `span_id`, trace state, flags, attributes, and dropped-attribute count.

## Attribute Fidelity[​](#attribute-fidelity "Direct link to Attribute Fidelity")

OTLP `AnyValue` is a tagged union that can contain strings, booleans, integers, doubles, bytes, arrays, and nested key-value lists. Attribute arrays are stored as protobuf-JSON text instead of a flattened map so type tags, duplicate keys, ordering, and 64-bit integer strings survive a load/write round trip.

## Streaming[​](#streaming "Direct link to Streaming")

Binary `parseInBatches` incrementally tokenizes repeated top-level `ResourceSpans` messages. JSON Lines parsing emits each complete line immediately and safely handles UTF-8 code points split across byte chunks. Pretty-printed or compact single-document JSON is accepted, but a multi-line single document must be complete before Arrow batches can be emitted.

Every batch is tagged with `table` and `data`. The configured row limit applies independently to each logical table. Resource and scope identifiers remain unique across a JSON Lines stream.

## Scope[​](#scope "Direct link to Scope")

The projection covers OTLP trace data, not metrics, logs, profiles, or transport envelopes such as HTTP headers and gRPC framing. Protobuf unknown fields are not retained in Arrow and therefore cannot be recreated by a writer.
