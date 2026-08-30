---
title: ZipkinTraceWriter
description: Encode the shared trace Arrow projection as Zipkin v2 JSON.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Traces module · writer API"
  title="ZipkinTraceWriter"
  description="Convert the shared five-table OTLP Arrow projection into Zipkin v2 span arrays or trace-grouped JSON."
  tone="violet"
  meta={['Zipkin v2', 'OTLP Arrow input', 'JSON output']}
  links={[
    {label: 'Zipkin format', to: '/docs/modules/traces/formats/zipkin-trace'},
    {label: 'ZipkinTraceLoader', to: '/docs/modules/traces/api-reference/zipkin-trace-loader'},
    {label: 'Traces module', to: '/docs/modules/traces'}
  ]}
/>

<TracesDocsTabs active="zipkintracewriter" />

<DocOrientation
  eyebrow="What it writes"
  title="Export shared trace data to Zipkin clients."
  description="ZipkinTraceWriter reconstructs endpoints, annotations, and span relationships from the normalized Arrow tables, with either span-array or trace-grouped output."
  tone="violet"
  items={[
    {label: 'Input', value: 'The five-table OtlpTrace projection'},
    {label: 'Spans', value: 'A flat array of Zipkin spans'},
    {label: 'Traces', value: 'Arrays grouped by trace ID'},
    {label: 'Context', value: 'Local, remote, and event annotations'}
  ]}
/>

<ReferenceBoundary
  title="ZipkinTraceWriter reference"
  description="The sections below document usage, output shapes, formatting options, reconstruction, and fidelity limits."
  tone="violet"
/>

`ZipkinTraceWriter` converts the shared `OtlpTrace` Arrow projection into Zipkin v2 JSON.

```typescript
import {encode, load} from '@loaders.gl/core';
import {ZipkinTraceLoader, ZipkinTraceWriter} from '@loaders.gl/traces';

const trace = await load('trace.zipkin.json', ZipkinTraceLoader);
const spans = await encode(trace, ZipkinTraceWriter, {
  zipkinTrace: {shape: 'spans', space: 2}
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `zipkinTrace.shape` | `'spans' \| 'traces'` | `'spans'` | Emit one span array or a list of arrays grouped by trace ID. |
| `zipkinTrace.space` | `number` | `0` | Spaces used to pretty-print JSON. |

The writer reconstructs local endpoints from resources, remote endpoints from compatibility
attributes, and annotations from OTLP events. See the [Zipkin format page](../formats/zipkin-trace)
for mappings and fidelity limits.
