---
title: ChromeTraceLoader
description: Read Chrome Trace Event JSON as a validated document or Arrow event table.
hide_title: true
page_style: designed
---

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Traces module · loader API"
  title="ChromeTraceLoader"
  description="Read Chrome Trace Event JSON as a validated file container or as a typed Arrow event table for analysis and transformation."
  tone="violet"
  meta={['Chrome Trace Event', 'JSON or Arrow', 'Batch validation']}
  links={[
    {label: 'Chrome trace format', to: '/docs/modules/traces/formats/chrome-trace'},
    {label: 'ChromeTraceWriter', to: '/docs/modules/traces/api-reference/chrome-trace-writer'},
    {label: 'Traces module', to: '/docs/modules/traces'}
  ]}
/>

<TracesDocsTabs active="chrometraceloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Keep the trace document—or work with typed events."
  description="ChromeTraceLoader preserves the top-level JSON container by default and can project events into Arrow columns when the next step is filtering, joining, or batch processing."
  tone="violet"
  items={[
    {label: 'JSON', value: 'Validated container with passthrough fields'},
    {label: 'Arrow', value: 'Typed event table with metadata'},
    {label: 'Batches', value: 'Bounded events for streaming reads'},
    {label: 'Compatibility', value: 'Package-root preload and parser subpath'}
  ]}
/>

<ReferenceBoundary
  title="ChromeTraceLoader reference"
  description="The sections below document usage, return types, options, validation, and parser boundaries."
  tone="violet"
/>

`ChromeTraceLoader` loads Chrome Trace Event JSON. It returns a validated JSON container by default
or an Apache Arrow event table when `chromeTrace.shape` is `arrow-table`.

## Usage

```typescript
import {load, parse} from '@loaders.gl/core';
import {ChromeTraceLoader} from '@loaders.gl/traces';

const traceFile = await load('trace.json', ChromeTraceLoader);
const eventTable = await load('trace.json', ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table'}
});
const parsed = await parse(jsonText, ChromeTraceLoader);
```

The package-root export is metadata-only. Async core APIs preload the parser from
`@loaders.gl/traces/chrome-trace-loader`. Synchronous code that needs a parser-bearing loader must
import `ChromeTraceLoaderWithParser` from that subpath.

## Return Types

| Shape | Return value |
| --- | --- |
| `json` | `ChromeTraceFileSchema`, preserving top-level and event passthrough fields. |
| `arrow-table` | `ChromeTraceEventArrowTable`, with file metadata attached to the Arrow schema. |

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `chromeTrace.shape` | `'json' \| 'arrow-table'` | `'json'` | Whole-file result shape. |
| `chromeTrace.batchSize` | `number` | `256` | Maximum events per streamed Arrow record batch. |
| `maxLength` | `number` | `1000` | Maximum number of events structurally validated; all events are still returned. |

The legacy top-level `shape` option is also accepted. Prefer `chromeTrace.shape` in new code.

## Batched Parsing

`parseInBatches` requires `chromeTrace.shape: 'arrow-table'` and yields
`ChromeTraceEventArrowRecordBatch` values with the same lossless schema used by whole-file parsing.

```typescript
import {parseInBatches} from '@loaders.gl/core';
import {ChromeTraceLoader} from '@loaders.gl/traces';

const batches = await parseInBatches(chunks, ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table', batchSize: 1024}
});

for await (const batch of batches) {
  console.log(batch.numRows);
}
```

The tokenizer accepts string, `ArrayBuffer`, and typed-array chunks at arbitrary UTF-8 and JSON
boundaries. `displayTimeUnit` and top-level `metadata` are attached to emitted schema metadata once
they are available.

Use [Chrome trace streaming](./chrome-trace-streaming) when the destination expects live
`TraceStreamChunk` snapshots instead of Arrow record batches.
