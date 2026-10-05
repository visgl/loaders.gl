// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {GraphData} from './graph-types';

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
  dataType: null as unknown as GraphData,
  batchType: null as never,
  options: {},
  preload
} as const satisfies Loader<GraphData, never>;
