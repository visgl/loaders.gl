{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# OpenTelemetry OTLP Trace

<TracesDocsTabs active="otlp-trace" />

The OpenTelemetry Protocol (OTLP) represents distributed traces as resources containing
instrumentation scopes, which contain spans. Spans can contain attributes, timestamped events,
links to other spans, and status information. The traces module accepts the standard OTLP
`TracesData` wire shape used by trace export requests.

## Supported Encodings

- Binary protobuf using the OpenTelemetry trace schema
- OTLP protobuf-JSON, including hexadecimal trace and span identifiers and integer enum values
- JSON Lines where each non-empty line is one complete OTLP JSON document

Unknown JSON and protobuf fields are ignored for forward compatibility. The generated protobuf
schema is based on OpenTelemetry Protocol v1.11.0 and retains its Apache-2.0 license.

## Arrow Projection

The loaders normalize the nested OTLP message into five related Arrow tables. Synthetic
`resource_id` and `scope_id` values preserve hierarchy without duplicating resource and scope data
on every span row.

### `resources`

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `resource_id` | `Uint32` | no | Loader-assigned resource key. |
| `schema_url` | `Utf8` | yes | Resource schema URL. |
| `attributes_json` | `Utf8` | no | Protobuf-JSON `KeyValue[]`. |
| `dropped_attributes_count` | `Uint32` | no | Dropped resource attributes. |

### `scopes`

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `scope_id` | `Uint32` | no | Loader-assigned scope key. |
| `resource_id` | `Uint32` | no | Owning resource key. |
| `schema_url` | `Utf8` | yes | Scope schema URL. |
| `name`, `version` | `Utf8` | no | Instrumentation scope identity. |
| `attributes_json` | `Utf8` | no | Protobuf-JSON `KeyValue[]`. |
| `dropped_attributes_count` | `Uint32` | no | Dropped scope attributes. |

### `spans`

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `trace_id` | `FixedSizeBinary(16)` | no | 128-bit trace identifier. |
| `span_id` | `FixedSizeBinary(8)` | no | 64-bit span identifier. |
| `parent_span_id` | `FixedSizeBinary(8)` | yes | Parent identifier, or null for a root span. |
| `resource_id`, `scope_id` | `Uint32` | no | Resource and instrumentation scope keys. |
| `trace_state`, `name`, `status_message` | `Utf8` | no | Span text fields. |
| `flags` | `Uint32` | no | W3C trace flags and OTLP flag bits. |
| `kind`, `status_code` | `Int8` | no | OTLP enum numeric values. |
| `start_time_unix_nano`, `end_time_unix_nano` | `Uint64` | no | Unix epoch nanoseconds. |
| `attributes_json` | `Utf8` | no | Protobuf-JSON `KeyValue[]`. |
| `dropped_attributes_count`, `dropped_events_count`, `dropped_links_count` | `Uint32` | no | OTLP loss counters. |

### `events`

Events are keyed by `trace_id`, `span_id`, and `event_index`. They retain `time_unix_nano`, `name`,
`attributes_json`, and `dropped_attributes_count`.

### `links`

Links are keyed by `parent_trace_id`, `parent_span_id`, and `link_index`. Each row retains the linked
`trace_id`, `span_id`, trace state, flags, attributes, and dropped-attribute count.

## Attribute Fidelity

OTLP `AnyValue` is a tagged union that can contain strings, booleans, integers, doubles, bytes,
arrays, and nested key-value lists. Attribute arrays are stored as protobuf-JSON text instead of a
flattened map so type tags, duplicate keys, ordering, and 64-bit integer strings survive a
load/write round trip.

## Streaming

Binary `parseInBatches` incrementally tokenizes repeated top-level `ResourceSpans` messages. JSON
Lines parsing emits each complete line immediately and safely handles UTF-8 code points split
across byte chunks. Pretty-printed or compact single-document JSON is accepted, but a multi-line
single document must be complete before Arrow batches can be emitted.

Every batch is tagged with `table` and `data`. The configured row limit applies independently to
each logical table. Resource and scope identifiers remain unique across a JSON Lines stream.

## Scope

The projection covers OTLP trace data, not metrics, logs, profiles, or transport envelopes such as
HTTP headers and gRPC framing. Protobuf unknown fields are not retained in Arrow and therefore
cannot be recreated by a writer.
