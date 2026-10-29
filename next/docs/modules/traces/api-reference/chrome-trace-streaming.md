Live trace pipeline

![](/images/examples/traces/chrome.svg)Chrome Trace

# Publish trace snapshots while the capture is still arriving.

The Chrome trace streaming helpers accept event, JSON, or Arrow chunk streams and adapt them into deterministic `TraceStreamChunk` snapshots. The consumer can render progress without taking ownership of the parser.

[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace format](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[Chrome loader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)

The live trace path

## Accept chunks. Accumulate semantics. Publish a stable view.

The session keeps enough logical state to handle metadata, begin/end pairs, flows, and counters that can affect earlier rows, while publication frequency remains configurable.

01

Input

Events, JSON chunks, or Arrow batches

02

Accumulate

One semantic event state for the active stream

03

Publish

Replacement snapshots at a chosen threshold

04

Consume

Render updates or await the final snapshot

![](/images/examples/traces/chrome.svg)Chrome Trace[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

The Chrome streaming APIs adapt JSON chunks, Arrow batches, or already parsed events into the module's `TraceStreamChunk` contract. `TraceStreamSession` remains independent of Arrow and loader objects.

Detailed guide

## Streaming and snapshot details

The reference below covers input paths, consumer helpers, options, metadata precedence, publication thresholds, and snapshot semantics.

## Input Paths[​](#input-paths "Direct link to Input Paths")

| Helper                         | Input                                                    |
| ------------------------------ | -------------------------------------------------------- |
| `streamChromeTraceEventChunks` | Async events or event arrays.                            |
| `streamChromeTraceArrowChunks` | Async Chrome Arrow tables or record batches.             |
| `streamChromeTraceFileChunks`  | Async string, `ArrayBuffer`, or typed-array JSON chunks. |

The file path uses the same JSON-to-Arrow parser as `ChromeTraceLoader`, then adapts Arrow rows back to logical events. All three paths share the same event accumulator and semantic trace builder.

```
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

## Consumer Helpers[​](#consumer-helpers "Direct link to Consumer Helpers")

The matching `consumeChromeTraceEventStream`, `consumeChromeTraceArrowStream`, and `consumeChromeTraceFileStream` helpers apply every generated chunk to a supplied session and return the latest published snapshot.

```
import {consumeChromeTraceArrowStream, createTraceStreamSession} from '@loaders.gl/traces';



const session = createTraceStreamSession({name: 'Imported trace'});

const unsubscribe = session.subscribe(snapshot => render(snapshot));



const finalSnapshot = await consumeChromeTraceArrowStream(session, arrowBatches, {

  publishEveryEvents: 500

});



unsubscribe();

session.close();
```

## Options[​](#options "Direct link to Options")

| Option               | Type                      | Default                      | Description                                                     |
| -------------------- | ------------------------- | ---------------------------- | --------------------------------------------------------------- |
| `name`               | `string`                  | `'Chrome Trace Live Stream'` | Snapshot name.                                                  |
| `displayTimeUnit`    | `string`                  | discovered metadata          | Initial or fallback display unit.                               |
| `metadata`           | `Record<string, unknown>` | discovered metadata          | Initial or fallback top-level metadata.                         |
| `batchSize`          | `number`                  | parser default               | Events per JSON-to-Arrow parser batch.                          |
| `publishEveryEvents` | `number`                  | `256`                        | New events required before publishing a replacement chunk.      |
| `maxLength`          | `number`                  | `1000`                       | Maximum events structurally validated during semantic assembly. |

Metadata discovered on Arrow schemas takes precedence over fallback `displayTimeUnit` and `metadata` options.

## Snapshot Semantics[​](#snapshot-semantics "Direct link to Snapshot Semantics")

Each emitted chunk is a full replacement snapshot assembled from every event received so far. This keeps live consumers deterministic when begin/end pairs, metadata, flows, or counters affect earlier semantic structures. The accumulator therefore retains logical events for the duration of the stream. `publishEveryEvents` controls rebuild frequency, not retained event count.

The final accumulated snapshot is emitted even when the last group contains fewer events than the publish threshold.
