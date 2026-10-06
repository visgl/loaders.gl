// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ObjectRowTable, Tables} from '@loaders.gl/schema';

/** A graph node with its original identifier and application attributes. */
export type GraphNode = {
  /** Original node identifier. */
  id: string | number;
  /** Application node or edge label. */
  label?: string;
  /** Application data values indexed by attribute name. */
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

/** Standard table representations supported by graph loaders. */
export type GraphShape = 'arrow-table' | 'object-row-table' | 'plain-graph-data';

/** Named node and edge tables in document order. */
export type GraphTables<TableType = ArrowTable> = Tables<TableType> & {
  /** Node table followed by edge table. */
  tables: [{name: 'nodes'; table: TableType}, {name: 'edges'; table: TableType}];
};

/** Graph loader output, with Arrow tables as the default representation. */
export type GraphOutput = GraphTables | GraphTables<ObjectRowTable> | GraphData;

/** Scalar and list types declared by graph format attributes. */
export type GraphAttributeType =
  | 'boolean'
  | 'int'
  | 'long'
  | 'float'
  | 'double'
  | 'string'
  | {
      /** Declared element type for a GEXF list attribute. */
      list: GraphAttributeType;
    };

/** Declared application attribute schemas for each graph table. */
export type GraphAttributeSchemas = {
  /** Declared node attributes, including keys with no values. */
  nodes: Map<string, GraphAttributeType>;
  /** Declared edge attributes, including keys with no values. */
  edges: Map<string, GraphAttributeType>;
};
