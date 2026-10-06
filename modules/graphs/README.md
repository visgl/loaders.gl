# @loaders.gl/graphs

Framework-independent loaders for GraphML and Graphviz DOT documents.

## Graph output shapes

Both loaders default to `graphml.shape: 'arrow-table'` or `dot.shape: 'arrow-table'`.
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
