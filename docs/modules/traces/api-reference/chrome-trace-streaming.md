---
title: Chrome Trace Streaming
description: Adapt incremental Chrome trace events, JSON chunks, or Arrow batches into live snapshots.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

<DocPageHeader
  eyebrow="Live trace pipeline"
  title="Publish trace snapshots while the capture is still arriving."
  description="The Chrome trace streaming helpers accept event, JSON, or Arrow chunk streams and adapt them into deterministic `TraceStreamChunk` snapshots. The consumer can render progress without taking ownership of the parser."
  tone="cyan"
  meta={['Chrome Trace', 'Incremental input', 'Snapshot session']}
  links={[
    {label: 'Traces module', to: '/docs/modules/traces'},
    {label: 'Chrome Trace format', to: '/docs/modules/traces/formats/chrome-trace'},
    {label: 'Chrome loader', to: '/docs/modules/traces/api-reference/chrome-trace-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The live trace path"
  title="Accept chunks. Accumulate semantics. Publish a stable view."
  description="The session keeps enough logical state to handle metadata, begin/end pairs, flows, and counters that can affect earlier rows, while publication frequency remains configurable."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Events, JSON chunks, or Arrow batches'},
    {label: 'Accumulate', value: 'One semantic event state for the active stream'},
    {label: 'Publish', value: 'Replacement snapshots at a chosen threshold'},
    {label: 'Consume', value: 'Render updates or await the final snapshot'}
  ]}
/>

<TracesDocsTabs active="streaming" />

The Chrome streaming APIs adapt JSON chunks, Arrow batches, or already parsed events into the
module's `TraceStreamChunk` contract. `TraceStreamSession` remains independent of Arrow and loader
objects.

<ReferenceBoundary
  title="Streaming and snapshot details"
  description="The reference below covers input paths, consumer helpers, options, metadata precedence, publication thresholds, and snapshot semantics."
  tone="cyan"
/>

## Input Paths

| Helper | Input |
| --- | --- |
| `streamChromeTraceEventChunks` | Async events or event arrays. |
| `streamChromeTraceArrowChunks` | Async Chrome Arrow tables or record batches. |
| `streamChromeTraceFileChunks` | Async string, `ArrayBuffer`, or typed-array JSON chunks. |

The file path uses the same JSON-to-Arrow parser as `ChromeTraceLoader`, then adapts Arrow rows back
to logical events. All three paths share the same event accumulator and semantic trace builder.

```typescript
import {createTraceStreamSession, streamChromeTraceFileChunks} from '@loaders.gl/traces';

const session = createTraceStreamSession();

for await (const chunk of streamChromeTraceFileChunks(response.body, {
  name: 'Live capture',
  batchSize: 1024,
  publishEveryEvents: 2048
})) {
  session.applyChunk(chunk);
  const snapshot = session.publishSnapshot();
  render(snapshot);
}
```

## Consumer Helpers

The matching `consumeChromeTraceEventStream`, `consumeChromeTraceArrowStream`, and
`consumeChromeTraceFileStream` helpers apply every generated chunk to a supplied session and return
the latest published snapshot.

```typescript
import {consumeChromeTraceArrowStream, createTraceStreamSession} from '@loaders.gl/traces';

const session = createTraceStreamSession({name: 'Imported trace'});
const unsubscribe = session.subscribe(snapshot => render(snapshot));

const finalSnapshot = await consumeChromeTraceArrowStream(session, arrowBatches, {
  publishEveryEvents: 500
});

unsubscribe();
session.close();
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | `'Chrome Trace Live Stream'` | Snapshot name. |
| `displayTimeUnit` | `string` | discovered metadata | Initial or fallback display unit. |
| `metadata` | `Record<string, unknown>` | discovered metadata | Initial or fallback top-level metadata. |
| `batchSize` | `number` | parser default | Events per JSON-to-Arrow parser batch. |
| `publishEveryEvents` | `number` | `256` | New events required before publishing a replacement chunk. |
| `maxLength` | `number` | `1000` | Maximum events structurally validated during semantic assembly. |

Metadata discovered on Arrow schemas takes precedence over fallback `displayTimeUnit` and
`metadata` options.

## Snapshot Semantics

Each emitted chunk is a full replacement snapshot assembled from every event received so far. This
keeps live consumers deterministic when begin/end pairs, metadata, flows, or counters affect earlier
semantic structures. The accumulator therefore retains logical events for the duration of the
stream. `publishEveryEvents` controls rebuild frequency, not retained event count.

The final accumulated snapshot is emitted even when the last group contains fewer events than the
publish threshold.
