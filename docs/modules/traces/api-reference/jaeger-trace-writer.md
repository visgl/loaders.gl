---
title: JaegerTraceWriter
description: Encode the shared trace Arrow projection as Jaeger JSON.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Traces module · writer API"
  title="JaegerTraceWriter"
  description="Convert the shared five-table OTLP Arrow projection into Jaeger query responses or span-array JSON."
  tone="violet"
  meta={['Jaeger JSON', 'OTLP Arrow input', 'Query or span arrays']}
  links={[
    {label: 'Jaeger format', to: '/docs/modules/traces/formats/jaeger-trace'},
    {label: 'JaegerTraceLoader', to: '/docs/modules/traces/api-reference/jaeger-trace-loader'},
    {label: 'Traces module', to: '/docs/modules/traces'}
  ]}
/>

<TracesDocsTabs active="jaegertracewriter" />

<DocOrientation
  eyebrow="What it writes"
  title="Export normalized trace data to Jaeger’s shapes."
  description="JaegerTraceWriter reconstructs provider-facing process and span relationships from the shared Arrow tables, with an option for the Query API envelope or raw span arrays."
  tone="violet"
  items={[
    {label: 'Input', value: 'The five-table OTLP Arrow projection'},
    {label: 'Query', value: 'Trace IDs grouped with process maps'},
    {label: 'Spans', value: 'Raw spans with embedded processes'},
    {label: 'Validation', value: 'Relationships checked before encoding'}
  ]}
/>

<ReferenceBoundary
  title="JaegerTraceWriter reference"
  description="The sections below document usage, output shapes, formatting options, and reconstruction behavior."
  tone="violet"
/>

`JaegerTraceWriter` converts the five-table `OtlpTrace` Arrow projection into Jaeger JSON.

## Usage

```typescript
import {encode, load} from '@loaders.gl/core';
import {JaegerTraceLoader, JaegerTraceWriter} from '@loaders.gl/traces';

const trace = await load('trace.jaeger.json', JaegerTraceLoader);
const queryResponse = await encode(trace, JaegerTraceWriter, {
  jaegerTrace: {shape: 'query', space: 2}
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `jaegerTrace.shape` | `'query' \| 'spans'` | `'query'` | Emit a Query API response or a raw span array with embedded processes. |
| `jaegerTrace.space` | `number` | `0` | Spaces used to pretty-print JSON. Values are clamped by `JSON.stringify`. |

The Query API shape groups spans by trace ID and emits process descriptors in each trace's
`processes` map. The span-array shape copies each referenced process onto its span, which is useful
for archive and interchange tools that do not consume the Query API envelope.

The writer validates the normalized Arrow relationships through the shared OTLP reconstruction
path before converting them. See the [Jaeger format page](../formats/jaeger-trace) for mappings and
known fidelity limits.
