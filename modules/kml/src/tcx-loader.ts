// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  GeoJSONTable,
  ObjectRowTable,
  BinaryFeatureCollection,
  ArrowTable
} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TCXLoaderOptions = LoaderOptions & {
  tcx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary' | 'raw';
  };
};

const TCX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase`;

/** Preloads the parser-bearing TCX loader implementation. */
async function preload() {
  const {TCXLoaderWithParser} = await import('./tcx-loader-with-parser');
  return TCXLoaderWithParser;
}

/** Metadata-only loader for TCX (Training Center XML). */
export const TCXLoader = {
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  batchType: null as never,

  name: 'TCX (Training Center XML)',
  id: 'tcx',
  module: 'kml',
  version: VERSION,
  extensions: ['tcx'],
  mimeTypes: ['application/vnd.garmin.tcx+xml'],
  text: true,
  tests: [TCX_HEADER],
  options: {
    tcx: {shape: 'geojson-table'},
    gis: {}
  },
  preload
} as const satisfies Loader<
  ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  never,
  TCXLoaderOptions
>;
