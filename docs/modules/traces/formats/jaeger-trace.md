{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Jaeger JSON Trace

<TracesDocsTabs active="jaeger-trace" />

Jaeger JSON represents distributed spans with microsecond timestamps, typed tags, process
descriptors, logs, and `CHILD_OF` or `FOLLOWS_FROM` references. Jaeger Query API responses wrap
traces in a `data` array, while archive and interchange tools commonly use individual trace
objects or arrays of spans with embedded process descriptors.

## Supported Shapes

The loader accepts:

- Jaeger Query API responses with `data`, `total`, `limit`, `offset`, and `errors` fields
- individual `{traceID, spans, processes}` trace objects
- arrays of trace objects
- arrays of spans carrying embedded `process` objects
- JSON Lines containing one supported object or array per non-empty line

## Arrow Projection

Jaeger data uses the same [`OtlpTrace`](./otlp-trace) projection as the OTLP loaders:

| Jaeger concept | Arrow table or field |
| --- | --- |
| process service name and tags | `resources.attributes_json` |
| instrumentation source | one `scopes` row named `jaeger` |
| span | `spans` |
| log | `events` |
| first same-trace `CHILD_OF` reference | `spans.parent_span_id` |
| remaining references | `links` |

Jaeger's 64-bit trace IDs are left-padded with zeroes to the 128-bit OTLP width. Existing 128-bit
IDs are retained. Span IDs already have the shared 64-bit width.

Typed Jaeger tags are stored as OTLP `AnyValue` JSON in `attributes_json`. The `span.kind` tag also
sets the OTLP span-kind enum. A truthy `error` tag sets OTLP error status. Original tags remain in
the attribute list so they can be written back.

## Time Units

Jaeger `startTime`, `duration`, and log `timestamp` values are integer microseconds. The loader
converts them to unsigned nanoseconds. Values must be non-negative JavaScript safe integers.

The writer converts nanoseconds back to microseconds by integer division. Sub-microsecond
precision cannot be represented by Jaeger JSON and is truncated.

## Fidelity

The writer reconstructs parent references and links. Link attributes created by the loader retain
the original Jaeger reference type; other OTLP links become `FOLLOWS_FROM`. OTLP scope metadata,
trace state, dropped-item counters, status messages, and attributes that cannot be represented by
Jaeger's scalar tag types are not losslessly expressible in Jaeger JSON.
