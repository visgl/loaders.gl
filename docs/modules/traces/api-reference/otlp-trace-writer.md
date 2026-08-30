---
title: OtlpTraceWriter
description: Encode shared trace Arrow tables as OTLP protobuf or protobuf-JSON.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Traces module · writer API"
  title="OTLP trace writers"
  description="Encode the shared five-table Arrow trace projection as binary OTLP protobuf or standards-compliant OTLP protobuf-JSON."
  tone="violet"
  meta={['OTLP protobuf', 'Protobuf-JSON', 'Arrow input']}
  links={[
    {label: 'OTLP format', to: '/docs/modules/traces/formats/otlp-trace'},
    {label: 'OTLP loaders', to: '/docs/modules/traces/api-reference/otlp-trace-loader'},
    {label: 'Traces module', to: '/docs/modules/traces'}
  ]}
/>

<TracesDocsTabs active="otlptracewriter" />

<DocOrientation
  eyebrow="What it writes"
  title="Send normalized trace tables back to OTLP systems."
  description="The writers reconstruct resource, scope, span, event, and link messages from the shared Arrow tables while validating identifiers, relationships, and attribute encoding."
  tone="violet"
  items={[
    {label: 'Input', value: 'The five documented Arrow tables'},
    {label: 'Binary', value: 'OTLP protobuf bytes'},
    {label: 'JSON', value: 'OTLP protobuf-JSON text or bytes'},
    {label: 'Validation', value: 'IDs, references, values, and attributes'}
  ]}
/>

<ReferenceBoundary
  title="OTLP trace writer reference"
  description="The sections below document usage, JSON formatting, validation, and reconstruction behavior."
  tone="violet"
/>

`OtlpTraceWriter` encodes an `OtlpTrace` Arrow projection as binary protobuf.
`OtlpTraceJsonWriter` encodes the same input as standards-compliant OTLP protobuf-JSON.

## Usage

```typescript
import {encode, load} from '@loaders.gl/core';
import {
  OtlpTraceJsonLoader,
  OtlpTraceJsonWriter,
  OtlpTraceWriter
} from '@loaders.gl/traces';

const trace = await load('traces.otlp.json', OtlpTraceJsonLoader);
const protobuf = await encode(trace, OtlpTraceWriter);
const json = await encode(trace, OtlpTraceJsonWriter, {
  otlpTraceJson: {space: 2}
});
```

The JSON writer emits trace and span IDs as lowercase hexadecimal strings, enum values as integers,
and 64-bit integers using protobuf-JSON string representation.

## JSON Writer Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `otlpTraceJson.space` | `number` | `0` | Spaces used to pretty-print JSON. Values are clamped to 0 through 10. |

## Validation

The writers require the five documented Arrow tables and schemas. They reject missing relational
references, malformed attribute JSON, nonnumeric required values, and identifiers whose byte width
does not match OTLP. Rows are grouped back into resource, scope, and span messages using their keys.

Unknown protobuf fields discarded during loading cannot be written back. Attribute values remain
lossless because their protobuf-JSON tagged representation is retained in Arrow.
