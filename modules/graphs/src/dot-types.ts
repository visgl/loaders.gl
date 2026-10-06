// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GraphData} from './graph-types';

/** Application attributes parsed from DOT. */
type DOTAttributeMap = Record<string, unknown>;

/** A named or generated DOT subgraph descriptor. */
export type DOTSubgraph = {
  /** Original or generated subgraph identifier. */
  id: string;
  /** Attributes declared in the subgraph. */
  attributes: DOTAttributeMap;
  /** Enclosing subgraph identifier, if present. */
  parentId?: string | null;
};

/** Graph-wide DOT attributes and structure. */
export type DOTMetadata = {
  /** Original graph identifier, if present. */
  id?: string;
  /** Whether the document declares a digraph. */
  directed: boolean;
  /** Whether the document declares a strict graph. */
  strict: boolean;
  /** Graph-wide attributes. */
  attributes: DOTAttributeMap;
  /** Subgraph descriptors in document order. */
  subgraphs: DOTSubgraph[];
};

/** A DOT graph with graph attributes and subgraph descriptors. */
export type DOTGraphData = GraphData & {
  /** DOT graph identity, direction, strictness, attributes, and subgraphs. */
  metadata: DOTMetadata;
};
