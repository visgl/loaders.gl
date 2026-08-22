{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Jaeger Trace Loader

<TracesDocsTabs active="jaegertraceloader" />

`JaegerTraceLoader` reads Jaeger query, archive, embedded-process span-array, and JSON Lines data.
It returns the five-table [`OtlpTrace`](../formats/otlp-trace) Arrow projection shared with the OTLP
loaders.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {JaegerTraceLoader} from '@loaders.gl/traces';

const trace = await load('trace.jaeger.json', JaegerTraceLoader);

console.log(trace.resources);
console.log(trace.scopes);
console.log(trace.spans);
console.log(trace.events);
console.log(trace.links);
```

The package-root export is metadata-only. Direct parser access is available from the implementation
subpath:

```typescript
import {JaegerTraceLoaderWithParser} from '@loaders.gl/traces/jaeger-trace-loader';
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `jaegerTrace.batchSize` | `number` | `4096` | Maximum rows in each tagged Arrow record batch. |

## Batched Parsing

```typescript
import {parseInBatches} from '@loaders.gl/core';
import {JaegerTraceLoader} from '@loaders.gl/traces';

const batches = await parseInBatches(chunks, JaegerTraceLoader, {
  jaegerTrace: {batchSize: 1024}
});

for await (const batch of batches) {
  consume(batch.table, batch.data);
}
```

JSON Lines documents are parsed and emitted incrementally. Pretty-printed JSON and multi-line Query
API responses fall back to whole-document parsing because JSON object boundaries are not line
delimited.

## Detection and Errors

The loader recognizes `.jaeger.json` and `.jaeger.jsonl`. Generic JSON MIME types are supported
when the loader is selected explicitly. Invalid shapes, malformed hexadecimal IDs, and unsafe or
negative timestamps throw parsing errors.
