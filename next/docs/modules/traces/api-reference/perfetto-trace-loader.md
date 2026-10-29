Traces module · loader API

![](/next/images/format-logos/perfetto-logo.png)Perfetto

# PerfettoTraceLoader

Read stable Perfetto TrackEvent protobuf data into four typed Arrow tables for tracks, slices, processes, and threads.

[Perfetto format](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

![](/next/images/format-logos/perfetto-logo.png)Perfetto[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it returns

## Turn a trace envelope into tables you can query.

The loader separates the stable TrackEvent projection into related Arrow tables, keeping identifiers and timing values typed for analysis and round-trip writing.

01

Tracks

Track descriptors and associations

02

Slices

Timed and instant events

03

Processes

Process descriptors

04

Threads

Thread descriptors and ownership

Detailed guide

## PerfettoTraceLoader reference

The sections below document usage, the Arrow result, numeric fidelity, and supported trace projection.

`PerfettoTraceLoader` reads stable Perfetto TrackEvent protobuf data into four typed Apache Arrow tables. See the [Perfetto format page](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md) for the supported projection and limitations.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {PerfettoTraceLoader} from '@loaders.gl/traces';



const trace = await load('trace.perfetto-trace', PerfettoTraceLoader);



console.log(trace.tracks);

console.log(trace.slices);

console.log(trace.processes);

console.log(trace.threads);
```

The package-root export is metadata-only and supports async core APIs through `preload()`. Import `PerfettoTraceLoaderWithParser` from `@loaders.gl/traces/perfetto-trace-loader` when direct access to `parseSync` or the parser-bearing loader object is required.

## Result[​](#result "Direct link to Result")

```
type PerfettoTrace = {

  tracks: PerfettoTrackArrowTable;

  slices: PerfettoSliceArrowTable;

  processes: PerfettoProcessArrowTable;

  threads: PerfettoThreadArrowTable;

};
```

Unsigned 64-bit UUIDs, timestamps, and durations remain Arrow `Uint64` values and are exposed as JavaScript `bigint` values by Apache Arrow.

## Options[​](#options "Direct link to Options")

| Option                    | Type     | Default | Description                                                         |
| ------------------------- | -------- | ------- | ------------------------------------------------------------------- |
| `perfettoTrace.batchSize` | `number` | `4096`  | Packet drain threshold and maximum rows in an emitted record batch. |

Invalid, non-finite, or non-positive batch sizes use the default.

## Batched Parsing[​](#batched-parsing "Direct link to Batched Parsing")

`parseInBatches` yields tagged `PerfettoTraceBatch` objects because the four logical tables have different Arrow schemas.

```
import {parseInBatches} from '@loaders.gl/core';

import {PerfettoTraceLoader} from '@loaders.gl/traces';



const batches = await parseInBatches(byteChunks, PerfettoTraceLoader, {

  perfettoTrace: {batchSize: 1024}

});



for await (const batch of batches) {

  switch (batch.table) {

    case 'tracks':

    case 'slices':

    case 'processes':

    case 'threads':

      consume(batch.table, batch.data);

      break;

  }

}
```

```
type PerfettoTraceBatch = {

  table: 'tracks' | 'slices' | 'processes' | 'threads';

  data: arrow.RecordBatch;

};
```

Batches follow packet order. A descriptor can therefore be emitted before a later update to the same UUID, PID, or TID. Consumers building a current-state view should replace descriptor rows by their identifier. Completed slices are emitted after their matching end event is received.

## Detection[​](#detection "Direct link to Detection")

The loader recognizes `.perfetto-trace` and `.pftrace` extensions and the `application/x-perfetto-trace` MIME type. Binary sniffing requires a complete outer packet and a recognized nested `TracePacket` field; a generic protobuf payload beginning with byte `0x0a` is not accepted solely on that prefix.

## Errors[​](#errors "Direct link to Errors")

Malformed varints, unsupported protobuf wire types, and truncated final packets throw parsing errors. Unknown well-formed packet fields are skipped.
