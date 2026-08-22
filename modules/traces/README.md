<!-- SPDX-License-Identifier: MIT -->

# @loaders.gl/traces

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

The `@loaders.gl/traces` module hosts trace format parsers for Chrome Trace, Perfetto Trace,
OpenTelemetry OTLP, Jaeger, and Zipkin trace data.

## Included APIs

- `ChromeTraceLoader` for Chrome Trace Event JSON to Arrow conversion
- `PerfettoTraceLoader` for Perfetto protobuf to Arrow conversion
- `OtlpTraceLoader` and `OtlpTraceJsonLoader` for OTLP protobuf, JSON, and JSON Lines to Arrow
- `JaegerTraceLoader` for Jaeger Query API, archive, span-array, and JSON Lines data to Arrow
- `ZipkinTraceLoader` for Zipkin v2 span arrays, trace lists, and JSON Lines data to Arrow
- Chrome Trace, Perfetto, OTLP, Jaeger, and Zipkin writers for reverse format encoding
- `parseChromeTrace(...)` for semantic Chrome trace assembly
- `streamChromeTraceEventChunks(...)`, `streamChromeTraceArrowChunks(...)`, and `streamChromeTraceFileChunks(...)`
- `createTraceStreamSession(...)` and the Chrome trace stream consumers

Streamed `ChromeTraceLoader` Arrow parsing uses the fast JSON table parser over `traceEvents`.
It emits direct Chrome trace event columns, converts numeric id-like fields to Utf8, and preserves
nested `args` and `id2` JSON payloads as source-faithful Utf8 text.

`PerfettoTraceLoader` returns typed Arrow tables for stable TrackEvent tracks, slices, processes,
and threads. Its batched API incrementally tokenizes TracePackets and emits tagged Arrow record
batches so consumers can distinguish the logical tables.

The OTLP loaders return typed `resources`, `scopes`, `spans`, `events`, and `links` Arrow tables.
Their batched APIs emit tagged, bounded record batches and incrementally parse top-level protobuf
`ResourceSpans` messages or newline-delimited JSON documents.

The Jaeger loader maps processes, spans, logs, and references into the same five OTLP-compatible
Arrow tables. Its JSON Lines path emits incrementally, and `JaegerTraceWriter` can produce a Query
API response or raw span array with embedded processes.

The Zipkin loader maps local endpoints, spans, annotations, remote endpoints, and tags into the
same Arrow tables. `ZipkinTraceWriter` emits a span array or a list grouped by trace ID.

For documentation please visit the [website](https://loaders.gl).
