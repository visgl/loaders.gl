---
title: Graphs
description: Load GraphML, DOT, and GEXF documents into Arrow node and edge tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Graphs module"
  title="Load GraphML, DOT, and GEXF into reusable graph tables."
  description="`@loaders.gl/graphs` parses GraphML, DOT, and GEXF documents into nodes and edges with attributes and defaults."
  tone="violet"
  meta={['GraphML, DOT, and GEXF', 'Nodes and edges', 'Graph attributes']}
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
    {label: 'Supported format', value: 'GraphML, DOT, and GEXF'},
    {label: 'Application data', value: 'Nodes, edges, and attributes'},
    {label: 'Integration', value: 'Standard loaders.gl loader contracts'},
    {label: 'Current status', value: 'GraphML, DOT, and GEXF loaders available'}
  ]}
/>

<ReferenceBoundary
  title="Graph loaders"
  description="Use the asynchronous metadata loader or the synchronous parser subpath according to your application needs."
  tone="violet"
/>

Framework-independent loaders for GraphML, Graphviz DOT, and GEXF documents.

## Graph output shapes

Graph loaders default to `graphml.shape: 'arrow-table'`, `dot.shape: 'arrow-table'`,
or `gexf.shape: 'arrow-table'`.
The result uses the standard table collection shape:

```typescript
{
  shape: 'tables',
  tables: [
    {name: 'nodes', table: {shape: 'arrow-table', schema, data: nodes}},
    {name: 'edges', table: {shape: 'arrow-table', schema, data: edges}}
  ]
}
```

Each `data` is an Apache Arrow `Table`; each `schema` is a loaders.gl schema.
The node table has `id`, nullable `label`, and nullable `attributes` columns.
The edge table additionally has `sourceId`, `targetId`, and `directed`.
Structural identifiers are strings, including numeric DOT edge IDs. Row order follows
document order after DOT strict-edge coalescing. Edges may reference undeclared nodes;
the loaders preserve their endpoints without inventing GraphML nodes.

Application attributes live in a typed `attributes` struct, so keys such as `id` cannot
replace structural columns. GraphML declarations determine Boolean, Int32, Int64,
Float32, Float64, and Utf8 fields, including unused declarations on empty graphs.
GraphML `long` values are parsed as exact integers and read as `bigint`.
Invalid or out-of-range integer values make the affected attribute column Utf8,
preserving values as strings. DOT scalar types are inferred across the whole column;
numbers use Float64, booleans use Bool, and mixed scalar types use Utf8. Nested DOT
subgraph membership uses List and Struct columns. Missing values become Arrow nulls.
Empty undeclared attributes have a Struct with no child fields.

```typescript
const graph = await load('network.graphml', GraphMLLoader);
if (graph.shape === 'tables' && graph.tables[0].table.shape === 'arrow-table') {
  const nodes = graph.tables[0].table.data;
  console.log(nodes.getChild('id')?.get(0));
}
```

Select `'object-row-table'` for the same named table collection with object arrays in
`table.data`. This mode also preserves GraphML long values as `bigint`; it retains original
application attribute values rather than applying Arrow column normalization.

For compatibility with existing graph-layer consumers, request plain graph records:

```typescript
const graph = await load('network.graphml', GraphMLLoader, {
  graphml: {shape: 'plain-graph-data'}
});
// DOT: {dot: {shape: 'plain-graph-data'}}
```

Plain output retains `shape: 'plain-graph-data'`, `nodes`, and `edges`, with original
DOT edge ID types. GraphML long values in this compatibility mode remain JavaScript
numbers and can lose precision outside the safe integer range.
DOT graph metadata is available as `graph.metadata` in every output shape.

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

The explicit plain compatibility result is `GraphData` with `shape: 'plain-graph-data'`, `nodes`, and `edges`.
Nodes have `id`, optional `label`, and optional `attributes`. Edges additionally have
`sourceId`, `targetId`, and `directed`. This shape is compatible with
`createGraphFromData` in `@deck.gl-community/graph-layers`.

Supported constructs include node and edge identifiers, generated IDs for unnamed edges,
`edgedefault` and per-edge direction overrides, node/edge/all keys, typed data and defaults,
unknown data keys, and namespace-prefixed elements. Numeric and boolean keys become JavaScript
values; string values preserve their whitespace. Nested XML data becomes a JSON string.

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

The loader returns the same named node/edge table collection as GraphML, plus typed
DOT metadata: graph ID, direction, strictness, graph attributes, and subgraph descriptors.
Unknown backslash sequences are preserved for downstream attribute interpretation.
Backslashes followed by physical line endings join quoted identifiers and labels across lines.
Identifiers remain strings, including numeric-looking IDs. Unquoted numeric attributes
become numbers; quoted attributes remain strings. Node and edge `label` attributes are
also exposed as record labels.

Supported syntax includes `graph` and `digraph`, strict graphs with parallel-edge
coalescing, implicit nodes, chained edges, repeated attribute lists, scoped node/edge
defaults, graph attribute assignments, nested named and anonymous subgraphs, comments,
quoted identifiers, and balanced HTML-like labels. Node and edge attributes include
subgraph membership descriptors. Reopening a named subgraph retains its attributes and
node/edge defaults; anonymous subgraph identifiers remain distinct from explicit names. An edge `id`, `Id`, or `ID` attribute supplies its ID;
otherwise the loader generates an ID from its endpoints and a counter. `dir=none`
marks an edge as undirected; other `dir` strings mark it as directed.

This is a parser for the supported DOT subset, not a Graphviz renderer. Node ports,
subgraph endpoints in edge statements, and concatenated quoted strings are unsupported.
Port syntax is rejected; identifiers containing colons must be quoted. Truncated input,
trailing content, and edge operators inconsistent with the graph declaration are rejected.

## GEXF loader

`GEXFLoader` reads static GEXF 1.2 (including `1.2draft`) and 1.3 documents.

```typescript
import {load} from '@loaders.gl/core';
import {GEXFLoader} from '@loaders.gl/graphs';

const graph = await load('network.gexf', GEXFLoader);
// Optional: {gexf: {shape: 'object-row-table'}} or {gexf: {shape: 'plain-graph-data'}}
```

For synchronous parsing, use `GEXFLoaderWithParser` from
`@loaders.gl/graphs/gexf-loader` with `parseSync`. The package root exports metadata
only; asynchronous core APIs preload the parser. Text and UTF-8 binary inputs are supported.
The loader recognizes `.gexf` and `application/gexf+xml`.

The default result contains named Arrow node and edge tables in the standard `tables`
collection. Application attributes use declaration titles inside the `attributes` struct;
node and edge declarations are scoped separately. Boolean, integer, long, float, double,
and string declarations retain their Arrow types, even for empty graphs. Byte and short
attributes use Int32. `anyURI`, date, char, bigdecimal, and biginteger values retain their text
as Utf8. Long integers remain exact `bigint` values in every output shape, including
plain records. Invalid or out-of-range scalar values promote the affected Arrow field
to Utf8, preserving the original text.

List attributes become typed Arrow Lists, including unused declarations. Both bracketed
comma-separated lists and legacy pipe/comma/semicolon-separated values are accepted.
Single and double quotes preserve embedded delimiters and whitespace; malformed
list quoting is rejected. An empty value becomes an empty list. Defaults apply before explicit values; absent
attributes without defaults become Arrow nulls. String values and labels preserve whitespace.

Native edge weight and kind properties are retained under `attributes.gexf.weight` and
`attributes.gexf.kind`. Namespaced color, position, size, shape, and thickness elements
are retained as nested structs under `attributes.gexf.viz`, with numeric coordinates,
color components, sizes, and thicknesses. Shape names, image URIs, and hex colors remain
strings. The application attribute title `gexf` is reserved to prevent collisions.

`graph.metadata` contains the document version, default direction, and an `attributes`
object with creator, description, keywords, and lastmodifieddate when supplied.
Directed and undirected edges, per-edge direction overrides, self-loops, and parallel
edges are preserved in document order. IDs remain strings; missing edge IDs receive
stable `edge-<index>` identifiers that avoid collisions with supplied IDs.

This is a static graph parser, not a complete GEXF schema validator. Dynamic graphs,
slice graphs, temporal values/spells, hierarchical/parent structures, mutual edges,
unsupported attribute types, and document type declarations are rejected explicitly.
Duplicate IDs or attribute declarations, undeclared application attributes, missing
required record attributes, and endpoints referencing undeclared nodes are rejected.
Foreign namespace extensions are ignored. See the [GEXF specification](https://gexf.net/schema.html).
