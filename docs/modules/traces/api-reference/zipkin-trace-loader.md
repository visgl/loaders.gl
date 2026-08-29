---
title: ZipkinTraceLoader
description: Read Zipkin JSON and JSON Lines into the shared trace Arrow projection.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Traces module · loader API"
  title="ZipkinTraceLoader"
  description="Read Zipkin v2 JSON and JSON Lines into the shared five-table OTLP Arrow projection for common trace analysis."
  tone="violet"
  meta={['Zipkin v2', 'JSON Lines', 'OTLP Arrow projection']}
  links={[
    {label: 'Zipkin format', to: '/docs/modules/traces/formats/zipkin-trace'},
    {label: 'ZipkinTraceWriter', to: '/docs/modules/traces/api-reference/zipkin-trace-writer'},
    {label: 'Traces module', to: '/docs/modules/traces'}
  ]}
/>

<TracesDocsTabs active="zipkintraceloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Use Zipkin input with the shared trace model."
  description="The loader accepts complete JSON or line-oriented input and produces the same relational Arrow tables used by OTLP and Jaeger adapters."
  tone="violet"
  items={[
    {label: 'Input', value: 'Zipkin v2 JSON or JSON Lines'},
    {label: 'Output', value: 'The five-table OtlpTrace projection'},
    {label: 'Streaming', value: 'Incremental JSON Lines parsing'},
    {label: 'Fidelity', value: 'Large identifiers preserved safely'}
  ]}
/>

<ReferenceBoundary
  title="ZipkinTraceLoader reference"
  description="The sections below document usage, parser access, options, JSON Lines behavior, and validation."
  tone="violet"
/>

`ZipkinTraceLoader` reads Zipkin v2 JSON and JSON Lines into the five-table
[`OtlpTrace`](../formats/otlp-trace) Arrow projection.

```typescript
import {load} from '@loaders.gl/core';
import {ZipkinTraceLoader} from '@loaders.gl/traces';

const trace = await load('trace.zipkin.json', ZipkinTraceLoader);
console.log(trace.spans);
console.log(trace.events);
```

The package-root loader is metadata-only. The parser-bearing loader is available from:

```typescript
import {ZipkinTraceLoaderWithParser} from '@loaders.gl/traces/zipkin-trace-loader';
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `zipkinTrace.batchSize` | `number` | `4096` | Maximum rows in each tagged Arrow record batch. |

JSON Lines documents emit incrementally through `parseInBatches`. Pretty or multi-line JSON falls
back to complete-document parsing. The loader recognizes `.zipkin.json` and `.zipkin.jsonl`.

Malformed shapes, invalid hexadecimal IDs, negative values, and unsafe numeric timestamps throw
parsing errors. Large integer timestamps can be supplied as strings without losing precision.
