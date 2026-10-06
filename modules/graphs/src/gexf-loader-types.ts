// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {GraphShape} from './graph-types';
import type {GEXFOutput} from './gexf-types';

/** Options for selecting the GEXF graph output representation. */
export type GEXFLoaderOptions = {
  /** GEXF-specific graph options. */
  gexf?: {
    /** Representation of each named table; defaults to Arrow. */
    shape?: GraphShape;
  };
};

// @ts-ignore __VERSION__ is injected by the build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the GEXF parser implementation. */
async function preload() {
  const {GEXFLoaderWithParser} = await import('@loaders.gl/graphs/gexf-loader');
  return GEXFLoaderWithParser;
}

/** Metadata-only loader for static GEXF 1.2 and 1.3 documents. */
export const GEXFLoader = {
  name: 'GEXF',
  id: 'gexf',
  module: 'graphs',
  version: VERSION,
  extensions: ['gexf'],
  mimeTypes: ['application/gexf+xml'],
  text: true,
  worker: false,
  dataType: null as unknown as GEXFOutput,
  batchType: null as never,
  options: {gexf: {shape: 'arrow-table'}},
  preload
} as const satisfies Loader<GEXFOutput, never, GEXFLoaderOptions>;
