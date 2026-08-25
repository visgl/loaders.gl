import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Perfetto Trace

<TracesDocsTabs active="perfetto-trace" />

Perfetto's native format is a protobuf `Trace` envelope containing repeated `TracePacket` messages.
The traces module projects Perfetto's stable TrackEvent model into typed Apache Arrow tables.

## Supported TrackEvent Data

The loader handles:

- `TrackDescriptor` messages, including parent tracks, process ownership, thread ownership, and
  counter-track classification
- embedded and legacy standalone process and thread descriptors
- packet-sequence `TrackEventDefaults`, including default track UUIDs
- per-sequence interned event names and incremental-state resets
- TrackEvent slice begin/end pairs and instant events
- legacy `B`, `E`, `I`, `i`, and complete `X` phases represented inside TrackEvent
- events that begin and end in different packet sequences but refer to the same global track UUID

Track descriptors are keyed by globally unique UUID. Process and thread tables retain the latest
descriptor for each numeric PID or TID.

## Arrow Tables

### `tracks`

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `track_uuid` | `Uint64` | no | Globally unique Perfetto track UUID. |
| `parent_track_uuid` | `Uint64` | yes | Parent track UUID. |
| `type` | `Utf8` | no | `process`, `thread`, `counter`, or `slice`. |
| `name` | `Utf8` | yes | Latest track name. |
| `pid` | `Int32` | yes | Associated process ID. |
| `tid` | `Int32` | yes | Associated thread ID. |

### `slices`

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `track_uuid` | `Uint64` | no | Track containing the event. |
| `ts` | `Uint64` | no | Raw `TracePacket.timestamp`. |
| `dur` | `Uint64` | no | End minus begin; zero for instant events. |
| `name` | `Utf8` | no | Inline or interned event name. |

### `processes`

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `pid` | `Int32` | no | Process ID. |
| `name` | `Utf8` | yes | Process name. |

### `threads`

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `tid` | `Int32` | no | Thread ID. |
| `pid` | `Int32` | yes | Owning process ID. |
| `name` | `Utf8` | yes | Thread name. |

## Timestamp Semantics

The loader preserves raw unsigned packet timestamps and durations. Perfetto timestamps use
nanoseconds by default, but traces can define other clock domains, units, and delta encodings. This
projection does not currently normalize clock snapshots or convert timestamps between clock
domains. Consumers that require globally normalized trace time should use Perfetto Trace Processor.

## Streaming Envelope

`parseInBatches` incrementally tokenizes repeated `TracePacket` fields. Input chunks can split a
protobuf tag, length varint, packet payload, or any combination of them. The parser retains only the
incomplete packet, incremental sequence state, descriptors, and currently open slices; it does not
buffer the complete input file before emitting Arrow batches.

## Scope and Limitations

The four-table result is a TrackEvent projection, not a replacement for Perfetto Trace Processor.
Packet families such as ftrace, process stats, heap profiles, GPU events, counters, state events,
clock snapshots, compressed packet groups, custom extensions, debug annotations, and flow metadata
are skipped unless represented by the supported TrackEvent fields above.

`PerfettoTraceWriter` writes this projection back as canonical protobuf packets. Data skipped by the
loader cannot be recreated by the writer.
