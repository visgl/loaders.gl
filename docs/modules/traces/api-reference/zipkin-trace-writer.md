{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Zipkin Trace Writer

<TracesDocsTabs active="zipkintracewriter" />

`ZipkinTraceWriter` converts the shared `OtlpTrace` Arrow projection into Zipkin v2 JSON.

```typescript
import {encode, load} from '@loaders.gl/core';
import {ZipkinTraceLoader, ZipkinTraceWriter} from '@loaders.gl/traces';

const trace = await load('trace.zipkin.json', ZipkinTraceLoader);
const spans = await encode(trace, ZipkinTraceWriter, {
  zipkinTrace: {shape: 'spans', space: 2}
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `zipkinTrace.shape` | `'spans' \| 'traces'` | `'spans'` | Emit one span array or a list of arrays grouped by trace ID. |
| `zipkinTrace.space` | `number` | `0` | Spaces used to pretty-print JSON. |

The writer reconstructs local endpoints from resources, remote endpoints from compatibility
attributes, and annotations from OTLP events. See the [Zipkin format page](../formats/zipkin-trace)
for mappings and fidelity limits.
