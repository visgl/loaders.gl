{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Jaeger Trace Writer

<TracesDocsTabs active="jaegertracewriter" />

`JaegerTraceWriter` converts the five-table `OtlpTrace` Arrow projection into Jaeger JSON.

## Usage

```typescript
import {encode, load} from '@loaders.gl/core';
import {JaegerTraceLoader, JaegerTraceWriter} from '@loaders.gl/traces';

const trace = await load('trace.jaeger.json', JaegerTraceLoader);
const queryResponse = await encode(trace, JaegerTraceWriter, {
  jaegerTrace: {shape: 'query', space: 2}
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `jaegerTrace.shape` | `'query' \| 'spans'` | `'query'` | Emit a Query API response or a raw span array with embedded processes. |
| `jaegerTrace.space` | `number` | `0` | Spaces used to pretty-print JSON. Values are clamped by `JSON.stringify`. |

The Query API shape groups spans by trace ID and emits process descriptors in each trace's
`processes` map. The span-array shape copies each referenced process onto its span, which is useful
for archive and interchange tools that do not consume the Query API envelope.

The writer validates the normalized Arrow relationships through the shared OTLP reconstruction
path before converting them. See the [Jaeger format page](../formats/jaeger-trace) for mappings and
known fidelity limits.
