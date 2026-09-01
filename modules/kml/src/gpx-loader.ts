// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  GeoJSONTable,
  ObjectRowTable,
  BinaryFeatureCollection,
  ArrowTable,
  GeoArrowEncodingPreference
} from '@loaders.gl/schema';
import {GPXFormat} from './kml-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GPXLoaderOptions = LoaderOptions & {
  /** Preferred encoding for Arrow geometry output. */
  geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  gpx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary-geometry' | 'raw';
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  };
};

/** Preloads the parser-bearing GPX loader implementation. */
async function preload() {
  const {GPXLoaderWithParser} = await import('./gpx-loader-with-parser');
  return GPXLoaderWithParser;
}

/** Metadata-only loader for GPX (GPS exchange format). */
export const GPXLoader = {
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  batchType: null as never,

  ...GPXFormat,
  version: VERSION,
  options: {
    gpx: {shape: 'arrow-table'},
    gis: {}
  },
  preload
} as const satisfies Loader<
  ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  never,
  GPXLoaderOptions
>;
