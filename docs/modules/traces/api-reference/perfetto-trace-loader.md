import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# PerfettoTraceLoader

<TracesDocsTabs active="perfettotraceloader" />

`PerfettoTraceLoader` loads binary Perfetto protobuf traces into typed Apache Arrow tables.

```typescript
import {load} from '@loaders.gl/core';
import {PerfettoTraceLoader} from '@loaders.gl/traces';

const trace = await load(url, PerfettoTraceLoader);
console.log(trace.tracks, trace.slices, trace.processes, trace.threads);
```

## Options

| Option                    | Type     | Default | Description                                  |
| ------------------------- | -------- | ------- | -------------------------------------------- |
| `perfettoTrace.batchSize` | `number` | `4096`  | Maximum rows per tagged Arrow record batch. |

`parseInBatches` yields `{table, data}` objects, where `table` identifies the logical Perfetto
table and `data` is an Arrow `RecordBatch`.
