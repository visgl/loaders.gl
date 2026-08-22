import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Perfetto Trace

<TracesDocsTabs active="perfetto-trace" />

Perfetto trace files are protobuf messages containing repeated trace packets. The traces module
supports process and thread descriptors, track descriptors, completed slices, and instant events.

`PerfettoTraceLoader` converts the protobuf payload into four Apache Arrow tables: `tracks`,
`slices`, `processes`, and `threads`. Uint64 identifiers and nanosecond timestamps remain Arrow
Uint64 values. `PerfettoTraceWriter` encodes the same table set back into a canonical Perfetto
protobuf envelope.
