// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GraphOutput} from './graph-types';

/** Static GEXF document metadata, retained in every output shape. */
export type GEXFMetadata = {
  /** Document format version, when supplied. */
  version?: string;
  /** Default direction used by edges without a type override. */
  directed: boolean;
  /** Document author, description, keywords, and modification date. */
  attributes: Record<string, string>;
};

/** Standard graph tables or plain records with GEXF document metadata. */
export type GEXFOutput = GraphOutput & {
  /** Document metadata and graph-wide direction. */
  metadata: GEXFMetadata;
};
