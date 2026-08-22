{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# OTLP Trace Writers

<TracesDocsTabs active="otlptracewriter" />

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
