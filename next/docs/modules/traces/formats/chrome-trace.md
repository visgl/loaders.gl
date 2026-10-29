Performance trace format

![](/images/examples/traces/chrome.svg)Chrome Trace

# Keep the event stream, then make it queryable.

Chrome Trace Event files describe process, thread, duration, instant, counter, and flow events as JSON. loaders.gl normalizes common identifiers and exposes them as Arrow columns without discarding extra fields.

[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace loader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)

![](/images/examples/traces/chrome.svg)Chrome Trace[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

The event model

## Use phase codes to describe time and relationships.

A trace event is small, but its phase, identifiers, timestamps, duration, and arguments give it meaning. The loader makes those fields stable for analysis and preserves data it does not model directly.

01

Phases

Duration, instant, counter, metadata, and flow events

02

Identity

Process, thread, async, and flow identifiers

03

Columns

Stable Arrow fields plus JSON for extra values

04

Round trip

Writer restores metadata and logical event fields

Chrome Trace Event files are JSON objects with a top-level `traceEvents` array. They are produced by Chrome, Chromium-based tools, Node.js, and many profiling libraries.

Detailed guide

## Chrome Trace events and Arrow output

The sections below describe event phases, the Arrow representation, metadata, streaming behavior, and round-trip guarantees.

```
{

  "displayTimeUnit": "us",

  "metadata": {"source": "example"},

  "traceEvents": [

    {"name": "process_name", "ph": "M", "pid": 100, "tid": 0, "args": {"name": "Renderer"}},

    {"name": "ParseHTML", "ph": "X", "ts": 1000, "dur": 3200, "pid": 100, "tid": 1}

  ]

}
```

## Event Model[​](#event-model "Direct link to Event Model")

Every event has a `name` and phase code `ph`. Other fields depend on the phase.

| Common phase  | Meaning                                | Typical fields                 |
| ------------- | -------------------------------------- | ------------------------------ |
| `B`, `E`      | Duration begin and end                 | `ts`, `pid`, `tid`             |
| `X`           | Complete duration                      | `ts`, `dur`, `pid`, `tid`      |
| `i`, `I`      | Instant                                | `ts`, `scope` or `s`           |
| `C`           | Counter sample                         | `ts`, numeric values in `args` |
| `s`, `t`, `f` | Flow start, step, and end              | `ts`, `id` or `bind_id`        |
| `b`, `n`, `e` | Nestable async begin, instant, and end | `ts`, `id`, `scope` or `s`     |
| `M`           | Process or thread metadata             | values in `args`               |

`pid`, `tid`, `id`, and `bind_id` can be numbers or strings in source files. Arrow output normalizes these identifier-like values to UTF-8 strings so values outside JavaScript's safe integer range are not rounded.

## Arrow Representation[​](#arrow-representation "Direct link to Arrow Representation")

Whole-file Arrow output has stable columns for common fields and preserves unmodeled fields in `extraJson`.

| Column               | Arrow type | Nullable | Description                                           |
| -------------------- | ---------- | -------- | ----------------------------------------------------- |
| `name`               | `Utf8`     | no       | Event name.                                           |
| `ph`                 | `Utf8`     | no       | Phase code.                                           |
| `ts`                 | `Float64`  | yes      | Timestamp in the source display unit.                 |
| `pid`, `tid`         | `Utf8`     | yes      | Normalized process and thread identifiers.            |
| `cat`                | `Utf8`     | yes      | Category string.                                      |
| `dur`, `tdur`, `tts` | `Float64`  | yes      | Duration and thread-time values.                      |
| `id`, `bind_id`      | `Utf8`     | yes      | Normalized async or flow identifiers.                 |
| `scope`              | `Utf8`     | yes      | Instant or async scope.                               |
| `args`               | `Utf8`     | yes      | JSON-encoded argument object.                         |
| `extraJson`          | `Utf8`     | yes      | JSON-encoded source fields without dedicated columns. |

Streamed batches use direct JSON-table columns. They expose `s` and `scope` separately and preserve `id2` as JSON text. The Arrow adapter normalizes those batches back to logical Chrome events before they reach live trace sessions.

## File Metadata[​](#file-metadata "Direct link to File Metadata")

`displayTimeUnit` and top-level `metadata` are stored in Arrow schema metadata. The writer and Arrow stream adapter restore them automatically. Writer options can override both values.

## Round-Trip Behavior[​](#round-trip-behavior "Direct link to Round-Trip Behavior")

`ChromeTraceLoader` with `shape: 'arrow-table'` and `ChromeTraceWriter` preserve:

* `args` objects through JSON text
* unknown event fields through `extraJson`
* numeric and string identifier values without numeric coercion
* metadata events that do not have timestamps
* top-level `displayTimeUnit` and `metadata`
* async scope under `s` for phases `b`, `e`, and `n`, and under `scope` for other phases

JSON object key order and insignificant whitespace are not preserved.
