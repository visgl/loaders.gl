// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, ObjectRowTable, TableBatch} from '@loaders.gl/schema';
import type {GeoJSONLoaderOptions} from './geojson-loader';
import {NDGeoJSONFormat} from './json-format';

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for newline-delimited GeoJSON feature tables. */
export type NDGeoJSONLoaderOptions = LoaderOptions & {
  /** Shared GeoJSON Arrow schema and conversion policy. */
  json?: GeoJSONLoaderOptions['json'];
  /** Preferred Arrow geometry encoding. */
  geoarrow?: GeoJSONLoaderOptions['geoarrow'];
  /** Output options, shared with the legacy NDGeoJSON loader. */
  geojson?: {
    /** Arrow by default; object rows preserve complete GeoJSON features. */
    shape?: 'arrow-table' | 'object-row-table';
  };
};

/** Metadata-only loader for newline-delimited GeoJSON features. */
export const NDGeoJSONLoader = {
  ...NDGeoJSONFormat,
  version: VERSION,
  dataType: null as unknown as ArrowTable | ObjectRowTable,
  batchType: null as unknown as ArrowTableBatch | TableBatch,
  options: {geojson: {shape: 'arrow-table'}},
  preload: async () => (await import('@loaders.gl/json/ndgeojson-loader')).NDGeoJSONLoaderWithParser
} as const satisfies Loader<
  ArrowTable | ObjectRowTable,
  ArrowTableBatch | TableBatch,
  NDGeoJSONLoaderOptions
>;
