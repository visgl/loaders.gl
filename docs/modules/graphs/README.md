---
title: Graphs
description: Load GraphML documents into framework-independent graph records.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Graphs module"
  title="Load GraphML into reusable graph records."
  description="`@loaders.gl/graphs` parses GraphML documents into nodes and edges with typed attributes and defaults."
  tone="violet"
  meta={['GraphML 1.0', 'Nodes and edges', 'Typed attributes']}
  links={[
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'GitHub repository', to: 'https://github.com/visgl/loaders.gl'}
  ]}
/>

<DocOrientation
  eyebrow="The graph data boundary"
  title="Parse a graph file into a reusable application model."
  description="The module keeps serialization details at the edge so applications can work with nodes and edges consistently."
  tone="violet"
  items={[
    {label: 'Supported format', value: 'GraphML'},
    {label: 'Application data', value: 'Nodes, edges, and attributes'},
    {label: 'Integration', value: 'Standard loaders.gl loader contracts'},
    {label: 'Current status', value: 'GraphML loader available'}
  ]}
/>

<ReferenceBoundary
  title="GraphML loader"
  description="Use the asynchronous metadata loader or the synchronous parser subpath according to your application needs."
  tone="violet"
/>

Framework-independent graph format loaders. `GraphMLLoader` reads the first graph in a GraphML 1.0 document.

```typescript
import {load} from '@loaders.gl/core';
import {GraphMLLoader} from '@loaders.gl/graphs';

const graph = await load('network.graphml', GraphMLLoader);
```

For synchronous parsing, import `GraphMLLoaderWithParser` from
`@loaders.gl/graphs/graphml-loader` and pass it to `parseSync` from `@loaders.gl/core`.
The package root exports metadata only; asynchronous core APIs preload the implementation.

The result is `GraphData` with `shape: 'plain-graph-data'`, `nodes`, and `edges`.
Nodes have `id`, optional `label`, and optional `attributes`. Edges additionally have
`sourceId`, `targetId`, and `directed`. This shape is compatible with
`createGraphFromData` in `@deck.gl-community/graph-layers`.

Supported constructs include node and edge identifiers, generated IDs for unnamed edges,
`edgedefault` and per-edge direction overrides, node/edge/all keys, typed data and defaults,
unknown data keys, and namespace-prefixed elements. Numeric and boolean keys become JavaScript
values; other values remain strings. Nested XML data becomes a JSON string.

Only the first graph is returned. Nested graphs, hyperedges, ports, and graph-level data are
ignored. Nodes without IDs and edges without endpoints are skipped. This is a permissive
parser, not a GraphML schema validator. Long integers use JavaScript numbers and may lose
precision outside the safe integer range.
