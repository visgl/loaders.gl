{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# OTLP Trace Loaders

<TracesDocsTabs active="otlptraceloader" />

`OtlpTraceLoader` reads binary OTLP protobuf. `OtlpTraceJsonLoader` reads OTLP protobuf-JSON and
JSON Lines. Both return the same five-table [`OtlpTrace`](../formats/otlp-trace) Arrow projection.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {OtlpTraceJsonLoader, OtlpTraceLoader} from '@loaders.gl/traces';

const protobufTrace = await load('traces.otlp', OtlpTraceLoader);
const jsonTrace = await load('traces.otlp.json', OtlpTraceJsonLoader);

console.log(protobufTrace.resources);
console.log(protobufTrace.scopes);
console.log(protobufTrace.spans);
console.log(protobufTrace.events);
console.log(protobufTrace.links);
```

The package-root exports are metadata-only and support asynchronous core APIs through `preload()`.
For direct access to parser-bearing loaders, use:

```typescript
import {OtlpTraceLoaderWithParser} from '@loaders.gl/traces/otlp-trace-loader';
import {OtlpTraceJsonLoaderWithParser} from '@loaders.gl/traces/otlp-trace-json-loader';
```

## Result

```typescript
type OtlpTrace = {
  resources: OtlpResourceArrowTable;
  scopes: OtlpScopeArrowTable;
  spans: OtlpSpanArrowTable;
  events: OtlpEventArrowTable;
  links: OtlpLinkArrowTable;
};
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `otlpTrace.batchSize` | `number` | `4096` | Maximum rows in each tagged Arrow record batch. |

Invalid, non-finite, or non-positive batch sizes use the default.

## Batched Parsing

```typescript
import {parseInBatches} from '@loaders.gl/core';
import {OtlpTraceLoader} from '@loaders.gl/traces';

const batches = await parseInBatches(byteChunks, OtlpTraceLoader, {
  otlpTrace: {batchSize: 1024}
});

for await (const batch of batches) {
  consume(batch.table, batch.data);
}
```

```typescript
type OtlpTraceBatch = {
  table: 'resources' | 'scopes' | 'spans' | 'events' | 'links';
  data: arrow.RecordBatch;
};
```

The binary loader emits after complete top-level `ResourceSpans` messages arrive. The JSON loader
streams newline-delimited documents and falls back to whole-document parsing for pretty JSON.

## Detection

The protobuf loader recognizes `.otlp` and `.otlp-trace`. The JSON loader recognizes `.otlp.json`
and `.otlp.jsonl`. Generic protobuf and JSON MIME types are supported when the loader is selected
explicitly; those MIME types alone are not unique enough to identify OTLP among all formats.

## Errors

Malformed protobuf, truncated final fields, invalid JSON, invalid hexadecimal identifiers, and
trace or span identifiers with the wrong fixed width throw parsing errors.
