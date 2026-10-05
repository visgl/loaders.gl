# @loaders.gl/graphs

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
