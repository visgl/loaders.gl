// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A graph node with its original identifier and application attributes. */
export type GraphNode = {
  /** Original node identifier. */
  id: string | number;
  /** Label declared by a GraphML label key. */
  label?: string;
  /** Typed GraphML data values indexed by attribute name. */
  attributes?: Record<string, unknown>;
};

/** A graph edge referencing node identifiers. */
export type GraphEdge = GraphNode & {
  /** Source node identifier. */
  sourceId: string | number;
  /** Target node identifier. */
  targetId: string | number;
  /** Whether the edge is directed. */
  directed: boolean;
};

/** Framework-independent graph records, compatible with deck.gl-community PlainGraphData. */
export type GraphData = {
  /** Discriminator for plain graph data. */
  shape: 'plain-graph-data';
  /** Nodes in document order. */
  nodes: GraphNode[];
  /** Edges in document order. */
  edges: GraphEdge[];
};
