---
title: '@loaders.gl/traces'
description: Load, normalize, and write performance traces as structured Arrow tables.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Performance data module"
  title="Put trace formats on a common table path."
  description="The traces module reads browser, system, and distributed-tracing formats and projects them into typed Arrow tables. That makes trace data available to the same filtering, analysis, and writer workflows as other columnar data."
  tone="cyan"
  meta={['Chrome Trace', 'Perfetto', 'OTLP / Jaeger / Zipkin']}
  links={[
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'Perfetto format', to: '/docs/modules/traces/formats/perfetto-trace'}
  ]}
/>

<TracesDocsTabs active="overview" />

<DocOrientation
  eyebrow="The trace path"
  title="Different trace dialects, predictable tables."
  description="Each source format has its own event model. The module preserves its important entities while normalizing them into named Arrow tables that analysis code can consume consistently."
  tone="cyan"
  items={[
    {label: 'Browser traces', value: 'Chrome Trace Event JSON and Arrow'},
    {label: 'System traces', value: 'Perfetto TrackEvent protobuf tables'},
    {label: 'Distributed traces', value: 'OTLP, Jaeger, and Zipkin projections'},
    {label: 'Write', value: 'Re-encode compatible Arrow tables for supported formats'}
  ]}
/>

The `@loaders.gl/traces` module reads and writes performance trace formats without requiring a
specific visualization framework. Chrome Trace Event JSON can be loaded as validated JSON or
Apache Arrow. Stable Perfetto TrackEvent protobuf data is projected into four typed Arrow tables.
OpenTelemetry OTLP traces in protobuf, protobuf-JSON, or JSON Lines are normalized into five
relational Arrow tables. Jaeger and Zipkin JSON use the same five-table projection for direct
interoperability.

<ReferenceBoundary
  title="Trace format and table details"
  description="The sections below compare formats, loaders, writers, streaming results, and the normalized Arrow table contracts."
  tone="cyan"
/>

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/traces apache-arrow
```

## Formats and APIs

| Format | Loader result | Batched result | Writer input |
| --- | --- | --- | --- |
| [Chrome Trace Event JSON](/docs/modules/traces/formats/chrome-trace) | Validated JSON or one Arrow event table | Arrow event record batches | Arrow event table or record batch |
| [Perfetto protobuf](/docs/modules/traces/formats/perfetto-trace) | `tracks`, `slices`, `processes`, and `threads` Arrow tables | Tagged `{table, data}` record batches | The same four Arrow tables |
| [OpenTelemetry OTLP traces](/docs/modules/traces/formats/otlp-trace) | `resources`, `scopes`, `spans`, `events`, and `links` Arrow tables | Tagged `{table, data}` record batches | The same five Arrow tables |
| [Jaeger JSON traces](/docs/modules/traces/formats/jaeger-trace) | The five OTLP-compatible Arrow tables | Tagged `{table, data}` record batches | The same five Arrow tables |
| [Zipkin v2 JSON traces](/docs/modules/traces/formats/zipkin-trace) | The five OTLP-compatible Arrow tables | Tagged `{table, data}` record batches | The same five Arrow tables |

## Choosing a Trace Format

There is no single best trace format. Chrome Trace and Perfetto are timeline-oriented formats for
profiling one machine or runtime. OTLP, Jaeger, and Zipkin are span-oriented formats for tracing
requests across services.

| Format | Best fit | Advantages | Tradeoffs |
| --- | --- | --- | --- |
| [Chrome Trace Event JSON](/docs/modules/traces/formats/chrome-trace) | Application, browser, Node.js, and accelerator timeline profiling | Simple JSON; broad profiler and viewer support; flexible duration, instant, counter, async, flow, and metadata events; easy to inspect and generate | Verbose at scale; loosely specified extension fields; source-defined time units; no standard resource, service, trace-ID, or span-link model |
| [Perfetto protobuf](/docs/modules/traces/formats/perfetto-trace) | High-volume operating-system and application timelines | Compact binary encoding; nanosecond-oriented timestamps; hierarchical tracks; incremental packets and interned data; strong Perfetto tooling | Not human-readable; full format is very broad; clocks may require normalization; this module intentionally supports the stable TrackEvent projection rather than every packet family |
| [OpenTelemetry OTLP](/docs/modules/traces/formats/otlp-trace) | New vendor-neutral distributed tracing pipelines and archival interchange | Standard resource, scope, span, event, link, status, typed-attribute, and nanosecond models; efficient protobuf plus debuggable JSON; strongest cross-vendor semantics | More structured and complex than Zipkin or Jaeger JSON; not a native CPU/GPU scheduling timeline; protobuf is not directly readable |
| [Jaeger JSON](/docs/modules/traces/formats/jaeger-trace) | Existing Jaeger Query API, archive, and migration workflows | Human-readable; explicit process descriptors, typed scalar tags, logs, and references; straightforward compatibility with Jaeger deployments | Microsecond precision; legacy model has fewer semantics than OTLP; arrays, maps, scope metadata, status detail, and some links cannot round-trip losslessly |
| [Zipkin v2 JSON](/docs/modules/traces/formats/zipkin-trace) | Lightweight Zipkin HTTP API integrations and legacy interoperability | Small conceptual model; easy JSON; familiar client/server endpoints, annotations, and tags; simple to produce | Microsecond precision; string-only tags; no native instrumentation scopes, typed attributes, span links, or OTLP-style loss counters |

### Recommendations

- Use **OTLP protobuf** as the default for new distributed tracing systems. Choose OTLP JSON when
  human inspection matters more than payload size, and JSON Lines when traces must be emitted or
  processed incrementally.
- Use **Perfetto** for compact, high-volume system or application timelines that will be analyzed
  with Perfetto-compatible tooling. Use Trace Processor instead of this module when analysis
  depends on ftrace, heap profiles, SQL metrics, or cross-clock normalization.
- Use **Chrome Trace** when producers and consumers already use the Trace Event ecosystem, or when
  a transparent JSON timeline is more valuable than compact storage. It is usually the easiest
  format for custom profiler instrumentation.
- Use **Jaeger JSON** or **Zipkin JSON** primarily at compatibility boundaries. They are appropriate
  when integrating with their native APIs, but OTLP retains more information as a long-term
  canonical representation.
- Do not convert a system timeline to a distributed-span format merely for uniformity. Tracks,
  counters, flows, scheduler events, and clock-domain information do not map cleanly to spans.
- Expect conversions from OTLP to Jaeger or Zipkin to be lossy. Review each writer's fidelity
  section before using a converted file for archival or compliance purposes.

### Quick Decisions

| Requirement | Recommended format |
| --- | --- |
| Vendor-neutral service tracing | OTLP protobuf |
| Readable service-trace exchange | OTLP JSON |
| Incremental service-trace JSON | OTLP JSON Lines |
| Compact system timeline | Perfetto protobuf |
| Custom profiler JSON or browser tooling | Chrome Trace Event JSON |
| Existing Jaeger API or archive | Jaeger JSON |
| Existing Zipkin v2 API | Zipkin v2 JSON |

| API | Purpose |
| --- | --- |
| [`ChromeTraceLoader`](/docs/modules/traces/api-reference/chrome-trace-loader) | Load Chrome Trace JSON as JSON or Arrow. |
| [`ChromeTraceWriter`](/docs/modules/traces/api-reference/chrome-trace-writer) | Reconstruct Chrome Trace JSON from Arrow events. |
| [`PerfettoTraceLoader`](/docs/modules/traces/api-reference/perfetto-trace-loader) | Load stable Perfetto TrackEvent data as Arrow. |
| [`PerfettoTraceWriter`](/docs/modules/traces/api-reference/perfetto-trace-writer) | Encode the package's Perfetto Arrow projection as protobuf. |
| [`OtlpTraceLoader` and `OtlpTraceJsonLoader`](/docs/modules/traces/api-reference/otlp-trace-loader) | Load OTLP protobuf, protobuf-JSON, or JSON Lines as Arrow. |
| [`OtlpTraceWriter` and `OtlpTraceJsonWriter`](/docs/modules/traces/api-reference/otlp-trace-writer) | Encode the OTLP Arrow projection as protobuf or protobuf-JSON. |
| [`JaegerTraceLoader`](/docs/modules/traces/api-reference/jaeger-trace-loader) | Load Jaeger Query API, archive, span-array, or JSON Lines data as Arrow. |
| [`JaegerTraceWriter`](/docs/modules/traces/api-reference/jaeger-trace-writer) | Encode the shared OTLP Arrow projection as Jaeger JSON. |
| [`ZipkinTraceLoader`](/docs/modules/traces/api-reference/zipkin-trace-loader) | Load Zipkin v2 span arrays, trace lists, or JSON Lines as Arrow. |
| [`ZipkinTraceWriter`](/docs/modules/traces/api-reference/zipkin-trace-writer) | Encode the shared OTLP Arrow projection as Zipkin v2 JSON. |
| [Chrome trace streaming](/docs/modules/traces/api-reference/chrome-trace-streaming) | Adapt event, Arrow, or JSON chunk streams into live trace snapshots. |

## Quick Start

```typescript
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

## Bundle Splitting

The package root exports metadata-only loaders. Async core APIs call each loader's `preload()`
method and dynamically import its parser-bearing implementation. This keeps parser code out of the
initial bundle until parsing starts.

Applications that need parser-bearing loader objects directly can import the implementation
subpaths:

```typescript
import {ChromeTraceLoaderWithParser} from '@loaders.gl/traces/chrome-trace-loader';
import {PerfettoTraceLoaderWithParser} from '@loaders.gl/traces/perfetto-trace-loader';
import {OtlpTraceLoaderWithParser} from '@loaders.gl/traces/otlp-trace-loader';
import {OtlpTraceJsonLoaderWithParser} from '@loaders.gl/traces/otlp-trace-json-loader';
import {JaegerTraceLoaderWithParser} from '@loaders.gl/traces/jaeger-trace-loader';
import {ZipkinTraceLoaderWithParser} from '@loaders.gl/traces/zipkin-trace-loader';
```

Writers and shared public types remain available from `@loaders.gl/traces`.

## Choosing an API

- Use `load` or `parse` when the complete Arrow result is required before processing starts.
- Use `parseInBatches` when input arrives incrementally or when downstream work can consume Arrow
  batches.
- Use the Chrome streaming helpers when a live consumer expects `TraceStreamChunk` snapshots rather
  than Arrow batches.
- Use `parseChromeTrace(...)` when an application needs semantic Chrome processes, threads, spans,
  counters, flows, and instants instead of raw event rows.
