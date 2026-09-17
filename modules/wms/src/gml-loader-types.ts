// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import type {GMLFeatureCollection, Geometry, ParseGMLOptions} from './lib/parsers/gml/parse-gml';

import {GMLFormat} from './wms-format';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for GML feature and geometry parsing. */
export type GMLLoaderOptions = LoaderOptions & {
  /** GML parser and output options. */
  gml?: ParseGMLOptions & {
    /** Arrow feature table by default; geojson preserves the legacy geometry/collection. */
    shape?: 'arrow-table' | 'geojson';
    /** Number of feature members emitted in each streaming batch. */
    batchSize?: number;
  };
};

/** Preloads the parser-bearing GML loader implementation. */
async function preload() {
  const {GMLLoaderWithParser} = await import('@loaders.gl/wms/gml-loader');
  return GMLLoaderWithParser;
}

/** Metadata-only loader for GML geometry responses. */
export const GMLLoader = {
  ...GMLFormat,
  dataType: null as unknown as ArrowTable | Geometry | GMLFeatureCollection | null,
  batchType: null as unknown as ArrowTableBatch | GMLFeatureCollection,

  name: 'GML',
  id: 'gml',

  module: 'wms',
  version: VERSION,
  worker: false,
  encoding: 'xml',
  format: 'gml',
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.gml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    gml: {shape: 'arrow-table'}
  },
  preload
} as const satisfies Loader<
  ArrowTable | Geometry | GMLFeatureCollection | null,
  ArrowTableBatch | GMLFeatureCollection,
  GMLLoaderOptions
>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
