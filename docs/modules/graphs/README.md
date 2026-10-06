---
title: Graphs
description: Load GraphML and DOT documents into framework-independent graph records.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Graphs module"
  title="Load GraphML and DOT into reusable graph records."
  description="`@loaders.gl/graphs` parses GraphML and DOT documents into nodes and edges with attributes and defaults."
  tone="violet"
  meta={['GraphML and DOT', 'Nodes and edges', 'Graph attributes']}
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
    {label: 'Supported format', value: 'GraphML and DOT'},
    {label: 'Application data', value: 'Nodes, edges, and attributes'},
    {label: 'Integration', value: 'Standard loaders.gl loader contracts'},
    {label: 'Current status', value: 'GraphML and DOT loaders available'}
  ]}
/>

<ReferenceBoundary
  title="Graph loaders"
  description="Use the asynchronous metadata loader or the synchronous parser subpath according to your application needs."
  tone="violet"
/>

Framework-independent loaders for GraphML and Graphviz DOT documents.

## GraphML loader

`GraphMLLoader` reads the first graph in a GraphML 1.0 document.

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


## DOT loader

```typescript
import {load} from '@loaders.gl/core';
import {DOTLoader} from '@loaders.gl/graphs';

const graph = await load('network.dot', DOTLoader);
```

Use `DOTLoaderWithParser` from `@loaders.gl/graphs/dot-loader` with `parseSync`
for synchronous text or UTF-8 `ArrayBuffer` parsing. `DOTLoader` recognizes `.dot` and `.gv` files.

The loader returns the same plain `GraphData` node/edge shape as GraphML, plus typed
DOT metadata: graph ID, direction, strictness, graph attributes, and subgraph descriptors.
Identifiers remain strings, including numeric-looking IDs. Unquoted numeric attributes
become numbers; quoted attributes remain strings. Node and edge `label` attributes are
also exposed as record labels.

Supported syntax includes `graph` and `digraph`, strict graphs with parallel-edge
coalescing, implicit nodes, chained edges, repeated attribute lists, scoped node/edge
defaults, graph attribute assignments, nested named and anonymous subgraphs, comments,
quoted identifiers, and balanced HTML-like labels. Node and edge attributes include
subgraph membership descriptors. An edge `id`, `Id`, or `ID` attribute supplies its ID;
otherwise the loader generates an ID from its endpoints and a counter. `dir=none`
marks an edge as undirected; other `dir` strings mark it as directed.

This is a parser for the supported DOT subset, not a Graphviz renderer. Node ports,
subgraph endpoints in edge statements, and concatenated quoted strings are unsupported.
Port syntax is rejected; identifiers containing colons must be quoted. Truncated input,
trailing content, and edge operators inconsistent with the graph declaration are rejected.
