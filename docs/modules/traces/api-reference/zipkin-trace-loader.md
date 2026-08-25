{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Zipkin Trace Loader

<TracesDocsTabs active="zipkintraceloader" />

`ZipkinTraceLoader` reads Zipkin v2 JSON and JSON Lines into the five-table
[`OtlpTrace`](../formats/otlp-trace) Arrow projection.

```typescript
import {load} from '@loaders.gl/core';
import {ZipkinTraceLoader} from '@loaders.gl/traces';

const trace = await load('trace.zipkin.json', ZipkinTraceLoader);
console.log(trace.spans);
console.log(trace.events);
```

The package-root loader is metadata-only. The parser-bearing loader is available from:

```typescript
import {ZipkinTraceLoaderWithParser} from '@loaders.gl/traces/zipkin-trace-loader';
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `zipkinTrace.batchSize` | `number` | `4096` | Maximum rows in each tagged Arrow record batch. |

JSON Lines documents emit incrementally through `parseInBatches`. Pretty or multi-line JSON falls
back to complete-document parsing. The loader recognizes `.zipkin.json` and `.zipkin.jsonl`.

Malformed shapes, invalid hexadecimal IDs, negative values, and unsafe numeric timestamps throw
parsing errors. Large integer timestamps can be supplied as strings without losing precision.
