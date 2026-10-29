Traces module · writer API

![](/next/images/format-logos/perfetto-logo.png)Perfetto

# PerfettoTraceWriter

Serialize the typed Perfetto Arrow projection back into a canonical protobuf Trace envelope.

[Perfetto format](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[Traces module](https://loaders.gl/next/docs/modules/traces.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/traces.md)

![](/next/images/format-logos/perfetto-logo.png)Perfetto[Try It](https://loaders.gl/next/examples/traces/chrome-trace)[Overview](https://loaders.gl/next/docs/modules/traces.md)[Chrome Trace](https://loaders.gl/next/docs/modules/traces/formats/chrome-trace.md)[ChromeTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-loader.md)[ChromeTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-writer.md)[Streaming](https://loaders.gl/next/docs/modules/traces/api-reference/chrome-trace-streaming.md)[Perfetto](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md)[PerfettoTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-loader.md)[PerfettoTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/perfetto-trace-writer.md)[OTLP](https://loaders.gl/next/docs/modules/traces/formats/otlp-trace.md)[OTLP Loaders](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-loader.md)[OTLP Writers](https://loaders.gl/next/docs/modules/traces/api-reference/otlp-trace-writer.md)[Jaeger](https://loaders.gl/next/docs/modules/traces/formats/jaeger-trace.md)[JaegerTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-loader.md)[JaegerTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/jaeger-trace-writer.md)[Zipkin](https://loaders.gl/next/docs/modules/traces/formats/zipkin-trace.md)[ZipkinTraceLoader](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-loader.md)[ZipkinTraceWriter](https://loaders.gl/next/docs/modules/traces/api-reference/zipkin-trace-writer.md)

What it writes

## Move an analyzed trace back into Perfetto.

PerfettoTraceWriter accepts the four-table Arrow projection, validates its relationships, and emits descriptor and TrackEvent packets with the original timing model.

01

Input

Tracks, slices, processes, and threads tables

02

Events

Instant and begin/end TrackEvents

03

Timing

Raw timestamps and durations preserved

04

Validation

Required IDs and relationships checked

Detailed guide

## PerfettoTraceWriter reference

The sections below document usage, input contracts, encoding behavior, and supported fidelity limits.

`PerfettoTraceWriter` serializes the four-table `PerfettoTrace` Arrow projection as a canonical Perfetto protobuf `Trace` envelope.

## Usage[​](#usage "Direct link to Usage")

```
import {load, encode} from '@loaders.gl/core';

import {PerfettoTraceLoader, PerfettoTraceWriter} from '@loaders.gl/traces';



const trace = await load('input.perfetto-trace', PerfettoTraceLoader);

const protobuf = await encode(trace, PerfettoTraceWriter);
```

## Input Contract[​](#input-contract "Direct link to Input Contract")

The input object must provide `tracks`, `slices`, `processes`, and `threads` Arrow tables with the schemas documented on the [Perfetto format page](https://loaders.gl/next/docs/modules/traces/formats/perfetto-trace.md).

* required `Uint64` values can be Arrow `bigint`, JavaScript number, or integer string values
* required PID and TID values must be finite integers
* nullable names, owners, and parent UUIDs may be `null`
* missing required integer or UUID values throw an encoding error

## Encoding[​](#encoding "Direct link to Encoding")

The writer emits:

* process and thread descriptor packets
* track descriptor packets with process, thread, parent, and counter associations
* `TYPE_INSTANT` TrackEvents for rows where `dur` is zero
* paired `TYPE_SLICE_BEGIN` and `TYPE_SLICE_END` TrackEvents for positive durations
* packet timestamps using the raw `ts` and `ts + dur` values

Slice rows are ordered by timestamp before encoding. The writer uses the default Perfetto timestamp unit and does not emit clock snapshots or incremental interning.

## Projection Semantics[​](#projection-semantics "Direct link to Projection Semantics")

This writer is symmetric with the package's Arrow projection, not with every field in an arbitrary Perfetto file. Packet families and TrackEvent details skipped by `PerfettoTraceLoader` are not available in the Arrow tables and cannot be recreated. Use Perfetto's own tooling when lossless editing of a complete native trace is required.

`PerfettoTraceWriter` currently has no format-specific options.
