// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from './lib/parsers/gml/parse-gml';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GMLLoaderOptions = LoaderOptions & {
  gml?: {};
};

/** Preloads the parser-bearing GML loader implementation. */
async function preload() {
  const {GMLLoaderWithParser} = await import('./gml-loader-with-parser');
  return GMLLoaderWithParser;
}

/** Metadata-only loader for GML geometry responses. */
export const GMLLoader = {
  dataType: null as unknown as Geometry | null,
  batchType: null as never,

  name: 'GML',
  id: 'gml',

  module: 'wms',
  version: VERSION,
  worker: false,
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.gml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    gml: {}
  },
  preload
} as const satisfies Loader<Geometry | null, never, GMLLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
