// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable, TableBatch} from '@loaders.gl/core/schema';
import type {GeoJSONLoaderOptions} from './geojson-loader-types';
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
    shape?: 'arrow' | 'object-row-table';
  };
};

/** Metadata-only loader for newline-delimited GeoJSON features. */
export const NDGeoJSONLoader = {
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  ...NDGeoJSONFormat,
  version: VERSION,
  dataType: null as unknown as Table | ObjectRowTable,
  batchType: null as unknown as RecordBatch | TableBatch,
  options: {geojson: {shape: 'arrow'}},
  preload: async (): Promise<
    LoaderWithParser<Table | ObjectRowTable, RecordBatch | TableBatch, NDGeoJSONLoaderOptions>
  > => (await import('@loaders.gl/tables/ndgeojson-loader')).NDGeoJSONLoaderWithParser
} as const satisfies Loader<
  Table | ObjectRowTable,
  RecordBatch | TableBatch,
  NDGeoJSONLoaderOptions
>;
