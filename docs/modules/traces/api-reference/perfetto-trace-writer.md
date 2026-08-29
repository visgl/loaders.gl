---
title: PerfettoTraceWriter
description: Serialize typed Perfetto Arrow tables as canonical TrackEvent protobuf.
hide_title: true
page_style: designed
---

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Traces module · writer API"
  title="PerfettoTraceWriter"
  description="Serialize the typed Perfetto Arrow projection back into a canonical protobuf Trace envelope."
  tone="violet"
  meta={['Perfetto protobuf', 'Arrow input', 'Round-trip writer']}
  links={[
    {label: 'Perfetto format', to: '/docs/modules/traces/formats/perfetto-trace'},
    {label: 'PerfettoTraceLoader', to: '/docs/modules/traces/api-reference/perfetto-trace-loader'},
    {label: 'Traces module', to: '/docs/modules/traces'}
  ]}
/>

<TracesDocsTabs active="perfettotracewriter" />

<DocOrientation
  eyebrow="What it writes"
  title="Move an analyzed trace back into Perfetto."
  description="PerfettoTraceWriter accepts the four-table Arrow projection, validates its relationships, and emits descriptor and TrackEvent packets with the original timing model."
  tone="violet"
  items={[
    {label: 'Input', value: 'Tracks, slices, processes, and threads tables'},
    {label: 'Events', value: 'Instant and begin/end TrackEvents'},
    {label: 'Timing', value: 'Raw timestamps and durations preserved'},
    {label: 'Validation', value: 'Required IDs and relationships checked'}
  ]}
/>

<ReferenceBoundary
  title="PerfettoTraceWriter reference"
  description="The sections below document usage, input contracts, encoding behavior, and supported fidelity limits."
  tone="violet"
/>

`PerfettoTraceWriter` serializes the four-table `PerfettoTrace` Arrow projection as a canonical
Perfetto protobuf `Trace` envelope.

## Usage

```typescript
import {load, encode} from '@loaders.gl/core';
import {PerfettoTraceLoader, PerfettoTraceWriter} from '@loaders.gl/traces';

const trace = await load('input.perfetto-trace', PerfettoTraceLoader);
const protobuf = await encode(trace, PerfettoTraceWriter);
```

## Input Contract

The input object must provide `tracks`, `slices`, `processes`, and `threads` Arrow tables with the
schemas documented on the [Perfetto format page](../formats/perfetto-trace).

- required `Uint64` values can be Arrow `bigint`, JavaScript number, or integer string values
- required PID and TID values must be finite integers
- nullable names, owners, and parent UUIDs may be `null`
- missing required integer or UUID values throw an encoding error

## Encoding

The writer emits:

- process and thread descriptor packets
- track descriptor packets with process, thread, parent, and counter associations
- `TYPE_INSTANT` TrackEvents for rows where `dur` is zero
- paired `TYPE_SLICE_BEGIN` and `TYPE_SLICE_END` TrackEvents for positive durations
- packet timestamps using the raw `ts` and `ts + dur` values

Slice rows are ordered by timestamp before encoding. The writer uses the default Perfetto timestamp
unit and does not emit clock snapshots or incremental interning.

## Projection Semantics

This writer is symmetric with the package's Arrow projection, not with every field in an arbitrary
Perfetto file. Packet families and TrackEvent details skipped by `PerfettoTraceLoader` are not
available in the Arrow tables and cannot be recreated. Use Perfetto's own tooling when lossless
editing of a complete native trace is required.

`PerfettoTraceWriter` currently has no format-specific options.
