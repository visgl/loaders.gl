// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {JSONLoaderOptions} from './json-loader-types';
export {JSONFormat, GeoJSONFormat, NDJSONFormat, NDGeoJSONFormat} from './json-format';
export {JSONLoader} from './json-loader-types';
export type {JSONTableLoaderOptions} from './json-table-loader-types';
import {JSONTableLoader as JSONTableParserLoader} from './json-table-loader-types';
import {JSON_TABLE_SOURCE, type JSONTableSource} from './json-table-source';
import type {LoaderWithDataSource} from '@loaders.gl/core/loader-utils';

/** Parses JSON tables or opens a query source through the JSON entry point. */
export const JSONTableLoader = {
  ...JSONTableParserLoader,
  ...JSON_TABLE_SOURCE,
  sourceOnly: false,
  preload: async () => ({
    ...(await JSONTableParserLoader.preload()),
    ...JSON_TABLE_SOURCE,
    sourceOnly: false as const
  })
} as const satisfies LoaderWithDataSource<JSONTableSource>;
export {
  JSONTableSource,
  JSONTableSourceLoader,
  type JSONTableSourceOptions
} from './json-table-source';
export type {NDJSONLoaderOptions} from './ndjson-loader-types';
export {NDJSONLoader} from './ndjson-loader-types';
export {NDGeoJSONLoader, type NDGeoJSONLoaderOptions} from './ndgeojson-loader-types';
export {NDJSONSourceLoader, NDJSONTableSource} from './ndjson-source';
export type {NDJSONSourceOptions} from './ndjson-source';
export type {
  ArrowConversionOptions,
  GeoJSONArrowConversionOptions,
  JSONArrowConversionOptions,
  JSONArrowSchema
} from './lib/parsers/convert-row-table-to-arrow';

export type {JSONWriterOptions} from './json-writer';
export {JSONWriter} from './json-writer';

export type {GeoJSONLoaderOptions} from './geojson-loader-types';
import {GeoJSONLoader as GeoJSONLoaderMetadata} from './geojson-loader-types';
import {
  deserializeArrowWorkerResult,
  serializeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';

/** Compatibility metadata retains Arrow worker transport hooks. */
export const GeoJSONLoader = {
  ...GeoJSONLoaderMetadata,
  serializeWorkerResult: serializeArrowWorkerResult,
  deserializeWorkerResult: deserializeArrowWorkerResult
} as const;
/** @deprecated Use GeoJSONLoader. */
export const GeoJSONWorkerLoader = GeoJSONLoader;

export type {GeoJSONWriterOptions} from './geojson-writer';
export {GeoJSONWriter} from './geojson-writer';

export {default as _JSONPath} from './lib/jsonpath/jsonpath';
export {default as _ClarinetParser} from './lib/clarinet/clarinet';
export {default as _FastStreamingJSONParser} from './lib/json-parser/fast-streaming-json-parser';

export {rebuildJsonObject as _rebuildJsonObject} from './lib/parsers/parse-json-in-batches';
