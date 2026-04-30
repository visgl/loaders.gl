import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Chrome Trace

<TracesDocsTabs active="chrome-trace" />

Chrome Trace Event files are JSON payloads with a top-level `traceEvents` array. Each event records
fields such as `name`, `ph`, `ts`, `pid`, `tid`, `cat`, `dur`, `args`, and flow or async identifiers.

`ChromeTraceLoader` can keep the validated JSON shape or convert trace events into an Apache Arrow
table for columnar inspection and downstream processing.

## Example

```json
{
  "displayTimeUnit": "us",
  "traceEvents": [
    {"name": "process_name", "ph": "M", "pid": 100, "tid": 0, "args": {"name": "Renderer"}},
    {"name": "ParseHTML", "ph": "X", "ts": 1000, "dur": 3200, "pid": 100, "tid": 1}
  ]
}
```

## Arrow Columns

When `chromeTrace.shape: 'arrow-table'` is selected, the loader emits an Arrow table with stable
columns for common trace fields:

| Column      | Description                                       |
| ----------- | ------------------------------------------------- |
| `name`      | Trace event name.                                 |
| `ph`        | Trace event phase code.                           |
| `ts`        | Timestamp in the file's display time unit.        |
| `pid`       | Process identifier, normalized to string values.  |
| `tid`       | Thread identifier, normalized to string values.   |
| `cat`       | Event category.                                   |
| `dur`       | Complete-event duration.                          |
| `args`      | JSON-encoded event arguments.                     |
| `extraJson` | JSON-encoded fields that do not have fixed columns. |
