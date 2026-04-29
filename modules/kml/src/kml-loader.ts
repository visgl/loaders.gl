// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
// import {geojsonToBinary} from '@loaders.gl/gis';
// import {GeoJSONTable} from '@loaders.gl/schema';
import type {GeoJSONTable, ObjectRowTable, ArrowTable} from '@loaders.gl/schema';
import {KMLFormat} from './kml-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMLLoaderOptions = LoaderOptions & {
  kml?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary' | 'raw';
  };
};

/** Preloads the parser-bearing KML loader implementation. */
async function preload() {
  const {KMLLoaderWithParser} = await import('./kml-loader-with-parser');
  return KMLLoaderWithParser;
}

/** Metadata-only loader for KML (Keyhole Markup Language). */
export const KMLLoader = {
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | ArrowTable,
  batchType: null as never,

  ...KMLFormat,
  version: VERSION,
  options: {
    kml: {shape: 'geojson-table'},
    gis: {}
  },
  preload
} as const satisfies Loader<ObjectRowTable | GeoJSONTable | ArrowTable, never, KMLLoaderOptions>;
