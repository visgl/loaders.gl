import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Chrome Trace Streaming

<TracesDocsTabs active="streaming" />

The Chrome streaming APIs adapt JSON chunks, Arrow batches, or already parsed events into the
module's `TraceStreamChunk` contract. `TraceStreamSession` remains independent of Arrow and loader
objects.

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
