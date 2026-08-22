{/* SPDX-License-Identifier: MIT */}

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

# Zipkin v2 JSON Trace

<TracesDocsTabs active="zipkin-trace" />

Zipkin v2 JSON represents distributed spans with microsecond timestamps, local and remote network
endpoints, string tags, and timestamped annotations. It is used by the Zipkin v2 HTTP API and by
many tracing SDK exporters.

## Supported Shapes

The loader accepts a single span, a span array such as the `/api/v2/spans` request and
`/api/v2/trace/{traceId}` response, a nested list of traces, or JSON Lines containing any of these
shapes.

## Arrow Projection

Zipkin uses the shared five-table [`OtlpTrace`](./otlp-trace) projection:

| Zipkin concept | Arrow table or field |
| --- | --- |
| local endpoint | `resources.attributes_json` |
| instrumentation source | one `scopes` row named `zipkin` |
| span and parent ID | `spans` |
| annotation | `events` |
| remote endpoint, tags, `debug`, and `shared` | `spans.attributes_json` |

Zipkin's 64-bit trace IDs are left-padded to the 128-bit OTLP width. Its server, client, producer,
and consumer kinds map directly to OTLP enum values. A non-empty `error` tag sets OTLP error
status while remaining available as an attribute.

## Time and Fidelity

Zipkin timestamps and durations are integer microseconds and may be JSON numbers or unsigned
integer strings. They are converted to nanoseconds in Arrow. Writing truncates sub-microsecond
precision because Zipkin cannot represent it.

Zipkin tags are strings. OTLP scalar attributes are stringified when written as Zipkin tags;
arrays, maps, bytes, scope metadata, links, dropped-item counters, and trace state do not have
lossless Zipkin v2 equivalents.
