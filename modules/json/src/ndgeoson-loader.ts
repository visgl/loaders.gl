// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrayRowTable, ObjectRowTable, Batch} from '@loaders.gl/schema';
import {NDGeoJSONFormat} from './json-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for NDGeoJSONLoader */
export type NDGeoJSONLoaderOptions = LoaderOptions & {
  geojson?: {
    shape?: 'object-row-table';
  };
  gis?: {
    format: 'geojson';
  };
};

/** Preloads the parser-bearing NDGeoJSON loader implementation. */
async function preload() {
  const {NDJSONLoaderWithParser} = await import('./ndgeoson-loader-with-parser');
  return NDJSONLoaderWithParser;
}

/** Metadata-only loader for newline-delimited GeoJSON files. */
export const NDJSONLoader = {
  dataType: null as unknown as ArrayRowTable | ObjectRowTable,
  batchType: null as unknown as Batch,

  ...NDGeoJSONFormat,
  version: VERSION,
  options: {
    geojson: {
      shape: 'object-row-table'
    },
    gis: {
      format: 'geojson'
    }
  },
  preload
} as const satisfies Loader<ArrayRowTable | ObjectRowTable, Batch, NDGeoJSONLoaderOptions>;
