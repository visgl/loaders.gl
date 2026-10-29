Performance trace format

![](/next/images/format-logos/perfetto-logo.png)Perfetto

# Turn a trace stream into tables you can inspect.

The Perfetto loader reads protobuf Trace packets, tracks sequence state and descriptors, and projects supported TrackEvent data into typed Apache Arrow tables for browser-side analysis.

[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)[Perfetto loader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)

![](/next/images/format-logos/perfetto-logo.png)Perfetto[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

The trace projection

## Preserve the event relationships that matter.

Perfetto traces contain more than isolated events. The projection keeps tracks, processes, threads, timestamps, and open slices connected while exposing a compact table-oriented result.

01

Input

TracePacket messages in a protobuf envelope

02

State

Descriptors, interned names, and sequence resets

03

Output

Tracks, slices, processes, and threads tables

04

Stream

Incremental packet parsing with bounded state

Perfetto's native format is a protobuf `Trace` envelope containing repeated `TracePacket` messages. The traces module projects Perfetto's stable TrackEvent model into typed Apache Arrow tables.

Detailed guide

## Perfetto projection and boundaries

The sections below document supported TrackEvent fields, Arrow table schemas, timestamp semantics, streaming behavior, and unsupported packet families.

## Supported TrackEvent Data[​](#supported-trackevent-data "Direct link to Supported TrackEvent Data")

The loader handles:

* `TrackDescriptor` messages, including parent tracks, process ownership, thread ownership, and counter-track classification
* embedded and legacy standalone process and thread descriptors
* packet-sequence `TrackEventDefaults`, including default track UUIDs
* per-sequence interned event names and incremental-state resets
* TrackEvent slice begin/end pairs and instant events
* legacy `B`, `E`, `I`, `i`, and complete `X` phases represented inside TrackEvent
* events that begin and end in different packet sequences but refer to the same global track UUID

Track descriptors are keyed by globally unique UUID. Process and thread tables retain the latest descriptor for each numeric PID or TID.

## Arrow Tables[​](#arrow-tables "Direct link to Arrow Tables")

### `tracks`[​](#tracks "Direct link to tracks")

| Column              | Arrow type | Nullable | Description                                 |
| ------------------- | ---------- | -------- | ------------------------------------------- |
| `track_uuid`        | `Uint64`   | no       | Globally unique Perfetto track UUID.        |
| `parent_track_uuid` | `Uint64`   | yes      | Parent track UUID.                          |
| `type`              | `Utf8`     | no       | `process`, `thread`, `counter`, or `slice`. |
| `name`              | `Utf8`     | yes      | Latest track name.                          |
| `pid`               | `Int32`    | yes      | Associated process ID.                      |
| `tid`               | `Int32`    | yes      | Associated thread ID.                       |

### `slices`[​](#slices "Direct link to slices")

| Column       | Arrow type | Nullable | Description                               |
| ------------ | ---------- | -------- | ----------------------------------------- |
| `track_uuid` | `Uint64`   | no       | Track containing the event.               |
| `ts`         | `Uint64`   | no       | Raw `TracePacket.timestamp`.              |
| `dur`        | `Uint64`   | no       | End minus begin; zero for instant events. |
| `name`       | `Utf8`     | no       | Inline or interned event name.            |

### `processes`[​](#processes "Direct link to processes")

| Column | Arrow type | Nullable | Description   |
| ------ | ---------- | -------- | ------------- |
| `pid`  | `Int32`    | no       | Process ID.   |
| `name` | `Utf8`     | yes      | Process name. |

### `threads`[​](#threads "Direct link to threads")

| Column | Arrow type | Nullable | Description        |
| ------ | ---------- | -------- | ------------------ |
| `tid`  | `Int32`    | no       | Thread ID.         |
| `pid`  | `Int32`    | yes      | Owning process ID. |
| `name` | `Utf8`     | yes      | Thread name.       |

## Timestamp Semantics[​](#timestamp-semantics "Direct link to Timestamp Semantics")

The loader preserves raw unsigned packet timestamps and durations. Perfetto timestamps use nanoseconds by default, but traces can define other clock domains, units, and delta encodings. This projection does not currently normalize clock snapshots or convert timestamps between clock domains. Consumers that require globally normalized trace time should use Perfetto Trace Processor.

## Streaming Envelope[​](#streaming-envelope "Direct link to Streaming Envelope")

`parseInBatches` incrementally tokenizes repeated `TracePacket` fields. Input chunks can split a protobuf tag, length varint, packet payload, or any combination of them. The parser retains only the incomplete packet, incremental sequence state, descriptors, and currently open slices; it does not buffer the complete input file before emitting Arrow batches.

## Scope and Limitations[​](#scope-and-limitations "Direct link to Scope and Limitations")

The four-table result is a TrackEvent projection, not a replacement for Perfetto Trace Processor. Packet families such as ftrace, process stats, heap profiles, GPU events, counters, state events, clock snapshots, compressed packet groups, custom extensions, debug annotations, and flow metadata are skipped unless represented by the supported TrackEvent fields above.

`PerfettoTraceWriter` writes this projection back as canonical protobuf packets. Data skipped by the loader cannot be recreated by the writer.
