// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {DOTOutput} from './dot-types';
import type {GraphShape} from './graph-types';

/** Options for selecting the DOT graph output representation. */
export type DOTLoaderOptions = {
  /** Format-specific graph options. */
  dot?: {
    /** Representation of each named table; defaults to Arrow. */
    shape?: GraphShape;
  };
};

// @ts-ignore __VERSION__ is injected by the build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the DOT parser implementation. */
async function preload() {
  const {DOTLoaderWithParser} = await import('@loaders.gl/graphs/dot-loader');
  return DOTLoaderWithParser;
}

/** Metadata-only loader for Graphviz DOT documents. */
export const DOTLoader = {
  name: 'DOT',
  id: 'dot',
  module: 'graphs',
  version: VERSION,
  extensions: ['dot', 'gv'],
  mimeTypes: ['text/vnd.graphviz', 'text/x-graphviz', 'application/vnd.graphviz'],
  text: true,
  worker: false,
  dataType: null as unknown as DOTOutput,
  batchType: null as never,
  options: {dot: {shape: 'arrow-table'}},
  preload
} as const satisfies Loader<DOTOutput, never, DOTLoaderOptions>;
