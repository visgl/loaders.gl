// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {DOTGraphData} from './dot-types';

// @ts-ignore __VERSION__ is injected by the build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
  dataType: null as unknown as DOTGraphData,
  batchType: null as never,
  options: {}
} as const satisfies Loader<DOTGraphData, never>;
