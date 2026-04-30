# @loaders.gl/traces

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

The `@loaders.gl/traces` module hosts trace format parsers for Chrome Trace and Perfetto Trace data.

## Included APIs

- `ChromeTraceLoader` for full-file and batched Chrome trace parsing
- `parseChromeTrace(...)` for semantic Chrome trace assembly
- `streamChromeTraceEventChunks(...)`, `streamChromeTraceArrowChunks(...)`, and `streamChromeTraceFileChunks(...)`
- `createTraceStreamSession(...)` and the Chrome trace stream consumers

For documentation please visit the [website](https://loaders.gl).
