<!-- -->

Performance data module

# Put trace formats on a common table path.

The traces module reads browser, system, and distributed-tracing formats and projects them into typed Arrow tables. That makes trace data available to the same filtering, analysis, and writer workflows as other columnar data.

[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Perfetto format](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)

![](/images/examples/traces/chrome.svg)Chrome Trace[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

A common trace boundary

## Different event models. One typed table path.

The input formats keep their own vocabulary. The application can work with named Arrow tables for filtering, analysis, visualization, and writing.

Trace inputs

[Chrome Traceevents and metadata](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[PerfettoTrackEvent protobuf](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[OTLP / Jaeger / Zipkindistributed spans](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)

normaliz&#x65;**→**

Application boundary

### Arrow trace tables

Named tables preserve the important entities without forcing analysis code to parse every source dialect.

timestampdurationnametraceIdspanIdattributes

us&#x65;**→**

What stays portable

Filter and scancolumns, predicates, and limits

Build a timelineslices, spans, processes, and threads

Write or exchangeArrow tables and record batches

The normalized schema is intentionally explicit: source-specific fields remain available where they matter, while shared operations can target the table boundary.

The trace path

## Different trace dialects, predictable tables.

Each source format has its own event model. The module preserves its important entities while normalizing them into named Arrow tables that analysis code can consume consistently.

01

Browser traces

Chrome Trace Event JSON and Arrow

02

System traces

Perfetto TrackEvent protobuf tables

03

Distributed traces

OTLP, Jaeger, and Zipkin projections

04

Write

Re-encode compatible Arrow tables for supported formats

The `@loaders.gl/traces` module reads and writes performance trace formats without requiring a specific visualization framework. Chrome Trace Event JSON can be loaded as validated JSON or Apache Arrow. Stable Perfetto TrackEvent protobuf data is projected into four typed Arrow tables. OpenTelemetry OTLP traces in protobuf, protobuf-JSON, or JSON Lines are normalized into five relational Arrow tables. Jaeger and Zipkin JSON use the same five-table projection for direct interoperability.

Detailed guide

## Trace format and table details

The sections below compare formats, loaders, writers, streaming results, and the normalized Arrow table contracts.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/traces apache-arrow
```

## Formats and APIs[​](#formats-and-apis "Direct link to Formats and APIs")

| Format                                                                                              | Loader result                                                      | Batched result                        | Writer input                      |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- | --------------------------------- |
| [Chrome Trace Event JSON](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md) | Validated JSON or one Arrow event table                            | Arrow event record batches            | Arrow event table or record batch |
| [Perfetto protobuf](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)     | `tracks`, `slices`, `processes`, and `threads` Arrow tables        | Tagged `{table, data}` record batches | The same four Arrow tables        |
| [OpenTelemetry OTLP traces](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md) | `resources`, `scopes`, `spans`, `events`, and `links` Arrow tables | Tagged `{table, data}` record batches | The same five Arrow tables        |
| [Jaeger JSON traces](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)      | The five OTLP-compatible Arrow tables                              | Tagged `{table, data}` record batches | The same five Arrow tables        |
| [Zipkin v2 JSON traces](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)   | The five OTLP-compatible Arrow tables                              | Tagged `{table, data}` record batches | The same five Arrow tables        |

## Choosing a Trace Format[​](#choosing-a-trace-format "Direct link to Choosing a Trace Format")

There is no single best trace format. Chrome Trace and Perfetto are timeline-oriented formats for profiling one machine or runtime. OTLP, Jaeger, and Zipkin are span-oriented formats for tracing requests across services.

| Format                                                                                              | Best fit                                                                  | Advantages                                                                                                                                                             | Tradeoffs                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Chrome Trace Event JSON](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md) | Application, browser, Node.js, and accelerator timeline profiling         | Simple JSON; broad profiler and viewer support; flexible duration, instant, counter, async, flow, and metadata events; easy to inspect and generate                    | Verbose at scale; loosely specified extension fields; source-defined time units; no standard resource, service, trace-ID, or span-link model                                         |
| [Perfetto protobuf](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)     | High-volume operating-system and application timelines                    | Compact binary encoding; nanosecond-oriented timestamps; hierarchical tracks; incremental packets and interned data; strong Perfetto tooling                           | Not human-readable; full format is very broad; clocks may require normalization; this module intentionally supports the stable TrackEvent projection rather than every packet family |
| [OpenTelemetry OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)        | New vendor-neutral distributed tracing pipelines and archival interchange | Standard resource, scope, span, event, link, status, typed-attribute, and nanosecond models; efficient protobuf plus debuggable JSON; strongest cross-vendor semantics | More structured and complex than Zipkin or Jaeger JSON; not a native CPU/GPU scheduling timeline; protobuf is not directly readable                                                  |
| [Jaeger JSON](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)             | Existing Jaeger Query API, archive, and migration workflows               | Human-readable; explicit process descriptors, typed scalar tags, logs, and references; straightforward compatibility with Jaeger deployments                           | Microsecond precision; legacy model has fewer semantics than OTLP; arrays, maps, scope metadata, status detail, and some links cannot round-trip losslessly                          |
| [Zipkin v2 JSON](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)          | Lightweight Zipkin HTTP API integrations and legacy interoperability      | Small conceptual model; easy JSON; familiar client/server endpoints, annotations, and tags; simple to produce                                                          | Microsecond precision; string-only tags; no native instrumentation scopes, typed attributes, span links, or OTLP-style loss counters                                                 |

### Recommendations[​](#recommendations "Direct link to Recommendations")

* Use **OTLP protobuf** as the default for new distributed tracing systems. Choose OTLP JSON when human inspection matters more than payload size, and JSON Lines when traces must be emitted or processed incrementally.
* Use **Perfetto** for compact, high-volume system or application timelines that will be analyzed with Perfetto-compatible tooling. Use Trace Processor instead of this module when analysis depends on ftrace, heap profiles, SQL metrics, or cross-clock normalization.
* Use **Chrome Trace** when producers and consumers already use the Trace Event ecosystem, or when a transparent JSON timeline is more valuable than compact storage. It is usually the easiest format for custom profiler instrumentation.
* Use **Jaeger JSON** or **Zipkin JSON** primarily at compatibility boundaries. They are appropriate when integrating with their native APIs, but OTLP retains more information as a long-term canonical representation.
* Do not convert a system timeline to a distributed-span format merely for uniformity. Tracks, counters, flows, scheduler events, and clock-domain information do not map cleanly to spans.
* Expect conversions from OTLP to Jaeger or Zipkin to be lossy. Review each writer's fidelity section before using a converted file for archival or compliance purposes.

### Quick Decisions[​](#quick-decisions "Direct link to Quick Decisions")

| Requirement                             | Recommended format      |
| --------------------------------------- | ----------------------- |
| Vendor-neutral service tracing          | OTLP protobuf           |
| Readable service-trace exchange         | OTLP JSON               |
| Incremental service-trace JSON          | OTLP JSON Lines         |
| Compact system timeline                 | Perfetto protobuf       |
| Custom profiler JSON or browser tooling | Chrome Trace Event JSON |
| Existing Jaeger API or archive          | Jaeger JSON             |
| Existing Zipkin v2 API                  | Zipkin v2 JSON          |

| API                                                                                                                                | Purpose                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`ChromeTraceLoader`](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)                       | Load Chrome Trace JSON as JSON or Arrow.                                 |
| [`ChromeTraceWriter`](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)                       | Reconstruct Chrome Trace JSON from Arrow events.                         |
| [`PerfettoTraceLoader`](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)                   | Load stable Perfetto TrackEvent data as Arrow.                           |
| [`PerfettoTraceWriter`](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)                   | Encode the package's Perfetto Arrow projection as protobuf.              |
| [`OtlpTraceLoader` and `OtlpTraceJsonLoader`](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md) | Load OTLP protobuf, protobuf-JSON, or JSON Lines as Arrow.               |
| [`OtlpTraceWriter` and `OtlpTraceJsonWriter`](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md) | Encode the OTLP Arrow projection as protobuf or protobuf-JSON.           |
| [`JaegerTraceLoader`](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)                       | Load Jaeger Query API, archive, span-array, or JSON Lines data as Arrow. |
| [`JaegerTraceWriter`](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)                       | Encode the shared OTLP Arrow projection as Jaeger JSON.                  |
| [`ZipkinTraceLoader`](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)                       | Load Zipkin v2 span arrays, trace lists, or JSON Lines as Arrow.         |
| [`ZipkinTraceWriter`](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)                       | Encode the shared OTLP Arrow projection as Zipkin v2 JSON.               |
| [Chrome trace streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)                 | Adapt event, Arrow, or JSON chunk streams into live trace snapshots.     |

## Quick Start[​](#quick-start "Direct link to Quick Start")

```
import {load, encode} from '@loaders.gl/core';

import {

  ChromeTraceLoader,

  ChromeTraceWriter,

  JaegerTraceLoader,

  JaegerTraceWriter,

  OtlpTraceJsonLoader,

  OtlpTraceLoader,

  OtlpTraceWriter,

  PerfettoTraceLoader,

  PerfettoTraceWriter,

  ZipkinTraceLoader,

  ZipkinTraceWriter

} from '@loaders.gl/traces';



const chromeEvents = await load('trace.json', ChromeTraceLoader, {

  chromeTrace: {shape: 'arrow-table'}

});

const chromeJson = await encode(chromeEvents, ChromeTraceWriter);



const perfettoTables = await load('trace.perfetto-trace', PerfettoTraceLoader);

const perfettoProtobuf = await encode(perfettoTables, PerfettoTraceWriter);



const otlpTables = await load('traces.otlp', OtlpTraceLoader);

const otlpProtobuf = await encode(otlpTables, OtlpTraceWriter);



const otlpJsonTables = await load('traces.otlp.json', OtlpTraceJsonLoader);



const jaegerTables = await load('trace.jaeger.json', JaegerTraceLoader);

const jaegerJson = await encode(jaegerTables, JaegerTraceWriter);



const zipkinTables = await load('trace.zipkin.json', ZipkinTraceLoader);

const zipkinJson = await encode(zipkinTables, ZipkinTraceWriter);
```

## Bundle Splitting[​](#bundle-splitting "Direct link to Bundle Splitting")

The package root exports metadata-only loaders. Async core APIs call each loader's `preload()` method and dynamically import its parser-bearing implementation. This keeps parser code out of the initial bundle until parsing starts.

Applications that need parser-bearing loader objects directly can import the implementation subpaths:

```
import {ChromeTraceLoaderWithParser} from '@loaders.gl/traces/chrome-trace-loader';

import {PerfettoTraceLoaderWithParser} from '@loaders.gl/traces/perfetto-trace-loader';

import {OtlpTraceLoaderWithParser} from '@loaders.gl/traces/otlp-trace-loader';

import {OtlpTraceJsonLoaderWithParser} from '@loaders.gl/traces/otlp-trace-json-loader';

import {JaegerTraceLoaderWithParser} from '@loaders.gl/traces/jaeger-trace-loader';

import {ZipkinTraceLoaderWithParser} from '@loaders.gl/traces/zipkin-trace-loader';
```

Writers and shared public types remain available from `@loaders.gl/traces`.

## Choosing an API[​](#choosing-an-api "Direct link to Choosing an API")

* Use `load` or `parse` when the complete Arrow result is required before processing starts.
* Use `parseInBatches` when input arrives incrementally or when downstream work can consume Arrow batches.
* Use the Chrome streaming helpers when a live consumer expects `TraceStreamChunk` snapshots rather than Arrow batches.
* Use `parseChromeTrace(...)` when an application needs semantic Chrome processes, threads, spans, counters, flows, and instants instead of raw event rows.

## Worker parsing[​](#worker-parsing "Direct link to Worker parsing")

All six trace loaders support browser workers for atomic parsing and `parseInBatches`: `ChromeTraceLoader`, `PerfettoTraceLoader`, `OtlpTraceLoader`, `OtlpTraceJsonLoader`, `JaegerTraceLoader`, and `ZipkinTraceLoader`. They share the published `trace-worker.js` bundle.

Workers transfer owned Arrow column buffers through the existing Arrow column utilities, without IPC encoding. Atomic results retain their Arrow table or logical-table collection shape. Streaming results retain real Arrow record batches and their logical-table tags, including bigint timestamps, schemas, and metadata. Each parser keeps its state for the entire stream; a format that collects a JSON document still needs that complete document before emitting batches.

```
import {parseInBatches} from '@loaders.gl/core';

import {OtlpTraceJsonLoader} from '@loaders.gl/traces';



const batches = await parseInBatches(response, OtlpTraceJsonLoader, {

  core: {worker: true},

  otlpTrace: {batchSize: 1000}

});

for await (const {table, data} of batches) {

  consume(table, data);

}
```

Chrome trace whole-file `shape: 'json'` converts hydrated Arrow events into the validated JSON container on the caller, preserving passthrough event and container fields. Chrome trace batches continue to require `shape: 'arrow-table'`. Use an abort signal or close the iterator to release the worker. Input buffers already transferred remain detached.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/traces/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
