---
title: Zipkin v2 JSON Trace
description: Normalize Zipkin spans, endpoints, annotations, and tags into the shared trace tables.
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';

<DocPageHeader
  eyebrow="Distributed trace format"
  title="Use Zipkin JSON at the edge, then analyze it like OTLP."
  description="Zipkin v2 is compact and widely deployed. loaders.gl maps its spans, endpoints, annotations, and tags into the shared five-table Arrow projection while making precision and fidelity limits explicit."
  tone="violet"
  meta={['Zipkin v2 JSON', 'Span arrays and JSON Lines', 'Arrow projection']}
  links={[
    {label: 'Traces module', to: '/docs/modules/traces'},
    {label: 'OTLP format', to: '/docs/modules/traces/formats/otlp-trace'},
    {label: 'Zipkin loader', to: '/docs/modules/traces/api-reference/zipkin-trace-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The Zipkin path"
  title="Read spans and annotations. Put them beside the other trace dialects."
  description="Zipkin’s smaller model is enough for many compatibility boundaries. The shared projection makes its data consumable by the same table-oriented tools without claiming lossless equivalence."
  tone="violet"
  items={[
    {label: 'Input', value: 'Zipkin v2 span arrays, trace lists, or JSON Lines'},
    {label: 'Map', value: 'Endpoints, tags, annotations, and references'},
    {label: 'Output', value: 'Resources, scopes, spans, events, and links tables'},
    {label: 'Fidelity', value: 'Microseconds and string tags remain explicit limits'}
  ]}
/>

<TracesDocsTabs active="zipkin-trace" />

Zipkin v2 JSON represents distributed spans with microsecond timestamps, local and remote network
endpoints, string tags, and timestamped annotations. It is used by the Zipkin v2 HTTP API and by
many tracing SDK exporters.

<ReferenceBoundary
  title="Zipkin projection and fidelity details"
  description="The reference below covers accepted shapes, Arrow projection, timestamp conversion, endpoint mapping, and lossy fields."
  tone="violet"
/>

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
