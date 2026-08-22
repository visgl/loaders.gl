import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Chrome Trace

<TracesDocsTabs active="chrome-trace" />

Chrome Trace Event files are JSON objects with a top-level `traceEvents` array. They are produced by
Chrome, Chromium-based tools, Node.js, and many profiling libraries.

```json
{
  "displayTimeUnit": "us",
  "metadata": {"source": "example"},
  "traceEvents": [
    {"name": "process_name", "ph": "M", "pid": 100, "tid": 0, "args": {"name": "Renderer"}},
    {"name": "ParseHTML", "ph": "X", "ts": 1000, "dur": 3200, "pid": 100, "tid": 1}
  ]
}
```

## Event Model

Every event has a `name` and phase code `ph`. Other fields depend on the phase.

| Common phase | Meaning | Typical fields |
| --- | --- | --- |
| `B`, `E` | Duration begin and end | `ts`, `pid`, `tid` |
| `X` | Complete duration | `ts`, `dur`, `pid`, `tid` |
| `i`, `I` | Instant | `ts`, `scope` or `s` |
| `C` | Counter sample | `ts`, numeric values in `args` |
| `s`, `t`, `f` | Flow start, step, and end | `ts`, `id` or `bind_id` |
| `b`, `n`, `e` | Nestable async begin, instant, and end | `ts`, `id`, `scope` or `s` |
| `M` | Process or thread metadata | values in `args` |

`pid`, `tid`, `id`, and `bind_id` can be numbers or strings in source files. Arrow output normalizes
these identifier-like values to UTF-8 strings so values outside JavaScript's safe integer range are
not rounded.

## Arrow Representation

Whole-file Arrow output has stable columns for common fields and preserves unmodeled fields in
`extraJson`.

| Column | Arrow type | Nullable | Description |
| --- | --- | --- | --- |
| `name` | `Utf8` | no | Event name. |
| `ph` | `Utf8` | no | Phase code. |
| `ts` | `Float64` | yes | Timestamp in the source display unit. |
| `pid`, `tid` | `Utf8` | yes | Normalized process and thread identifiers. |
| `cat` | `Utf8` | yes | Category string. |
| `dur`, `tdur`, `tts` | `Float64` | yes | Duration and thread-time values. |
| `id`, `bind_id` | `Utf8` | yes | Normalized async or flow identifiers. |
| `scope` | `Utf8` | yes | Instant or async scope. |
| `args` | `Utf8` | yes | JSON-encoded argument object. |
| `extraJson` | `Utf8` | yes | JSON-encoded source fields without dedicated columns. |

Streamed batches use direct JSON-table columns. They expose `s` and `scope` separately and preserve
`id2` as JSON text. The Arrow adapter normalizes those batches back to logical Chrome events before
they reach live trace sessions.

## File Metadata

`displayTimeUnit` and top-level `metadata` are stored in Arrow schema metadata. The writer and Arrow
stream adapter restore them automatically. Writer options can override both values.

## Round-Trip Behavior

`ChromeTraceLoader` with `shape: 'arrow-table'` and `ChromeTraceWriter` preserve:

- `args` objects through JSON text
- unknown event fields through `extraJson`
- numeric and string identifier values without numeric coercion
- metadata events that do not have timestamps
- top-level `displayTimeUnit` and `metadata`
- async scope under `s` for phases `b`, `e`, and `n`, and under `scope` for other phases

JSON object key order and insignificant whitespace are not preserved.
