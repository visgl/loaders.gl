// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {GraphOutput, GraphShape} from './graph-types';

/** Options for selecting the GraphML graph output representation. */
export type GraphMLLoaderOptions = {
  /** Format-specific graph options. */
  graphml?: {
    /** Representation of each named table; defaults to Arrow. */
    shape?: GraphShape;
  };
};

// @ts-ignore __VERSION__ is injected by the build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the GraphML parser implementation. */
async function preload() {
  const {GraphMLLoaderWithParser} = await import('@loaders.gl/graphs/graphml-loader');
  return GraphMLLoaderWithParser;
}

/** Metadata-only loader for GraphML 1.0 documents. */
export const GraphMLLoader = {
  name: 'GraphML',
  id: 'graphml',
  module: 'graphs',
  version: VERSION,
  extensions: ['graphml'],
  mimeTypes: ['application/graphml+xml'],
  text: true,
  worker: false,
  dataType: null as unknown as GraphOutput,
  batchType: null as never,
  options: {graphml: {shape: 'arrow-table'}},
  preload
} as const satisfies Loader<GraphOutput, never, GraphMLLoaderOptions>;
