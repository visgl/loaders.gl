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

export type GPXLoaderOptions = LoaderOptions & {
  gpx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary' | 'raw';
  };
};

const GPX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<gpx`;

/** Preloads the parser-bearing GPX loader implementation. */
async function preload() {
  const {GPXLoaderWithParser} = await import('./gpx-loader-with-parser');
  return GPXLoaderWithParser;
}

/** Metadata-only loader for GPX (GPS exchange format). */
export const GPXLoader = {
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  batchType: null as never,

  name: 'GPX (GPS exchange format)',
  id: 'gpx',
  module: 'kml',
  version: VERSION,
  extensions: ['gpx'],
  mimeTypes: ['application/gpx+xml'],
  text: true,
  tests: [GPX_HEADER],
  options: {
    gpx: {shape: 'geojson-table'},
    gis: {}
  },
  preload
} as const satisfies Loader<
  ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  never,
  GPXLoaderOptions
>;
