# @loaders.gl/traces

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

The `@loaders.gl/traces` module hosts trace format parsers for Chrome Trace and Perfetto Trace data.

## Included APIs

- `ChromeTraceLoader` for Chrome Trace Event JSON to Arrow conversion
- `PerfettoTraceLoader` for Perfetto protobuf to Arrow conversion
- `ChromeTraceWriter` and `PerfettoTraceWriter` for reverse format encoding
- `parseChromeTrace(...)` for semantic Chrome trace assembly
- `streamChromeTraceEventChunks(...)`, `streamChromeTraceArrowChunks(...)`, and `streamChromeTraceFileChunks(...)`
- `createTraceStreamSession(...)` and the Chrome trace stream consumers

Streamed `ChromeTraceLoader` Arrow parsing uses the fast JSON table parser over `traceEvents`.
It emits direct Chrome trace event columns, converts numeric id-like fields to Utf8, and preserves
nested `args` and `id2` JSON payloads as source-faithful Utf8 text.

`PerfettoTraceLoader` returns typed Arrow tables for tracks, slices, processes, and threads. Its
batched API emits tagged Arrow record batches so consumers can distinguish the logical tables.

For documentation please visit the [website](https://loaders.gl).
