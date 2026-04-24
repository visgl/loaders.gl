// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
// import {geojsonToBinary} from '@loaders.gl/gis';
// import {GeoJSONTable} from '@loaders.gl/schema';
import type {GeoJSONTable, ObjectRowTable, ArrowTable} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMLLoaderOptions = LoaderOptions & {
  kml?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary' | 'raw';
  };
};

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">`;

/** Preloads the parser-bearing KML loader implementation. */
async function preload() {
  const {KMLLoaderWithParser} = await import('./kml-loader-with-parser');
  return KMLLoaderWithParser;
}

/** Metadata-only loader for KML (Keyhole Markup Language). */
export const KMLLoader = {
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | ArrowTable,
  batchType: null as never,

  name: 'KML (Keyhole Markup Language)',
  id: 'kml',
  module: 'kml',
  version: VERSION,
  extensions: ['kml'],
  mimeTypes: ['application/vnd.google-earth.kml+xml'],
  text: true,
  tests: [KML_HEADER],
  options: {
    kml: {shape: 'geojson-table'},
    gis: {}
  },
  preload
} as const satisfies Loader<ObjectRowTable | GeoJSONTable | ArrowTable, never, KMLLoaderOptions>;
