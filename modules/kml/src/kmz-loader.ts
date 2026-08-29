// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {GeoJSONTable, ObjectRowTable, ArrowTable} from '@loaders.gl/schema';
import {KMZFormat} from './kml-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMZLoaderOptions = LoaderOptions & {
  kmz?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table';
    includeKMLMetadata?: boolean;
  };
};

/** Preloads the parser-bearing KMZ loader implementation. */
async function preload() {
  const {KMZLoaderWithParser} = await import('./kmz-loader-with-parser');
  return KMZLoaderWithParser;
}

/** Metadata-only loader for KMZ archives containing KML documents. */
export const KMZLoader = {
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | ArrowTable,
  batchType: null as never,

  ...KMZFormat,
  version: VERSION,
  options: {
    kmz: {shape: 'arrow-table', includeKMLMetadata: false},
    gis: {}
  },
  preload
} as const satisfies Loader<ObjectRowTable | GeoJSONTable | ArrowTable, never, KMZLoaderOptions>;
